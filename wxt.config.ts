import { defineConfig } from 'wxt';
import preact from '@preact/preset-vite';

// WXT config — Manifest V3. Autodetekcja host permissions jest OPCJONALNA
// (grant w onboardingu), a domena PBX dodawana dynamicznie po konfiguracji.
// Zasada naczelna: never break the host page.
export default defineConfig({
  srcDir: '.',
  vite: () => ({
    plugins: [preact()],
  }),
  manifest: {
    name: 'TrueDial for 3CX',
    short_name: 'TrueDial',
    description:
      'Reliable click-to-call for 3CX. Detects phone numbers without breaking the page and dials via your 3CX web client. Unofficial — not affiliated with 3CX.',
    default_locale: 'en',
    permissions: ['storage', 'contextMenus', 'tabs'],
    // Autodetekcja: opcjonalne, żądane w onboardingu z wyjaśnieniem (§8, R3).
    optional_host_permissions: ['<all_urls>'],
    action: {
      default_title: 'TrueDial for 3CX',
    },
  },
});
