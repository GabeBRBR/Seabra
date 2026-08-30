const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const appUrl = pathToFileURL(path.resolve(__dirname, '..', 'index.html')).href;

async function signIn(page) {
  await page.getByLabel('CRM').fill('7669-GO');
  await page.getByLabel('Senha').fill('gabereis');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.getByRole('heading', { name: 'Documentos oftalmológicos' }).waitFor();
}

async function withPage(run, viewport = { width: 1280, height: 900 }) {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  });
  const page = await browser.newPage({ viewport });
  page.setDefaultTimeout(2000);
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    await page.goto(appUrl);
    await run(page);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
}

test('requires a basic CRM login before showing the dashboard', async () => {
  await withPage(async (page) => {
    await page.getByRole('heading', { name: 'Acesso ao dashboard' }).waitFor();
    assert.equal(await page.locator('#app-shell').isVisible(), false);

    await signIn(page);

    assert.equal(await page.locator('#app-shell').isVisible(), true);
    assert.equal(await page.locator('#login-shell').isVisible(), false);
  });
});

test('rejects invalid CRM credentials without storing login state', async () => {
  await withPage(async (page) => {
    await page.getByLabel('CRM').fill('0000-GO');
    await page.getByLabel('Senha').fill('errada');
    await page.getByRole('button', { name: 'Entrar' }).click();

    const alert = page.getByRole('alert');
    await alert.waitFor();
    assert.match(await alert.textContent(), /CRM ou senha inválidos/i);
    assert.equal(await page.locator('#app-shell').isVisible(), false);

    const stored = await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length, cookies: document.cookie }));
    assert.deepEqual(stored, { local: 0, session: 0, cookies: '' });
  });
});

test('renders all models grouped into four themes', async () => {
  await withPage(async (page) => {
    await signIn(page);
    assert.equal(await page.locator('[data-template-id]').count(), 12);
    assert.equal(await page.locator('.template-group').count(), 4);
  });
});

test('loads the local hospital logo from bundled assets', async () => {
  await withPage(async (page) => {
    await signIn(page);
    const logo = page.locator('.brand-logo');
    await logo.waitFor();
    const source = await logo.getAttribute('src');
    const loaded = await logo.evaluate((image) => image.complete && image.naturalWidth > 0);
    assert.equal(source, 'assets/logo hospital.png');
    assert.equal(loaded, true);
  });
});

test('opens a required review with one tab per selected document', async () => {
  await withPage(async (page) => {
    await signIn(page);
    await page.getByLabel('Nome do paciente').fill('Carlos Souza');
    await page.getByText('Homem', { exact: true }).click();
    await page.locator('[data-template-id="cardiologist-letter"] input[type="checkbox"]').check();
    await page.locator('[data-template-id="dacryoscintigraphy-locations"] input[type="checkbox"]').check();
    await page.getByRole('button', { name: 'Revisar 2 documentos' }).click();

    const dialog = page.getByRole('dialog', { name: 'Revisão dos documentos' });
    await dialog.waitFor();
    assert.equal(await dialog.getByRole('tab').count(), 2);
    assert.equal(await dialog.locator('[contenteditable="plaintext-only"]').count() > 0, true);
    await dialog.getByRole('button', { name: 'Gerar Word' }).waitFor();
    await dialog.getByRole('button', { name: 'Gerar PDF' }).waitFor();
    await dialog.getByRole('button', { name: 'Imprimir' }).waitFor();
  });
});

test('uses Times New Roman only on document review pages and centers the signature', async () => {
  await withPage(async (page) => {
    await signIn(page);
    await page.getByLabel('Nome do paciente').fill('Carlos Souza');
    await page.getByText('Homem', { exact: true }).click();
    await page.locator('[data-template-id="cardiologist-letter"] input[type="checkbox"]').check();
    await page.getByRole('button', { name: 'Revisar 1 documento' }).click();

    const reviewPage = page.locator('.review-page').first();
    const signature = page.locator('.document-signature').first();
    await reviewPage.waitFor();

    assert.match(await reviewPage.evaluate((node) => getComputedStyle(node).fontFamily), /Times New Roman/i);
    assert.equal(await signature.evaluate((node) => getComputedStyle(node).textAlign), 'center');
    assert.doesNotMatch(await page.locator('body').evaluate((node) => getComputedStyle(node).fontFamily), /Times New Roman/i);
  });
});

test('shows validation without opening review when required fields are missing', async () => {
  await withPage(async (page) => {
    await signIn(page);
    await page.locator('[data-template-id="oct-glaucoma"] input[type="checkbox"]').check();
    await page.getByRole('button', { name: 'Revisar 1 documento' }).click();
    const alert = page.getByRole('alert');
    await alert.waitFor();
    assert.match(await alert.textContent(), /nome do paciente/i);
    assert.equal(await page.getByRole('dialog').count(), 0);
  });
});

test('keeps patient data out of browser storage', async () => {
  await withPage(async (page) => {
    await signIn(page);
    await page.getByLabel('Nome do paciente').fill('Paciente Sigiloso');
    const stored = await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length, cookies: document.cookie }));
    assert.deepEqual(stored, { local: 0, session: 0, cookies: '' });
  });
});

test('fits the primary workflow on a 320px viewport without horizontal overflow', async () => {
  await withPage(async (page) => {
    await signIn(page);
    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    assert.equal(dimensions.scrollWidth, dimensions.clientWidth);
    await page.getByRole('button', { name: /Revisar/ }).scrollIntoViewIfNeeded();
  }, { width: 320, height: 760 });
});

test('downloads combined Word and PDF files from the review dialog', async () => {
  await withPage(async (page) => {
    await signIn(page);
    await page.locator('[data-template-id="dacryoscintigraphy-locations"] input[type="checkbox"]').check();
    await page.getByRole('button', { name: 'Revisar 1 documento' }).click();
    const dialog = page.getByRole('dialog', { name: 'Revisão dos documentos' });
    await dialog.waitFor();

    const wordDownloadPromise = page.waitForEvent('download');
    await dialog.getByRole('button', { name: 'Gerar Word' }).click();
    const wordDownload = await wordDownloadPromise;
    assert.match(wordDownload.suggestedFilename(), /\.docx$/);

    const pdfDownloadPromise = page.waitForEvent('download');
    await dialog.getByRole('button', { name: 'Gerar PDF' }).click();
    const pdfDownload = await pdfDownloadPromise;
    assert.match(pdfDownload.suggestedFilename(), /\.pdf$/);
  });
});

test('prepares one printable A4 article per reviewed document', async () => {
  await withPage(async (page) => {
    await signIn(page);
    await page.locator('[data-template-id="dacryoscintigraphy-locations"] input[type="checkbox"]').check();
    await page.locator('[data-template-id="compounding-pharmacies"] input[type="checkbox"]').check();
    await page.getByRole('button', { name: 'Revisar 2 documentos' }).click();
    const dialog = page.getByRole('dialog', { name: 'Revisão dos documentos' });
    await dialog.getByRole('button', { name: 'Imprimir' }).click();
    assert.equal(await page.locator('#print-root .print-document').count(), 2);
  });
});
