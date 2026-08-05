import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing';

export default defineConfig({
  // WxtVitest supplies `browser` (fakeBrowser) and the WXT aliases, so modules
  // importing 'wxt/browser' work in Node test runs.
  plugins: [WxtVitest()],
  test: {
    globals: true,
    include: ['tests/**/*.test.ts'],
  },
});
