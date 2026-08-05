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
  hooks: {
    // WXT hoists a runtime-registered content script's `matches` into
    // host_permissions, which would reinstate the install-time "read data on
    // all websites" warning. Host access must stay OPTIONAL (granted
    // in-context), so strip the hoisted grant and the empty stub.
    'build:manifestGenerated': (_wxt, manifest) => {
      delete manifest.host_permissions;
      if (manifest.content_scripts?.length === 0) delete manifest.content_scripts;
    },
  },
  manifest: {
    name: '__MSG_extName__',
    short_name: 'TrueDial',
    description: '__MSG_extDescription__',
    default_locale: 'en',
    // 'scripting' backs the runtime-registered content script (least privilege:
    // detection only runs on origins the user granted).
    permissions: ['storage', 'contextMenus', 'tabs', 'offscreen', 'scripting'],
    // Host access is OPTIONAL and requested in-context: the PBX origin when the
    // FQDN is saved, all-sites or per-site detection during onboarding (§8, R3).
    optional_host_permissions: ['<all_urls>'],
    action: {
      default_title: 'TrueDial for 3CX',
    },
  },
});
