(function initExporters(root, factory) {
  const isNode = typeof module === 'object' && module.exports;
  const docxLib = isNode ? require('docx') : root.docx;
  const pdfLib = isNode ? require('pdf-lib') : root.PDFLib;
  const core = isNode ? require('./core.js') : root.SeabraCore;
  const api = factory(docxLib, pdfLib, core, root);
  if (isNode) module.exports = api;
  if (root) root.SeabraExporters = api;
})(typeof window !== 'undefined' ? window : globalThis, function createExporters(docxLib, pdfLib, core, root) {
  const A4_TWIPS = { width: 11906, height: 16838 };
  const MARGINS_TWIPS = { top: 1417, right: 1701, bottom: 1417, left: 1701 };
  const CONTENT_WIDTH_TWIPS = A4_TWIPS.width - MARGINS_TWIPS.left - MARGINS_TWIPS.right;
  const DOCUMENT_FONT = 'Times New Roman';

  function wordRuns(text, options = {}) {
    return String(text).split('\n').map((line, index) => new docxLib.TextRun({
      text: line || ' ',
      break: index ? 1 : 0,
      font: DOCUMENT_FONT,
      size: options.size || 22,
      bold: Boolean(options.bold),
    }));
  }

  function wordParagraph(block) {
    if (block.type === 'heading') {
      const isTitle = block.level !== 2;
      return new docxLib.Paragraph({
        children: wordRuns(block.text, { size: isTitle ? 32 : 24, bold: true }),
        alignment: isTitle ? docxLib.AlignmentType.CENTER : docxLib.AlignmentType.LEFT,
        spacing: { before: isTitle ? 0 : 260, after: isTitle ? 300 : 120 },
        keepNext: true,
      });
    }
    if (block.type === 'bullet') {
      return new docxLib.Paragraph({
        children: wordRuns(block.text),
        bullet: { level: 0 },
        spacing: { after: 100, line: 300 },
      });
    }
    return new docxLib.Paragraph({
      children: wordRuns(block.text),
      alignment: block.role === 'date'
        ? docxLib.AlignmentType.RIGHT
        : block.role === 'signature'
          ? docxLib.AlignmentType.CENTER
          : docxLib.AlignmentType.LEFT,
      spacing: { after: block.role === 'signature' ? 20 : 180, line: 320 },
    });
  }

  function wordTable(block) {
    const columnWidths = [Math.round(CONTENT_WIDTH_TWIPS * 0.34), Math.round(CONTENT_WIDTH_TWIPS * 0.66)];
    return new docxLib.Table({
      width: { size: CONTENT_WIDTH_TWIPS, type: docxLib.WidthType.DXA },
      columnWidths,
      rows: block.rows.map((row) => new docxLib.TableRow({
        children: row.map((cell, index) => new docxLib.TableCell({
          width: { size: columnWidths[index] || columnWidths[1], type: docxLib.WidthType.DXA },
          shading: index === 0 ? { fill: 'F2F4F4' } : undefined,
          margins: { top: 100, right: 120, bottom: 100, left: 120 },
          children: [new docxLib.Paragraph({
            children: wordRuns(cell, { bold: index === 0, size: 21 }),
            spacing: { after: 0, line: 280 },
          })],
        })),
      })),
    });
  }

  function createWordDocument(documents) {
    const children = [];
    documents.forEach((document, documentIndex) => {
      document.blocks.forEach((block) => {
        children.push(block.type === 'table' ? wordTable(block) : wordParagraph(block));
      });
      if (documentIndex < documents.length - 1) {
        children.push(new docxLib.Paragraph({ children: [new docxLib.PageBreak()] }));
      }
    });
    return new docxLib.Document({
      creator: 'Hospital da Visao',
      title: 'Documentos oftalmologicos',
      description: 'Documentos revisados e gerados localmente',
      sections: [{
        properties: {
          page: {
            size: A4_TWIPS,
            margin: MARGINS_TWIPS,
          },
        },
        children,
      }],
    });
  }

  async function buildDocxBytes(documents) {
    const wordDocument = createWordDocument(documents);
    if (typeof window === 'undefined') {
      return new Uint8Array(await docxLib.Packer.toBuffer(wordDocument));
    }
    const blob = await docxLib.Packer.toBlob(wordDocument);
    return new Uint8Array(await blob.arrayBuffer());
  }

  function normalizePdfText(text) {
    return String(text)
      .normalize('NFC')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/\u2022/g, '-')
      .replace(/[^\x09\x0A\x0D\x20-\xFF]/g, '?');
  }

  function wrapPdfText(text, font, size, width) {
    const lines = [];
    for (const sourceLine of normalizePdfText(text).split('\n')) {
      const words = sourceLine.split(/\s+/).filter(Boolean);
      if (!words.length) { lines.push(' '); continue; }
      let current = words.shift();
      for (const word of words) {
        const candidate = `${current} ${word}`;
        if (font.widthOfTextAtSize(candidate, size) <= width) current = candidate;
        else { lines.push(current); current = word; }
      }
      lines.push(current);
    }
    return lines;
  }

  async function buildPdfBytes(documents) {
    const pdf = await pdfLib.PDFDocument.create();
    const regular = await pdf.embedFont(pdfLib.StandardFonts.TimesRoman);
    const bold = await pdf.embedFont(pdfLib.StandardFonts.TimesRomanBold);
    const [pageWidth, pageHeight] = pdfLib.PageSizes.A4;
    const marginX = 85.04;
    const marginTop = 70.87;
    const marginBottom = 70.87;
    const contentWidth = pageWidth - (marginX * 2);
    let page;
    let y;

    function newPage() {
      page = pdf.addPage([pageWidth, pageHeight]);
      y = pageHeight - marginTop;
    }

    function ensureSpace(height) {
      if (y - height < marginBottom) newPage();
    }

    function drawLines(lines, options = {}) {
      const font = options.bold ? bold : regular;
      const size = options.size || 11;
      const lineHeight = options.lineHeight || size * 1.42;
      if (options.before) {
        ensureSpace(options.before + lineHeight);
        y -= options.before;
      }
      lines.forEach((line) => {
        ensureSpace(lineHeight);
        let x = marginX + (options.indent || 0);
        if (options.align === 'right') x = pageWidth - marginX - font.widthOfTextAtSize(line, size);
        if (options.align === 'center') x = (pageWidth - font.widthOfTextAtSize(line, size)) / 2;
        page.drawText(line, { x, y: y - size, size, font, color: pdfLib.rgb(0.06, 0.08, 0.09) });
        y -= lineHeight;
      });
      y -= options.after || 9;
    }

    function drawParagraph(block) {
      if (block.type === 'heading') {
        const title = block.level !== 2;
        const size = title ? 16 : 12;
        const lines = wrapPdfText(block.text, bold, size, contentWidth);
        drawLines(lines, { bold: true, size, lineHeight: size * 1.3, before: title ? 0 : 8, after: title ? 18 : 8, align: title ? 'center' : 'left' });
        return;
      }
      if (block.type === 'bullet') {
        const lines = wrapPdfText(`- ${block.text}`, regular, 11, contentWidth - 12);
        drawLines(lines, { indent: 12, after: 6 });
        return;
      }
      const lines = wrapPdfText(block.text, regular, 11, contentWidth);
      drawLines(lines, {
        align: block.role === 'date' ? 'right' : block.role === 'signature' ? 'center' : 'left',
        after: block.role === 'signature' ? 1 : 9,
      });
    }

    function drawTable(block) {
      const firstWidth = contentWidth * 0.34;
      const secondWidth = contentWidth - firstWidth;
      for (const row of block.rows) {
        const leftLines = wrapPdfText(row[0], bold, 10.5, firstWidth - 12);
        const rightLines = wrapPdfText(row[1], regular, 10.5, secondWidth - 12);
        const lineHeight = 14;
        const rowHeight = Math.max(leftLines.length, rightLines.length) * lineHeight + 12;
        ensureSpace(rowHeight + 8);
        page.drawRectangle({ x: marginX, y: y - rowHeight, width: firstWidth, height: rowHeight, color: pdfLib.rgb(0.95, 0.96, 0.96), borderColor: pdfLib.rgb(0.55, 0.6, 0.61), borderWidth: 0.6 });
        page.drawRectangle({ x: marginX + firstWidth, y: y - rowHeight, width: secondWidth, height: rowHeight, borderColor: pdfLib.rgb(0.55, 0.6, 0.61), borderWidth: 0.6 });
        leftLines.forEach((line, index) => page.drawText(line, { x: marginX + 6, y: y - 11 - (index * lineHeight), size: 10.5, font: bold }));
        rightLines.forEach((line, index) => page.drawText(line, { x: marginX + firstWidth + 6, y: y - 11 - (index * lineHeight), size: 10.5, font: regular }));
        y -= rowHeight;
      }
      y -= 12;
    }

    documents.forEach((document) => {
      newPage();
      document.blocks.forEach((block) => {
        if (block.type === 'table') drawTable(block);
        else drawParagraph(block);
      });
    });
    pdf.setTitle('Documentos oftalmologicos');
    pdf.setAuthor('Dr. Gustavo Garcia');
    pdf.setCreator('Dashboard local - Hospital da Visao');
    return pdf.save();
  }

  function downloadBytes(bytes, mimeType, filename) {
    const blob = new Blob([bytes], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function exportDocx(documents, state) {
    const bytes = await buildDocxBytes(documents);
    downloadBytes(bytes, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', `${core.safeFilename(state.patientName, state.currentDate)}.docx`);
  }

  async function exportPdf(documents, state) {
    const bytes = await buildPdfBytes(documents);
    downloadBytes(bytes, 'application/pdf', `${core.safeFilename(state.patientName, state.currentDate)}.pdf`);
  }

  function appendPrintableBlock(container, block) {
    if (block.type === 'table') {
      const table = document.createElement('table');
      table.className = 'document-table';
      const body = document.createElement('tbody');
      block.rows.forEach((row) => {
        const tr = document.createElement('tr');
        row.forEach((cell) => { const td = document.createElement('td'); td.textContent = cell; tr.appendChild(td); });
        body.appendChild(tr);
      });
      table.appendChild(body);
      container.appendChild(table);
      return;
    }
    const tag = block.type === 'heading' ? (block.level === 2 ? 'h2' : 'h1') : block.type === 'bullet' ? 'li' : 'p';
    const element = document.createElement(tag);
    element.className = 'document-block';
    if (block.role === 'date') element.classList.add('document-date');
    if (block.role === 'signature') element.classList.add('document-signature');
    element.textContent = block.text;
    if (block.type === 'bullet') {
      const list = document.createElement('ul');
      list.className = 'document-list';
      list.appendChild(element);
      container.appendChild(list);
    } else container.appendChild(element);
  }

  function printDocuments(documents, printRoot) {
    printRoot.replaceChildren();
    documents.forEach((item) => {
      const article = document.createElement('article');
      article.className = 'print-document';
      item.blocks.forEach((block) => appendPrintableBlock(article, block));
      printRoot.appendChild(article);
    });
    root.requestAnimationFrame(() => root.print());
  }

  return { buildDocxBytes, buildPdfBytes, exportDocx, exportPdf, printDocuments };
});
