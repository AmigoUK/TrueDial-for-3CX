import { defineConfig } from 'wxt';
import preact from '@preact/preset-vite';

// WXT config — Manifest V3. Auto-detection host permissions are OPTIONAL
// (granted during onboarding); the PBX domain is added dynamically after setup.
// Guiding principle: never break the host page.
export default defineConfig({
  srcDir: '.',
  vite: () => ({
    plugins: [preact()],
  }),
  manifest: {
    name: '__MSG_extName__',
    short_name: 'TrueDial',
    description: '__MSG_extDescription__',
    default_locale: 'en',
    permissions: ['storage', 'contextMenus', 'tabs', 'offscreen'],
    // Auto-detection: optional, requested during onboarding with a rationale (§8, R3).
    optional_host_permissions: ['<all_urls>'],
    action: {
      default_title: 'TrueDial for 3CX',
    },
  },
});
