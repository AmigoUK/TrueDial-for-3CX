// Generates the 1280×800 Chrome Web Store screenshots into
// docs/store/screenshots/. Run via `pnpm store:screenshots` (which first
// builds the TRUEDIAL_E2E variant so detection works headlessly).
import { chromium } from '@playwright/test';
import http from 'node:http';
import { existsSync, readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'docs/store/screenshots');
const EXTENSION_DIR = join(root, '.output/chrome-mv3');
const PREINSTALLED = '/opt/pw-browsers/chromium';
const PORT = 38479;

mkdirSync(OUT, { recursive: true });

const server = http.createServer((_req, res) => {
  res.setHeader('content-type', 'text/html');
  res.end(readFileSync(join(root, 'demo/numbers.html'), 'utf8'));
});
await new Promise((r) => server.listen(PORT, r));

// Full Chromium required — the headless shell ignores extensions.
const executablePath = existsSync(PREINSTALLED) ? PREINSTALLED : undefined;
const context = await chromium.launchPersistentContext('', {
  ...(executablePath ? { executablePath } : { channel: 'chromium' }),
  headless: true,
  viewport: { width: 1280, height: 800 },
  args: [
    '--headless=new',
    `--disable-extensions-except=${EXTENSION_DIR}`,
    `--load-extension=${EXTENSION_DIR}`,
  ],
});
const sw = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
const id = new URL(sw.url()).host;

// Seed a realistic state: configured FQDN, some history, a last-call trail.
await sw.evaluate(async () => {
  const now = Date.now();
  await chrome.storage.local.set({
    config: { fqdn: 'pbx.example.co.uk', defaultRegion: 'GB', detectionMode: 'subtle' },
    history: [
      { e164: '+442079460958', ts: now - 60_000, status: 'placed' },
      { e164: '+441614960000', ts: now - 30 * 60_000, status: 'placed' },
      { e164: '+442072224444', ts: now - 2 * 3_600_000, status: 'attempted' },
    ],
  });
  await chrome.storage.session.set({
    lastCall: {
      e164: '+442079460958',
      ts: now - 60_000,
      ok: true,
      strategy: 'ccapi',
      attempts: [{ strategy: 'ccapi', ok: true }],
    },
  });
});

// 1. Detection on the demo page.
const demo = await context.newPage();
await demo.goto(`http://localhost:${PORT}/`);
await demo.locator('[data-truedial]').first().waitFor({ timeout: 10_000 });
await demo.locator('[data-truedial]').first().hover();
await demo.screenshot({ path: join(OUT, 'detection.png') });
await demo.close();

// 2. The popup.
const popup = await context.newPage();
await popup.goto(`chrome-extension://${id}/popup.html`);
await popup.locator('.popup').waitFor();
await popup.screenshot({ path: join(OUT, 'popup.png') });
await popup.close();

// 3. The options page (skip the wizard — config is already present).
const options = await context.newPage();
await options.goto(`chrome-extension://${id}/options.html`);
await options.locator('main.card').waitFor();
await options.screenshot({ path: join(OUT, 'options.png') });
await options.close();

await context.close();
server.close();
console.log(`Screenshots written to ${OUT}`);
