(function initCore(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.SeabraCore = api;
})(typeof window !== 'undefined' ? window : globalThis, function createCore() {
  const MONTHS = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
  ];

  const GRAMMAR = {
    male: {
      honorific: 'Sr.', patient: 'o paciente', pronoun: 'Ele', carrier: 'portador', fit: 'apto',
    },
    female: {
      honorific: 'Sra.', patient: 'a paciente', pronoun: 'Ela', carrier: 'portadora', fit: 'apta',
    },
  };

  const PERSONALIZED_IDS = new Set([
    'cardiologist-letter',
    'optical-letter',
    'oct-glaucoma',
    'oct-macula',
    'oculoplastics-report',
    'ptosis-report',
    'conab-report',
    'orthoptic-request',
  ]);

  const REQUIRED_FIELDS = {
    'oct-glaucoma': {
      title: 'OCT para glaucoma',
      fields: ['insurer', 'cupOd', 'cupOe', 'pressure', 'exam'],
    },
    'oct-macula': {
      title: 'OCT de mácula',
      fields: ['insurer', 'acuityOd', 'acuityOe', 'findings', 'hypotheses', 'exam'],
    },
    'oculoplastics-report': {
      title: 'Relatório de oculoplástica',
      fields: ['birthDate', 'record', 'complaint', 'duration', 'mrd1Od', 'mrd1Oe', 'levatorOd', 'levatorOe', 'diagnosis', 'cid', 'laterality', 'procedure'],
    },
    'ptosis-report': {
      title: 'Cirurgia de ptose',
      fields: ['insurer', 'laterality', 'mrdOd', 'mrdOe', 'fissureOd', 'fissureOe', 'excursionOd', 'excursionOe', 'procedure'],
    },
    'conab-report': {
      title: 'Aptidão oftalmológica',
      fields: ['cpf', 'rg', 'indication', 'acuity', 'refractionOd', 'refractionOe', 'pressure', 'fundoscopy', 'perimetry', 'diagnosis', 'conclusion'],
    },
    'orthoptic-request': {
      title: 'Teste ortóptico',
      fields: ['indication', 'refractionOd', 'refractionOe', 'glassesOd', 'glassesOe', 'fundoscopy'],
    },
  };

  function parseLocalDate(value) {
    if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 12);
    const [year, month, day] = String(value).split('-').map(Number);
    return new Date(year, month - 1, day, 12);
  }

  function formatIsoDate(date) {
    const pad = (value) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function formatShortDate(date) {
    const pad = (value) => String(value).padStart(2, '0');
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
  }

  function formatLongDate(input) {
    const date = parseLocalDate(input);
    return `${date.getDate()} de ${MONTHS[date.getMonth()]} de ${date.getFullYear()}`;
  }

  function getGrammar(gender) {
    return GRAMMAR[gender] ? { ...GRAMMAR[gender] } : null;
  }

  function subtractSuspensionPeriod(surgeryDate, amount, unit) {
    const date = parseLocalDate(surgeryDate);
    const multiplier = unit === 'weeks' ? 7 : unit === 'hours' ? 1 / 24 : 1;
    date.setDate(date.getDate() - (amount * multiplier));
    return formatShortDate(date);
  }

  function appendSuspensionDate(instruction, surgeryDate, amount, unit) {
    const text = String(instruction).trim().replace(/\.$/, '');
    return `${text} (${subtractSuspensionPeriod(surgeryDate, amount, unit)}).`;
  }

  function validateGeneration(state) {
    const selectedIds = state.selectedIds || [];
    if (!selectedIds.length) return ['Selecione ao menos um documento.'];

    const errors = [];
    const needsPatient = selectedIds.some((id) => PERSONALIZED_IDS.has(id));
    if (needsPatient && !String(state.patientName || '').trim()) errors.push('Informe o nome do paciente.');
    if (needsPatient && !getGrammar(state.gender)) errors.push('Selecione o sexo do paciente.');
    if (selectedIds.includes('pre-op-medicines') && !state.surgeryDate) errors.push('Informe a data da cirurgia.');

    for (const id of selectedIds) {
      const rule = REQUIRED_FIELDS[id];
      if (!rule) continue;
      const values = (state.fieldValues && state.fieldValues[id]) || {};
      const missing = rule.fields.some((field) => !String(values[field] || '').trim());
      if (missing) errors.push(`Preencha todos os campos obrigatórios de ${rule.title}.`);
    }
    return errors;
  }

  function safeFilename(patientName, inputDate) {
    const date = parseLocalDate(inputDate);
    const normalized = String(patientName || 'sem-paciente')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'sem-paciente';
    return `documentos-${normalized}-${formatIsoDate(date)}`;
  }

  return {
    formatLongDate,
    getGrammar,
    subtractSuspensionPeriod,
    appendSuspensionDate,
    validateGeneration,
    safeFilename,
  };
});
