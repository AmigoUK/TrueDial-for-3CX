// Screen-pop URL templating (§3.F5). Pure and testable.
// Placeholders: {number} → E.164, {national} → national format. Values are
// URL-encoded. Returns null when there is nothing sensible to open.

import { parsePhoneNumberFromString } from 'libphonenumber-js/min';

const PLACEHOLDER_RE = /\{(number|national)\}/g;

export function buildScreenPopUrl(template: string, e164: string): string | null {
  const tpl = template.trim();
  if (!tpl || !PLACEHOLDER_RE.test(tpl)) return null;

  const parsed = parsePhoneNumberFromString(e164);
  const national = parsed ? parsed.formatNational() : e164;

  return tpl.replace(PLACEHOLDER_RE, (_m, key: string) =>
    encodeURIComponent(key === 'national' ? national : e164),
  );
}
