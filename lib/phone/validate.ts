// Detection layer 2: strict validation of a candidate via libphonenumber-js.
// We accept ONLY numbers the library reports as `isValid()`, and return them in
// canonical E.164 form. This filters out IBANs, dates, order numbers and other
// false positives that survived layer 1.

import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js/min';

/**
 * Validates a raw candidate and returns E.164, or `null`.
 * @param raw the raw fragment (e.g. "022 123 45 67", "+48 22 123 45 67")
 * @param defaultCountry the default region for national numbers (e.g. 'PL', 'GB')
 */
export function validateToE164(raw: string, defaultCountry: CountryCode): string | null {
  let parsed;
  try {
    parsed = parsePhoneNumberFromString(raw, defaultCountry);
  } catch {
    return null;
  }
  if (!parsed || !parsed.isValid()) return null;
  return parsed.number; // E.164 format
}
