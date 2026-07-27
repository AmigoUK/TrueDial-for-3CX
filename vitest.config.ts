import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing';

export default defineConfig({
  // WxtVitest podstawia `browser` (fakeBrowser) i aliasy WXT, dzięki czemu
  // moduły importujące 'wxt/browser' działają w testach node.
  plugins: [WxtVitest()],
  test: {
    globals: true,
    include: ['tests/**/*.test.ts'],
  },
});
