// Tiny i18n helper over the WebExtension i18n API. Messages live in
// _locales/<lang>/messages.json; the default locale (en) is the fallback for
// any key missing in the active locale. Dynamic values (host, %, step numbers)
// are composed in the caller, so messages need no placeholder declarations.

import { browser } from 'wxt/browser';

// WXT generates a strict key union for getMessage; we key off our own catalogue
// instead, so cast to a permissive signature (values are validated by tests).
const getMessage = browser.i18n.getMessage as unknown as (key: string) => string;

export function t(key: string): string {
  return getMessage(key) || key;
}
