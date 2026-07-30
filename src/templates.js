(function initTemplates(root, factory) {
  const core = typeof module === 'object' && module.exports
    ? require('./core.js')
    : root.SeabraCore;
  const api = factory(core);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.SeabraTemplates = api;
})(typeof window !== 'undefined' ? window : globalThis, function createTemplates(core) {
  const SIGNATURE = [
    { type: 'paragraph', text: 'Dr. Gustavo Garcia', role: 'signature' },
    { type: 'paragraph', text: 'Oftalmologista', role: 'signature' },
    { type: 'paragraph', text: 'CRM 7669-GO', role: 'signature' },
  ];

  const field = (name, label, options = {}) => ({
    name,
    label,
    type: 'text',
    required: true,
    ...options,
  });

  const LISTS = {
    locations: [
      { id: 'imen', label: 'IMEN', text: 'IMEN\nAlameda dos Buritis, 600 - Centro, Goiânia - GO, 74015-080\nTelefone: (62) 3216-6900' },
      { id: 'igr', label: 'IGR', text: 'IGR\nR. 84, 351, Setor Sul\nRua T-55, esquina com Avenida T-2, Setor Bueno\nTelefone: (62) 3224-1940\nMarcações: igr.com.br' },
      { id: 'cdi', label: 'CDI', text: 'CDI\nAv. Portugal, 496 - Quadra K9 - Lote 7/13 - Setor Oeste, Goiânia - GO, 74140-020\nTelefone: (62) 3121-7272' },
    ],
    pharmacies: [
      { id: 'artesanal', label: 'Artesanal', text: 'ARTESANAL (Goiânia)\nwww.farmaciaartesanal.com\nWhatsApp: (62) 98225-0062\nTelefone: (62) 3267-7000' },
      { id: 'ophthalmos', label: 'Ophthalmos', text: 'OPHTHALMOS\nwww.ophthalmos.com.br\nreceita@meucolirio.com.br\nTelefone: (11) 3488-3788' },
      { id: 'citopharma', label: 'Citopharma', text: 'CITOPHARMA\nwww.citopharma.com.br\natendimento@citopharma.com.br\nTelefone: (31) 3115-6000' },
      { id: 'dupatri', label: 'Dupatri', text: 'DUPATRI\nvendassp2@dupatri.com\nwww.dupatri.com.br\nTelefone: (13) 3228-8700' },
      { id: 'oftalmica', label: 'Oftálmica Manipulação', text: 'OFTÁLMICA MANIPULAÇÃO\nhttps://oftalmicamanipulacao.com.br/\nWhatsApp: (51) 99875-4242' },
      { id: 'neuvye', label: 'Neuvye', text: 'NEUVYE\nhttps://neuvye.com.br/\nTelefone: (41) 99205-8399' },
    ],
    lenses: [
      ['organic', 'Lentes orgânicas ou de alto índice (evitar policarbonato).'],
      ['antireflex', 'Tratamento antirreflexo: Duravision, Blue Protect, Blue Control, Crizal Forte, X-tra Clean ou Digital Blue.'],
      ['zeiss-light', 'Zeiss Light 2.'],
      ['multifocal-premium', 'Multifocais: Zeiss SmartLife Superb, Hoyalux MyStyle, Varilux S, Multigressiv MyView 2, EyeLT 2 ou FreeSign 3.'],
      ['multifocal-standard', 'Multifocais: Zeiss SmartLife Plus, Hoyalux LifeStyle 4, Sola Elan, Varilux, Natura 3.0 ou Progressive Life 4D.'],
      ['zeiss-individual', 'Zeiss SmartLife Individual 3.'],
      ['hoyalux-bks', 'Lentes multifocais Hoyalux BKS.'],
      ['hoyalux-balance', 'Lentes Hoyalux Balance.'],
      ['office-075', 'Lentes regressivas: Zeiss OfficeLens, Hoyalux Desktop (4 metros), Access com regressão de 0,75 ou Varilux Digitime.'],
      ['office-125', 'Lentes regressivas: Zeiss OfficeLens, Hoyalux Desktop (4 metros), Access com regressão de 1,25 ou Varilux Digitime.'],
      ['separate', 'Óculos para longe e perto separados.'],
      ['sunglasses', 'Óculos de sol com proteção UVA e UVB (até 400 nm).'],
      ['photochromic', 'Lentes fotossensíveis: PhotoFusion ou Transitions.'],
      ['digital', 'Hoya Sync (5, 9, 13), Zeiss Digital, Essilor Eyezen ou Monoplus 2.'],
      ['clearcare', 'ClearCare Plus com HydraGlyde.'],
    ].map(([id, text]) => ({ id, label: text, text })),
  };

  const MEDICATION_GROUPS = [
    {
      heading: 'Medicamentos',
      intro: 'Estes medicamentos podem aumentar o risco de sangramento:',
      items: [
        ['Aspirina (AAS): Inibe a agregação plaquetária.', 10, 'days', '10 dias'],
        ['Ibuprofeno, Naproxeno e outros AINEs: Prolongam o tempo de sangramento.', 7, 'days', '7 dias'],
        ['Varfarina: Anticoagulante; confirmar INR menor que 1,5.', 5, 'days', '5 dias'],
        ['Heparina não fracionada.', 6, 'hours', '6 horas'],
        ['Enoxaparina (LMWH).', 24, 'hours', '24 horas'],
        ['Rivaroxabana, Apixabana e Dabigatrana (DOACs), conforme avaliação médica.', 72, 'hours', '72 horas'],
        ['Clopidogrel, Prasugrel e Ticagrelor.', 7, 'days', '7 dias'],
        ['Minoxidil.', 14, 'days', '14 dias'],
      ],
    },
    {
      heading: 'Suplementos',
      intro: 'Podem interferir na hemostasia:',
      items: [
        ['Vitamina E.', 3, 'weeks', '3 semanas'],
        ['Óleo de peixe/Ômega-3 (as evidências variam).', 3, 'weeks', '3 semanas'],
        ['Glucosamina e Condroitina.', 3, 'weeks', '3 semanas'],
        ['Vitamina C em altas doses.', 1, 'weeks', '1 semana'],
        ['Complexo B em altas doses.', 1, 'weeks', '1 semana'],
        ['Multivitaminicos com inibidores.', 1, 'weeks', '1 semana'],
      ],
    },
    {
      heading: 'Substâncias naturais',
      intro: 'Ervas e alimentos que podem afetar plaquetas ou fibrinólise:',
      items: [
        ['Alho em cápsulas.', 14, 'days', '14 dias'],
        ['Gengibre.', 14, 'days', '14 dias'],
        ['Ginkgo biloba.', 14, 'days', '14 dias'],
        ['Ginseng.', 14, 'days', '14 dias'],
        ['Erva-de-São-João.', 5, 'days', '5 dias'],
        ['Unha-de-gato.', 2, 'weeks', '2 semanas'],
        ['Saw palmetto.', 3, 'weeks', '3 semanas'],
        ['Feverfew.', 2, 'weeks', '2 semanas'],
        ['Dong quai.', 3, 'weeks', '3 semanas'],
        ['Bromelina.', 3, 'weeks', '3 semanas'],
        ['Alcaçuz.', 3, 'weeks', '3 semanas'],
        ['Chá verde.', 2, 'weeks', '2 semanas'],
      ],
    },
    {
      heading: 'Canetas emagrecedoras',
      intro: '',
      items: [
        ['Mounjaro.', 2, 'weeks', '2 semanas'],
        ['Outras canetas emagrecedoras.', 3, 'weeks', '3 semanas'],
      ],
    },
  ];

  const TEMPLATES = [
    {
      id: 'cardiologist-letter', category: 'cartas', title: 'Carta ao cardiologista', personalized: true,
      description: 'Solicitação de risco cirúrgico para cirurgia palpebral.',
      fields: [
        field('procedure', 'Procedimento', { default: 'operação de pálpebras' }),
        field('anesthesia', 'Anestesia', { default: 'anestesia loco-regional e sedação venosa, acompanhada por anestesiologista' }),
      ],
    },
    {
      id: 'optical-letter', category: 'cartas', title: 'Carta para a ótica', personalized: true,
      description: 'Solicitação de ajuste ou troca de lentes.',
      fields: [
        field('reason', 'Motivo da solicitação', { default: 'altura inadequada, impedindo a adaptação' }),
        field('pantoscopicAngle', 'Inclinação pantoscópica', { default: '12 a 15 graus' }),
      ],
    },
    {
      id: 'oct-glaucoma', category: 'relatorios', title: 'Justificativa de OCT para glaucoma', personalized: true,
      description: 'Avaliação da camada de células ganglionares e fibras nervosas.',
      fields: [field('insurer', 'Convênio'), field('cupOd', 'Escavação OD'), field('cupOe', 'Escavação OE'), field('pressure', 'Pressão ocular'), field('exam', 'Exame solicitado', { default: 'OCT para avaliação da CCG e CFN' })],
    },
    {
      id: 'oct-macula', category: 'relatorios', title: 'Justificativa de OCT de mácula', personalized: true,
      description: 'Investigação de baixa visual e possíveis maculopatias.',
      fields: [field('insurer', 'Convênio'), field('acuityOd', 'Acuidade visual OD'), field('acuityOe', 'Acuidade visual OE'), field('findings', 'Achados clínicos', { type: 'textarea' }), field('hypotheses', 'Hipóteses diagnósticas', { type: 'textarea' }), field('exam', 'Exame solicitado', { default: 'OCT de máculas' })],
    },
    {
      id: 'oculoplastics-report', category: 'relatorios', title: 'Relatório médico de oculoplástica', personalized: true,
      description: 'Blefaroplastia, dermatochalase e ptose palpebral.',
      fields: [
        field('birthDate', 'Data de nascimento', { type: 'date' }), field('record', 'Prontuário ou CPF'),
        field('complaint', 'Queixa principal', { type: 'textarea' }), field('duration', 'Duração dos sintomas'),
        field('dermatochalasis', 'Dermatochalase / achados', { type: 'textarea', required: false }),
        field('mrd1Od', 'MRD1 OD (mm)'), field('mrd1Oe', 'MRD1 OE (mm)'),
        field('levatorOd', 'Função do levantador OD'), field('levatorOe', 'Função do levantador OE'),
        field('visualField', 'Comprometimento do campo visual', { type: 'textarea', required: false }),
        field('diagnosis', 'Diagnóstico'), field('cid', 'CID-10'),
        field('laterality', 'Lateralidade'), field('procedure', 'Procedimento indicado'),
      ],
    },
    {
      id: 'ptosis-report', category: 'relatorios', title: 'Justificativa de cirurgia de ptose', personalized: true,
      description: 'Medidas palpebrais e indicação cirúrgica.',
      fields: [field('insurer', 'Convênio'), field('laterality', 'Lateralidade'), field('mrdOd', 'Distância margem-reflexo OD'), field('mrdOe', 'Distância margem-reflexo OE'), field('fissureOd', 'Fenda palpebral OD'), field('fissureOe', 'Fenda palpebral OE'), field('excursionOd', 'Excursão do elevador OD'), field('excursionOe', 'Excursão do elevador OE'), field('procedure', 'Procedimento indicado')],
    },
    {
      id: 'conab-report', category: 'relatorios', title: 'Relatório de aptidão oftalmológica', personalized: true,
      description: 'Relatório funcional para atividades cotidianas e profissionais.',
      fields: [field('cpf', 'CPF'), field('rg', 'RG'), field('indication', 'Motivo da avaliação'), field('acuity', 'Acuidade visual'), field('refractionOd', 'Refração OD'), field('refractionOe', 'Refração OE'), field('pressure', 'Pressão ocular'), field('fundoscopy', 'Fundoscopia', { type: 'textarea' }), field('perimetry', 'Campimetria visual'), field('diagnosis', 'Diagnóstico'), field('conclusion', 'Conclusão', { type: 'textarea' })],
    },
    {
      id: 'dacryoscintigraphy-locations', category: 'exames', title: 'Locais para dacriocintilografia', personalized: false,
      description: 'Contatos de locais em Goiânia.', listOptions: LISTS.locations,
    },
    {
      id: 'orthoptic-request', category: 'exames', title: 'Pedido de teste ortóptico', personalized: true,
      description: 'Pedido com refração, óculos atuais e indicação.',
      fields: [field('indication', 'Indicação'), field('refractionOd', 'Refração estática OD'), field('refractionOe', 'Refração estática OE'), field('glassesOd', 'Óculos OD'), field('glassesOe', 'Óculos OE'), field('fundoscopy', 'Fundoscopia', { default: 'normal' })],
    },
    {
      id: 'compounding-pharmacies', category: 'orientacoes', title: 'Farmácias para colírios manipulados', personalized: false,
      description: 'Contatos para atropina e outros colírios.', listOptions: LISTS.pharmacies,
    },
    {
      id: 'pre-op-medicines', category: 'orientacoes', title: 'Medicamentos a evitar no pré-operatório', personalized: false,
      description: 'Prazos e datas calculadas a partir da cirurgia.', requiresSurgeryDate: true,
    },
    {
      id: 'lens-options', category: 'orientacoes', title: 'Opções de lentes para óculos', personalized: false,
      description: 'Recomendações selecionáveis de lentes e tratamentos.', listOptions: LISTS.lenses,
    },
  ];

  const paragraph = (text, role) => ({ type: 'paragraph', text, ...(role ? { role } : {}) });
  const heading = (text, level = 1) => ({ type: 'heading', text, level });
  const bullet = (text) => ({ type: 'bullet', text });
  const value = (state, templateId, name) => ((state.fieldValues[templateId] || {})[name] || '').trim();
  const closing = () => [
    paragraph('Sem mais, agradeço a atenção e coloco-me à disposição para maiores esclarecimentos.'),
    paragraph('Cordialmente,'),
    ...SIGNATURE.map((block) => ({ ...block })),
  ];

  function commonContext(state) {
    return {
      name: state.patientName.trim(),
      grammar: core.getGrammar(state.gender),
      date: core.formatLongDate(state.currentDate),
    };
  }

  function buildLetter(templateId, state) {
    const { name, grammar, date } = commonContext(state);
    const v = (name) => value(state, templateId, name);
    if (templateId === 'cardiologist-letter') {
      return [
        paragraph(`Goiânia, ${date}`, 'date'),
        paragraph('Ao Serviço de Cardiologia,'),
        paragraph(`Venho solicitar avaliação de risco cirúrgico, bem como eventuais recomendações e/ou restrições para o pré, per e pós-operatório, para ${grammar.patient.replace('paciente', grammar.honorific)} ${name}.`),
        paragraph(`${grammar.pronoun} deverá submeter-se a ${v('procedure')}, sob ${v('anesthesia')}.`),
        ...closing(),
      ];
    }
    return [
      paragraph(`Goiânia, ${date}`, 'date'), paragraph('À Ótica,'),
      paragraph(`Venho solicitar o ajuste ou a troca das lentes dos óculos de ${grammar.patient.replace('paciente', grammar.honorific)} ${name}.`),
      paragraph(`Motivo: ${v('reason')}.`), paragraph(`Sugiro manter inclinação pantoscópica de ${v('pantoscopicAngle')}.`),
      ...closing(),
    ];
  }

  function buildGlaucoma(state) {
    const id = 'oct-glaucoma'; const { name, grammar, date } = commonContext(state); const v = (name) => value(state, id, name);
    return [paragraph(`Goiânia, ${date}`, 'date'), paragraph(`À operadora de saúde ${v('insurer')},`), paragraph(`Apresento informações sobre a solicitação de exame para ${grammar.patient.replace('paciente', grammar.honorific)} ${name}.`), paragraph(`${grammar.pronoun} apresenta escavação aumentada do disco óptico.`), paragraph(`Escavação: OD ${v('cupOd')} / OE ${v('cupOe')}.`), paragraph(`Pressão ocular: ${v('pressure')}.`), paragraph(`Solicita-se ${v('exam')}.`), ...closing()];
  }

  function buildMacula(state) {
    const id = 'oct-macula'; const { name, grammar, date } = commonContext(state); const v = (name) => value(state, id, name);
    return [paragraph(`Goiânia, ${date}`, 'date'), paragraph(`À operadora de saúde ${v('insurer')},`), paragraph(`Apresento informações sobre a solicitação de exame para ${grammar.patient.replace('paciente', grammar.honorific)} ${name}.`), paragraph(`${grammar.pronoun} apresenta acuidade visual de OD ${v('acuityOd')} e OE ${v('acuityOe')}.`), paragraph(`Achados clínicos: ${v('findings')}.`), paragraph(`Hipóteses diagnósticas: ${v('hypotheses')}.`), paragraph(`Solicita-se ${v('exam')}.`), ...closing()];
  }

  function buildOculoplastics(state) {
    const id = 'oculoplastics-report'; const { name, date } = commonContext(state); const v = (name) => value(state, id, name);
    return [heading('RELATÓRIO MÉDICO'), heading('Dados do paciente', 2), { type: 'table', rows: [['Nome', name], ['Data de nascimento', v('birthDate')], ['Prontuário / CPF', v('record')]] }, paragraph(`Data do relatório: ${date}`), heading('Queixa principal e histórico', 2), paragraph(`${v('complaint')}. Sintomas presentes há ${v('duration')}.`), heading('Exame palpebral objetivo', 2), paragraph(`Dermatochalase e achados: ${v('dermatochalasis') || 'não informado'}. MRD1: OD ${v('mrd1Od')} mm / OE ${v('mrd1Oe')} mm. Função do levantador: OD ${v('levatorOd')} / OE ${v('levatorOe')}.`), heading('Impacto na visão e funcionalidade', 2), paragraph(v('visualField') || 'Comprometimento funcional descrito conforme avaliação clínica e documentação apresentada.'), heading('Diagnóstico', 2), paragraph(`${v('diagnosis')}. CID-10: ${v('cid')}.`), heading('Procedimento indicado', 2), paragraph(`${v('procedure')} - ${v('laterality')}.`), heading('Plano anestésico', 2), paragraph('Anestesia loco-regional associada a sedação venosa, com monitoramento contínuo por anestesiologista.'), paragraph('Atenciosamente,'), ...SIGNATURE.map((block) => ({ ...block }))];
  }

  function buildPtosis(state) {
    const id = 'ptosis-report'; const { name, grammar, date } = commonContext(state); const v = (name) => value(state, id, name);
    return [paragraph(`Goiânia, ${date}`, 'date'), paragraph(`À operadora de saúde ${v('insurer')},`), paragraph(`Apresento informações sobre a solicitação de operação para ${grammar.patient.replace('paciente', grammar.honorific)} ${name}.`), paragraph(`${grammar.pronoun} é ${grammar.carrier} de ptose palpebral ${v('laterality')}, com indicação cirúrgica.`), paragraph(`Distância margem-reflexo: OD ${v('mrdOd')} / OE ${v('mrdOe')}.`), paragraph(`Fenda palpebral: OD ${v('fissureOd')} / OE ${v('fissureOe')}.`), paragraph(`Excursão do elevador da pálpebra: OD ${v('excursionOd')} / OE ${v('excursionOe')}.`), paragraph(`Foi indicado tratamento cirúrgico: ${v('procedure')}.`), ...closing()];
  }

  function buildConab(state) {
    const id = 'conab-report'; const { name, grammar, date } = commonContext(state); const v = (name) => value(state, id, name);
    return [heading('RELATÓRIO MÉDICO'), paragraph(`Trata-se de ${name}, CPF ${v('cpf')}, RG ${v('rg')}.`), paragraph(`Motivo da avaliação: ${v('indication')}.`), paragraph('Ectoscopia e motilidade ocular extrínseca e intrínseca dentro da normalidade.'), paragraph(`Acuidade visual: ${v('acuity')}.`), paragraph(`Refração estática: OD ${v('refractionOd')} / OE ${v('refractionOe')}.`), paragraph(`Pressão ocular: ${v('pressure')}.`), paragraph(`Fundoscopia: ${v('fundoscopy')}.`), paragraph(`Campimetria visual: ${v('perimetry')}.`), paragraph(`Diagnóstico: ${v('diagnosis')}.`), paragraph(`Conclusão: ${grammar.patient.charAt(0).toUpperCase() + grammar.patient.slice(1)} ${grammar.fit} - ${v('conclusion')}.`), paragraph('Sem mais, subscrevo.'), paragraph(`Goiânia, ${date}.`, 'date'), ...SIGNATURE.map((block) => ({ ...block }))];
  }

  function buildOrthoptic(state) {
    const id = 'orthoptic-request'; const { name, date } = commonContext(state); const v = (name) => value(state, id, name);
    return [heading('PEDIDO DE EXAME'), paragraph(`Nome: ${name}`), paragraph(`Data: ${date}`), heading('EXAME: TESTE ORTÓPTICO', 2), paragraph(`Indicação: ${v('indication')}.`), paragraph(`Refração estática:\nOD: ${v('refractionOd')}\nOE: ${v('refractionOe')}`), paragraph(`Óculos:\nOD: ${v('glassesOd')}\nOE: ${v('glassesOe')}`), paragraph(`Fundoscopia: ${v('fundoscopy')}.`), ...SIGNATURE.map((block) => ({ ...block }))];
  }

  function buildSelectedList(template, state) {
    const selected = state.listSelections[template.id] || template.listOptions.map((item) => item.id);
    return [heading(template.title.toUpperCase()), ...template.listOptions.filter((item) => selected.includes(item.id)).map((item) => paragraph(item.text))];
  }

  function buildMedicationDocument(state) {
    const blocks = [heading('MEDICAMENTOS, SUPLEMENTOS E SUBSTÂNCIAS A EVITAR'), paragraph(`Data da cirurgia: ${core.formatLongDate(state.surgeryDate)}.`)];
    for (const group of MEDICATION_GROUPS) {
      blocks.push(heading(group.heading, 2));
      if (group.intro) blocks.push(paragraph(group.intro));
      for (const [prefix, amount, unit, label] of group.items) {
        const date = core.subtractSuspensionPeriod(state.surgeryDate, amount, unit);
        blocks.push(bullet(`${prefix} Suspender ${label} antes (${date}).`));
      }
    }
    return blocks;
  }

  function buildDocument(id, state) {
    const template = TEMPLATES.find((item) => item.id === id);
    if (!template) throw new Error(`Modelo desconhecido: ${id}`);
    let blocks;
    if (id === 'cardiologist-letter' || id === 'optical-letter') blocks = buildLetter(id, state);
    else if (id === 'oct-glaucoma') blocks = buildGlaucoma(state);
    else if (id === 'oct-macula') blocks = buildMacula(state);
    else if (id === 'oculoplastics-report') blocks = buildOculoplastics(state);
    else if (id === 'ptosis-report') blocks = buildPtosis(state);
    else if (id === 'conab-report') blocks = buildConab(state);
    else if (id === 'orthoptic-request') blocks = buildOrthoptic(state);
    else if (id === 'pre-op-medicines') blocks = buildMedicationDocument(state);
    else blocks = buildSelectedList(template, state);
    return { id: template.id, title: template.title, blocks };
  }

  return {
    getTemplates: () => TEMPLATES.map((template) => ({ ...template })),
    buildDocument,
  };
});
