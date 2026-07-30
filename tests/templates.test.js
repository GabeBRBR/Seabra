const test = require('node:test');
const assert = require('node:assert/strict');

const { getTemplates, buildDocument } = require('../src/templates.js');

function baseState(overrides = {}) {
  return {
    patientName: 'Alex Silva',
    gender: 'male',
    currentDate: new Date(2026, 6, 29, 12),
    surgeryDate: '2026-08-20',
    fieldValues: {},
    listSelections: {},
    ...overrides,
  };
}

test('registers all 12 templates in the four expected categories', () => {
  const templates = getTemplates();
  assert.equal(templates.length, 12);
  assert.deepEqual(
    [...new Set(templates.map((template) => template.category))],
    ['cartas', 'relatorios', 'exames', 'orientacoes'],
  );
});

test('template definitions contain no legacy patient identity', () => {
  const serialized = JSON.stringify(getTemplates());
  for (const legacyValue of [
    'Cristiane Ferreira',
    'Flavia Cristina',
    'Maria Aparecida Rodrigues',
    'Norma Lilia',
    'Diogo Martins',
    '036.926.901-26',
    '4606386',
  ]) {
    assert.equal(serialized.includes(legacyValue), false, legacyValue);
  }
});

test('builds a personalized cardiologist letter with grammar and current date', () => {
  const document = buildDocument('cardiologist-letter', baseState({
    patientName: 'Carlos Souza',
    gender: 'male',
    fieldValues: {
      'cardiologist-letter': {
        procedure: 'blefaroplastia bilateral',
        anesthesia: 'anestesia local e sedacao venosa',
      },
    },
  }));
  const text = document.blocks.map((block) => block.text || '').join('\n');
  assert.match(text, /29 de julho de 2026/);
  assert.match(text, /Sr\. Carlos Souza/);
  assert.match(text, /Ele deverá submeter-se a blefaroplastia bilateral/);
});

test('filters selectable clinic entries instead of printing unselected items', () => {
  const document = buildDocument('dacryoscintigraphy-locations', baseState({
    listSelections: { 'dacryoscintigraphy-locations': ['imen', 'cdi'] },
  }));
  const text = JSON.stringify(document.blocks);
  assert.match(text, /IMEN/);
  assert.match(text, /CDI/);
  assert.doesNotMatch(text, /IGR/);
});

test('adds exact suspension dates while preserving relative instructions', () => {
  const document = buildDocument('pre-op-medicines', baseState());
  const text = document.blocks.map((block) => block.text || '').join('\n');
  assert.match(text, /Aspirina \(AAS\).*Suspender 10 dias antes \(10\/08\/2026\)/);
  assert.match(text, /Rivaroxabana.*Suspender 72 horas antes \(17\/08\/2026\)/);
  assert.match(text, /Mounjaro.*Suspender 2 semanas antes \(06\/08\/2026\)/);
});

test('uses a fixed complete physician signature in personalized outputs', () => {
  const document = buildDocument('orthoptic-request', baseState({
    fieldValues: {
      'orthoptic-request': {
        indication: 'avaliacao de estrabismo',
        refractionOd: '+1,00',
        refractionOe: '+1,25',
        glassesOd: '+0,75',
        glassesOe: '+1,00',
        fundoscopy: 'normal',
      },
    },
  }));
  const text = document.blocks.map((block) => block.text || '').join('\n');
  assert.match(text, /Dr\. Gustavo Garcia/);
  assert.match(text, /CRM 7669-GO/);
});

test('uses neutral recipient wording without unresolved gender alternatives', () => {
  const letter = buildDocument('cardiologist-letter', baseState({
    fieldValues: {
      'cardiologist-letter': {
        procedure: 'blefaroplastia',
        anesthesia: 'anestesia local',
      },
    },
  }));
  assert.match(letter.blocks[1].text, /Serviço de Cardiologia/);
  assert.doesNotMatch(letter.blocks[1].text, /\(|\//);

  const report = buildDocument('oct-glaucoma', baseState({
    fieldValues: {
      'oct-glaucoma': {
        insurer: 'UNIMED', cupOd: '0,7', cupOe: '0,5', pressure: '12 mmHg', exam: 'OCT de CCG e CFN',
      },
    },
  }));
  assert.equal(report.blocks[1].text, 'À operadora de saúde UNIMED,');
});
