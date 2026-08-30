(function initApp(root) {
  const core = root.SeabraCore;
  const templatesApi = root.SeabraTemplates;
  const templates = templatesApi.getTemplates();
  const categories = [
    ['cartas', 'Cartas e encaminhamentos'],
    ['relatorios', 'Laudos e relatórios'],
    ['exames', 'Pedidos e locais de exame'],
    ['orientacoes', 'Orientações ao paciente'],
  ];

  const state = {
    patientName: '',
    gender: '',
    surgeryDate: '',
    selectedIds: [],
    fieldValues: {},
    listSelections: {},
    currentDate: new Date(),
    reviewDocuments: [],
    activeReviewId: '',
  };

  const elements = {
    patientName: document.getElementById('patient-name'),
    templateGroups: document.getElementById('template-groups'),
    specificFields: document.getElementById('specific-fields'),
    fieldsContainer: document.getElementById('fields-container'),
    selectionStatus: document.getElementById('selection-status'),
    actionSummary: document.getElementById('action-summary'),
    reviewButton: document.getElementById('review-button'),
    errors: document.getElementById('validation-errors'),
    dialog: document.getElementById('review-dialog'),
    tabs: document.getElementById('review-tabs'),
    pages: document.getElementById('review-pages'),
    reviewCount: document.getElementById('review-count'),
    printRoot: document.getElementById('print-root'),
    loginShell: document.getElementById('login-shell'),
    appShell: document.getElementById('app-shell'),
    loginForm: document.getElementById('login-form'),
    loginCrm: document.getElementById('login-crm'),
    loginPassword: document.getElementById('login-password'),
    loginError: document.getElementById('login-error'),
  };

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function templateById(id) {
    return templates.find((template) => template.id === id);
  }

  function renderTemplateGroups() {
    elements.templateGroups.innerHTML = categories.map(([categoryId, label]) => {
      const cards = templates.filter((template) => template.category === categoryId).map((template) => `
        <label class="template-card" data-template-id="${template.id}">
          <input type="checkbox" value="${template.id}" aria-label="${escapeHtml(template.title)}">
          <span>
            <strong>${escapeHtml(template.title)}</strong>
            <small>${escapeHtml(template.description)}</small>
          </span>
        </label>
      `).join('');
      return `<section class="template-group" aria-labelledby="group-${categoryId}"><h3 id="group-${categoryId}">${label}</h3><div class="template-grid">${cards}</div></section>`;
    }).join('');

    elements.templateGroups.addEventListener('change', (event) => {
      if (!event.target.matches('input[type="checkbox"]')) return;
      toggleTemplate(event.target.value, event.target.checked);
    });
  }

  function initializeTemplate(template) {
    if (template.fields && !state.fieldValues[template.id]) {
      state.fieldValues[template.id] = Object.fromEntries(template.fields.map((item) => [item.name, item.default || '']));
    }
    if (template.listOptions && !state.listSelections[template.id]) {
      state.listSelections[template.id] = template.listOptions.map((item) => item.id);
    }
  }

  function toggleTemplate(id, selected) {
    const template = templateById(id);
    initializeTemplate(template);
    state.selectedIds = selected
      ? [...state.selectedIds, id]
      : state.selectedIds.filter((selectedId) => selectedId !== id);
    document.querySelector(`[data-template-id="${id}"]`).classList.toggle('is-selected', selected);
    renderSpecificFields();
    updateSelectionSummary();
    clearErrors();
  }

  function updateSelectionSummary() {
    const count = state.selectedIds.length;
    elements.selectionStatus.textContent = count ? `${count} ${count === 1 ? 'documento selecionado' : 'documentos selecionados'}` : 'Nenhum documento selecionado';
    elements.actionSummary.textContent = count ? `${count} ${count === 1 ? 'documento pronto para preencher' : 'documentos prontos para preencher'}` : 'Selecione os documentos';
    elements.reviewButton.disabled = count === 0;
    elements.reviewButton.querySelector('span').textContent = count ? `Revisar ${count} ${count === 1 ? 'documento' : 'documentos'}` : 'Revisar documentos';
  }

  function fieldMarkup(template, item) {
    const value = state.fieldValues[template.id][item.name] || '';
    const required = item.required ? '<span class="required-mark" aria-hidden="true">*</span>' : '';
    const inputId = `${template.id}-${item.name}`;
    const wide = item.type === 'textarea' ? ' field-wide' : '';
    if (item.type === 'textarea') {
      return `<label class="field${wide}" for="${inputId}"><span>${escapeHtml(item.label)} ${required}</span><textarea id="${inputId}" data-document-id="${template.id}" data-field-name="${item.name}" ${item.required ? 'required' : ''}>${escapeHtml(value)}</textarea></label>`;
    }
    return `<label class="field${wide}" for="${inputId}"><span>${escapeHtml(item.label)} ${required}</span><input id="${inputId}" type="${item.type || 'text'}" value="${escapeHtml(value)}" data-document-id="${template.id}" data-field-name="${item.name}" ${item.required ? 'required' : ''}></label>`;
  }

  function listMarkup(template) {
    const selected = state.listSelections[template.id];
    return `<div class="choice-grid">${template.listOptions.map((item) => `
      <label class="choice-item">
        <input type="checkbox" data-list-document-id="${template.id}" value="${item.id}" ${selected.includes(item.id) ? 'checked' : ''}>
        <span>${escapeHtml(item.label)}</span>
      </label>`).join('')}</div>`;
  }

  function renderSpecificFields() {
    const selectedTemplates = state.selectedIds.map(templateById);
    const needsDetails = selectedTemplates.some((template) => template.fields || template.listOptions || template.requiresSurgeryDate);
    elements.specificFields.hidden = !needsDetails;
    elements.fieldsContainer.innerHTML = selectedTemplates.map((template) => {
      initializeTemplate(template);
      const parts = [];
      if (template.requiresSurgeryDate) {
        parts.push(`<div class="fields-grid"><label class="field" for="surgery-date"><span>Data da cirurgia <span class="required-mark" aria-hidden="true">*</span></span><input id="surgery-date" type="date" value="${escapeHtml(state.surgeryDate)}" required></label></div>`);
      }
      if (template.fields) parts.push(`<div class="fields-grid">${template.fields.map((item) => fieldMarkup(template, item)).join('')}</div>`);
      if (template.listOptions) parts.push(listMarkup(template));
      if (!parts.length) return '';
      return `<section class="document-fields" data-fields-for="${template.id}"><h3>${escapeHtml(template.title)}</h3>${parts.join('')}</section>`;
    }).join('');

    elements.fieldsContainer.querySelectorAll('[data-field-name]').forEach((input) => {
      input.addEventListener('input', () => {
        state.fieldValues[input.dataset.documentId][input.dataset.fieldName] = input.value;
        clearErrors();
      });
    });
    elements.fieldsContainer.querySelectorAll('[data-list-document-id]').forEach((checkbox) => {
      checkbox.addEventListener('change', () => {
        const id = checkbox.dataset.listDocumentId;
        state.listSelections[id] = checkbox.checked
          ? [...state.listSelections[id], checkbox.value]
          : state.listSelections[id].filter((value) => value !== checkbox.value);
      });
    });
    const surgeryDate = document.getElementById('surgery-date');
    if (surgeryDate) surgeryDate.addEventListener('input', () => { state.surgeryDate = surgeryDate.value; clearErrors(); });
  }

  function clearErrors() {
    elements.errors.hidden = true;
    elements.errors.innerHTML = '';
  }

  function showErrors(errors) {
    elements.errors.innerHTML = `<ul>${errors.map((error) => `<li>${escapeHtml(error)}</li>`).join('')}</ul>`;
    elements.errors.hidden = false;
    elements.errors.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function clearLoginError() {
    elements.loginError.hidden = true;
    elements.loginError.textContent = '';
  }

  function showDashboard() {
    elements.loginShell.hidden = true;
    elements.appShell.hidden = false;
    document.body.classList.add('is-authenticated');
    elements.patientName.focus();
  }

  function handleLogin(event) {
    event.preventDefault();
    const crm = elements.loginCrm.value.trim().toUpperCase();
    const password = elements.loginPassword.value;
    if (crm === '7669-GO' && password === 'gabereis') {
      elements.loginPassword.value = '';
      clearLoginError();
      showDashboard();
      return;
    }
    elements.loginPassword.value = '';
    elements.loginError.textContent = 'CRM ou senha inválidos.';
    elements.loginError.hidden = false;
    elements.loginCrm.focus();
  }

  function createEditableBlock(documentId, block, blockIndex) {
    const attributes = `contenteditable="plaintext-only" spellcheck="true" data-document-id="${documentId}" data-block-index="${blockIndex}"`;
    if (block.type === 'heading') {
      const tag = block.level === 2 ? 'h2' : 'h1';
      return `<${tag} class="document-block" ${attributes}>${escapeHtml(block.text)}</${tag}>`;
    }
    if (block.type === 'bullet') return `<ul class="document-list"><li ${attributes}>${escapeHtml(block.text)}</li></ul>`;
    if (block.type === 'table') {
      return `<table class="document-table"><tbody>${block.rows.map((row, rowIndex) => `<tr>${row.map((cell, cellIndex) => `<td contenteditable="plaintext-only" spellcheck="true" data-document-id="${documentId}" data-block-index="${blockIndex}" data-row-index="${rowIndex}" data-cell-index="${cellIndex}">${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    }
    const classes = ['document-block'];
    if (block.role === 'date') classes.push('document-date');
    if (block.role === 'signature') classes.push('document-signature');
    return `<p class="${classes.join(' ')}" ${attributes}>${escapeHtml(block.text)}</p>`;
  }

  function renderReview() {
    elements.tabs.innerHTML = state.reviewDocuments.map((document, index) => `<button class="review-tab" id="tab-${document.id}" type="button" role="tab" aria-selected="${index === 0}" aria-controls="page-${document.id}" data-review-id="${document.id}">${escapeHtml(document.title)}</button>`).join('');
    elements.pages.innerHTML = state.reviewDocuments.map((document, index) => `<article class="review-page" id="page-${document.id}" role="tabpanel" aria-labelledby="tab-${document.id}" ${index === 0 ? '' : 'hidden'}>${document.blocks.map((block, blockIndex) => createEditableBlock(document.id, block, blockIndex)).join('')}</article>`).join('');
    elements.reviewCount.textContent = `${state.reviewDocuments.length} ${state.reviewDocuments.length === 1 ? 'documento' : 'documentos'} no arquivo final`;
    state.activeReviewId = state.reviewDocuments[0].id;
    bindReviewEvents();
  }

  function bindReviewEvents() {
    elements.tabs.querySelectorAll('[role="tab"]').forEach((tab) => {
      tab.addEventListener('click', () => activateReviewTab(tab.dataset.reviewId));
      tab.addEventListener('keydown', (event) => {
        const tabs = [...elements.tabs.querySelectorAll('[role="tab"]')];
        const index = tabs.indexOf(tab);
        if (event.key === 'ArrowRight') tabs[(index + 1) % tabs.length].click();
        if (event.key === 'ArrowLeft') tabs[(index - 1 + tabs.length) % tabs.length].click();
      });
    });
    elements.pages.querySelectorAll('[contenteditable]').forEach((editable) => {
      editable.addEventListener('input', () => {
        const document = state.reviewDocuments.find((item) => item.id === editable.dataset.documentId);
        const block = document.blocks[Number(editable.dataset.blockIndex)];
        if (block.type === 'table') block.rows[Number(editable.dataset.rowIndex)][Number(editable.dataset.cellIndex)] = editable.innerText.trim();
        else block.text = editable.innerText.trim();
      });
    });
  }

  function activateReviewTab(id) {
    state.activeReviewId = id;
    elements.tabs.querySelectorAll('[role="tab"]').forEach((tab) => tab.setAttribute('aria-selected', String(tab.dataset.reviewId === id)));
    elements.pages.querySelectorAll('[role="tabpanel"]').forEach((page) => { page.hidden = page.id !== `page-${id}`; });
    document.getElementById(`tab-${id}`).focus();
  }

  function openReview() {
    state.patientName = elements.patientName.value.trim();
    state.gender = document.querySelector('input[name="gender"]:checked')?.value || '';
    const errors = core.validateGeneration(state);
    const emptyList = state.selectedIds.find((id) => templateById(id).listOptions && state.listSelections[id].length === 0);
    if (emptyList) errors.push(`Selecione ao menos um item em ${templateById(emptyList).title}.`);
    if (errors.length) { showErrors(errors); return; }
    clearErrors();
    state.currentDate = new Date();
    state.reviewDocuments = state.selectedIds.map((id) => templatesApi.buildDocument(id, state));
    renderReview();
    elements.dialog.showModal();
    elements.tabs.querySelector('[role="tab"]').focus();
  }

  elements.patientName.addEventListener('input', () => { state.patientName = elements.patientName.value; clearErrors(); });
  elements.loginForm.addEventListener('submit', handleLogin);
  elements.loginCrm.addEventListener('input', clearLoginError);
  elements.loginPassword.addEventListener('input', clearLoginError);
  document.querySelectorAll('input[name="gender"]').forEach((input) => input.addEventListener('change', () => { state.gender = input.value; clearErrors(); }));
  elements.reviewButton.addEventListener('click', openReview);
  document.getElementById('close-review').addEventListener('click', () => elements.dialog.close());
  elements.dialog.addEventListener('cancel', (event) => { event.preventDefault(); elements.dialog.close(); });
  document.getElementById('export-word').addEventListener('click', () => root.SeabraExporters?.exportDocx(state.reviewDocuments, state));
  document.getElementById('export-pdf').addEventListener('click', () => root.SeabraExporters?.exportPdf(state.reviewDocuments, state));
  document.getElementById('print-documents').addEventListener('click', () => root.SeabraExporters?.printDocuments(state.reviewDocuments, elements.printRoot));

  renderTemplateGroups();
  updateSelectionSummary();
  if (root.lucide) root.lucide.createIcons();
})(window);
