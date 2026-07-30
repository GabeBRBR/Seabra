const test = require('node:test');
const assert = require('node:assert/strict');
const JSZip = require('jszip');
const { PDFDocument } = require('pdf-lib');
const { buildDocxBytes, buildPdfBytes } = require('../src/exporters.js');

const documents = [
  {
    id: 'first',
    title: 'Primeiro documento',
    blocks: [
      { type: 'heading', level: 1, text: 'RELATORIO MEDICO' },
      { type: 'paragraph', text: 'Paciente: Joao da Silva.' },
      { type: 'bullet', text: 'Primeira orientacao.' },
      { type: 'paragraph', text: 'Dr. Gustavo Garcia', role: 'signature' },
    ],
  },
  {
    id: 'second',
    title: 'Segundo documento',
    blocks: [
      { type: 'paragraph', text: 'Goiania, 29 de julho de 2026', role: 'date' },
      { type: 'table', rows: [['Nome', 'Joao da Silva'], ['CPF', '123.456.789-00']] },
    ],
  },
];

test('builds one valid DOCX containing both documents and an explicit page break', async () => {
  const bytes = await buildDocxBytes(documents);
  assert.equal(Buffer.from(bytes).subarray(0, 2).toString(), 'PK');
  const zip = await JSZip.loadAsync(bytes);
  const documentXml = await zip.file('word/document.xml').async('string');
  assert.match(documentXml, /RELATORIO MEDICO/);
  assert.match(documentXml, /Joao da Silva/);
  assert.match(documentXml, /w:type="page"/);
});

test('formats DOCX document text in Times New Roman and centers the physician signature', async () => {
  const bytes = await buildDocxBytes(documents);
  const zip = await JSZip.loadAsync(bytes);
  const documentXml = await zip.file('word/document.xml').async('string');
  assert.match(documentXml, /w:ascii="Times New Roman"/);
  assert.match(documentXml, /<w:pPr>[^<]*<w:spacing[^>]*w:after="20"[^>]*\/><w:jc w:val="center"\/><\/w:pPr>[\s\S]*Dr\. Gustavo Garcia/);
});

test('builds one valid PDF with a page for each combined document', async () => {
  const bytes = await buildPdfBytes(documents);
  assert.equal(Buffer.from(bytes).subarray(0, 4).toString(), '%PDF');
  const pdf = await PDFDocument.load(bytes);
  assert.equal(pdf.getPageCount(), 2);
  assert.equal(pdf.getPage(0).getSize().width > 590, true);
  assert.equal(pdf.getPage(0).getSize().height > 840, true);
});

test('paginates long PDF content instead of drawing below the A4 page', async () => {
  const longDocument = [{
    id: 'long',
    title: 'Documento longo',
    blocks: Array.from({ length: 90 }, (_, index) => ({
      type: 'paragraph',
      text: `Paragrafo clinico numero ${index + 1} com conteudo suficiente para ocupar uma linha completa.`,
    })),
  }];
  const bytes = await buildPdfBytes(longDocument);
  const pdf = await PDFDocument.load(bytes);
  assert.equal(pdf.getPageCount() > 1, true);
});

test('splits one exceptionally long edited paragraph across multiple pages', async () => {
  const longText = Array.from({ length: 1200 }, (_, index) => `palavra${index + 1}`).join(' ');
  const bytes = await buildPdfBytes([{
    id: 'long-paragraph',
    title: 'Paragrafo longo',
    blocks: [{ type: 'paragraph', text: longText }],
  }]);
  const pdf = await PDFDocument.load(bytes);
  assert.equal(pdf.getPageCount() >= 4, true);
});
