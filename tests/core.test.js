const test = require('node:test');
const assert = require('node:assert/strict');

const {
  formatLongDate,
  getGrammar,
  subtractSuspensionPeriod,
  appendSuspensionDate,
  validateGeneration,
  safeFilename,
} = require('../src/core.js');

test('formats a local date in long Brazilian Portuguese', () => {
  assert.equal(
    formatLongDate(new Date(2026, 6, 29, 12)),
    '29 de julho de 2026',
  );
});

test('returns complete masculine and feminine grammar maps', () => {
  assert.deepEqual(getGrammar('male'), {
    honorific: 'Sr.',
    patient: 'o paciente',
    pronoun: 'Ele',
    carrier: 'portador',
    fit: 'apto',
  });
  assert.deepEqual(getGrammar('female'), {
    honorific: 'Sra.',
    patient: 'a paciente',
    pronoun: 'Ela',
    carrier: 'portadora',
    fit: 'apta',
  });
});

test('subtracts suspension periods across leap-day and year boundaries', () => {
  assert.equal(subtractSuspensionPeriod('2024-03-01', 1, 'days'), '29/02/2024');
  assert.equal(subtractSuspensionPeriod('2026-01-05', 2, 'weeks'), '22/12/2025');
  assert.equal(subtractSuspensionPeriod('2026-07-29', 72, 'hours'), '26/07/2026');
});

test('keeps the clinical instruction and appends the calculated date', () => {
  assert.equal(
    appendSuspensionDate('Suspender 10 dias antes.', '2026-08-20', 10, 'days'),
    'Suspender 10 dias antes (10/08/2026).',
  );
});

test('requires selection, patient identity, clinical values, and surgery date when applicable', () => {
  assert.deepEqual(validateGeneration({ selectedIds: [] }), [
    'Selecione ao menos um documento.',
  ]);

  const errors = validateGeneration({
    selectedIds: ['oct-glaucoma', 'pre-op-medicines'],
    patientName: '',
    gender: '',
    surgeryDate: '',
    fieldValues: {
      'oct-glaucoma': { insurer: '', cupOd: '', cupOe: '', pressure: '', exam: '' },
    },
  });

  assert.ok(errors.includes('Informe o nome do paciente.'));
  assert.ok(errors.includes('Selecione o sexo do paciente.'));
  assert.ok(errors.includes('Informe a data da cirurgia.'));
  assert.ok(errors.some((message) => message.includes('OCT para glaucoma')));
});

test('creates an ASCII-safe filename without exposing punctuation', () => {
  assert.equal(
    safeFilename('Joao da Silva', new Date(2026, 6, 29, 12)),
    'documentos-Joao-da-Silva-2026-07-29',
  );
  assert.equal(
    safeFilename('Maria da Conceicao Araujo', new Date(2026, 0, 2, 12)),
    'documentos-Maria-da-Conceicao-Araujo-2026-01-02',
  );
});
