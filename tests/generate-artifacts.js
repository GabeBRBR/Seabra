const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { buildDocument } = require('../src/templates.js');
const { buildDocxBytes, buildPdfBytes } = require('../src/exporters.js');

(async () => {
  const outputDirectory = path.join(os.tmpdir(), 'seabra-dashboard-qa');
  fs.mkdirSync(outputDirectory, { recursive: true });
  const state = {
    patientName: 'Ana Maria de Souza',
    gender: 'female',
    currentDate: new Date(2026, 6, 29, 12),
    surgeryDate: '2026-08-20',
    fieldValues: {
      'cardiologist-letter': {
        procedure: 'blefaroplastia superior bilateral',
        anesthesia: 'anestesia loco-regional e sedacao venosa, acompanhada por anestesiologista',
      },
    },
    listSelections: {},
  };
  const documents = [
    buildDocument('cardiologist-letter', state),
    buildDocument('pre-op-medicines', state),
  ];
  const docxPath = path.join(outputDirectory, 'amostra-documentos.docx');
  const pdfPath = path.join(outputDirectory, 'amostra-documentos.pdf');
  fs.writeFileSync(docxPath, await buildDocxBytes(documents));
  fs.writeFileSync(pdfPath, await buildPdfBytes(documents));
  process.stdout.write(JSON.stringify({ docxPath, pdfPath }));
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
