const { chromium } = require('playwright');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

(async () => {
  const outputDirectory = path.join(os.tmpdir(), 'seabra-dashboard-qa');
  fs.mkdirSync(outputDirectory, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  });
  const appUrl = pathToFileURL(path.resolve(__dirname, '..', 'index.html')).href;

  for (const [name, width, height] of [
    ['desktop', 1440, 1000],
    ['tablet', 768, 900],
    ['mobile', 320, 760],
  ]) {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.goto(appUrl);
    await page.screenshot({ path: path.join(outputDirectory, `${name}.png`), fullPage: true });
    await page.close();
  }

  const reviewPage = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await reviewPage.goto(appUrl);
  await reviewPage.locator('#patient-name').fill('Carlos Eduardo de Oliveira');
  await reviewPage.getByText('Homem', { exact: true }).click();
  await reviewPage.locator('[data-template-id="cardiologist-letter"] input').check();
  await reviewPage.locator('[data-template-id="dacryoscintigraphy-locations"] input').check();
  await reviewPage.locator('#review-button').click();
  await reviewPage.screenshot({ path: path.join(outputDirectory, 'review-desktop.png') });
  await reviewPage.setViewportSize({ width: 320, height: 760 });
  await reviewPage.screenshot({ path: path.join(outputDirectory, 'review-mobile.png') });
  await browser.close();
  process.stdout.write(outputDirectory);
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
