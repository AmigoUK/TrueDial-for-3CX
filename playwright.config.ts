import { defineConfig } from '@playwright/test';

// Smoke E2E against the built extension (see e2e/smoke.spec.ts). Run with
// `pnpm e2e` — it builds the TRUEDIAL_E2E variant first (static content
// script; headless Chrome cannot accept the optional-permission prompt that
// the production runtime registration relies on).
export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  // One persistent browser context with the extension loaded — no parallelism.
  workers: 1,
  reporter: [['list']],
});
