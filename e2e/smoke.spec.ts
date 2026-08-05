// Smoke E2E: loads the BUILT extension into real Chromium and exercises the
// full detection pipeline on the demo corpus. Guards the two product promises
// no unit test can fully cover:
//   1. genuine numbers become accessible click-to-call highlights,
//   2. the host page is never broken (traps untouched, text unchanged).
// The build under test is the TRUEDIAL_E2E variant (static content script);
// the runtime-registration logic itself is unit-tested in tests/permissions.
import { test, expect, chromium, type BrowserContext, type Page } from '@playwright/test';
import http from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// The extension service worker's global — only what the tests touch.
declare const chrome: {
  storage: { local: { get(key: string): Promise<Record<string, unknown>> } };
};

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const EXTENSION_DIR = join(root, '.output/chrome-mv3');
const PORT = 38471;
const BASE = `http://localhost:${PORT}/`;

// Preinstalled Chromium in the dev container; CI installs Playwright's own.
const PREINSTALLED = '/opt/pw-browsers/chromium';

let server: http.Server;
let context: BrowserContext;

test.beforeAll(async () => {
  server = http.createServer((_req, res) => {
    res.setHeader('content-type', 'text/html');
    res.end(readFileSync(join(root, 'demo/numbers.html'), 'utf8'));
  });
  await new Promise<void>((resolve) => server.listen(PORT, resolve));

  context = await chromium.launchPersistentContext('', {
    executablePath: existsSync(PREINSTALLED) ? PREINSTALLED : undefined,
    headless: true,
    args: [
      '--headless=new',
      `--disable-extensions-except=${EXTENSION_DIR}`,
      `--load-extension=${EXTENSION_DIR}`,
    ],
  });
});

test.afterAll(async () => {
  await context?.close();
  await new Promise((resolve) => server.close(resolve));
});

async function openDemo(): Promise<Page> {
  const page = await context.newPage();
  await page.goto(BASE);
  // Detection runs at document_idle plus a debounce; wait for the first span.
  await page.locator('[data-truedial]').first().waitFor({ timeout: 10_000 });
  return page;
}

test('detects genuine numbers as accessible highlights', async () => {
  const page = await openDemo();

  // UK default region: both international and national UK forms must resolve
  // to the same E.164 value.
  const e164s = await page
    .locator('[data-truedial]')
    .evaluateAll((els) => els.map((el) => el.getAttribute('data-e164')));
  expect(e164s.filter((v) => v === '+442079460958').length).toBeGreaterThanOrEqual(2);
  expect(e164s.length).toBeGreaterThanOrEqual(10);

  // Highlights are keyboard-accessible buttons, not hijacked links.
  const first = page.locator('[data-truedial]').first();
  await expect(first).toHaveAttribute('role', 'button');
  await expect(first).toHaveAttribute('tabindex', '0');
  await page.close();
});

test('never breaks the host page: traps untouched, text unchanged', async () => {
  const page = await openDemo();

  // No trap (record IDs, IBAN, date, SKU, editable fields, existing links,
  // code blocks) may be highlighted.
  expect(await page.locator('li.no [data-truedial]').count()).toBe(0);
  expect(await page.locator('input[data-truedial], textarea[data-truedial]').count()).toBe(0);
  expect(await page.locator('a [data-truedial]').count()).toBe(0);

  // Wrapping must not alter the visible text of a highlighted line.
  await expect(page.locator('li.ok', { hasText: 'International UK' })).toHaveText(
    'International UK: +44 20 7946 0958',
  );
  // The editable field's value stays pristine.
  await expect(page.locator('li.no input')).toHaveValue('+44 20 7946 0958');
  await page.close();
});

test('clicking a highlight dispatches a call that lands in history', async () => {
  const page = await openDemo();
  await page.locator('[data-truedial][data-e164="+442079460958"]').first().click();

  // Unconfigured extension → orchestrator falls back to tel:, recorded as
  // 'attempted' (the honest outcome), never as 'placed'.
  const sw = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
  await expect
    .poll(
      () =>
        sw.evaluate(async () => {
          const raw = await chrome.storage.local.get('history');
          const history = (raw['history'] ?? []) as { e164: string; status: string }[];
          return history[0] ? `${history[0].e164}:${history[0].status}` : null;
        }),
      { timeout: 10_000 },
    )
    .toBe('+442079460958:attempted');
  await page.close();
});

test('options and popup pages render', async () => {
  const sw = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
  const id = new URL(sw.url()).host;

  const options = await context.newPage();
  await options.goto(`chrome-extension://${id}/options.html`);
  await expect(options).toHaveTitle(/TrueDial for 3CX/);
  await expect(options.locator('main')).toBeVisible();
  await options.close();

  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${id}/popup.html`);
  await expect(popup.locator('.popup')).toBeVisible();
  await popup.close();
});
