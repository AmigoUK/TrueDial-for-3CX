// Warstwa 2 detekcji: twarda walidacja kandydata przez libphonenumber-js.
// Akceptujemy WYŁĄCZNIE numery, które biblioteka uzna za `isValid()`, i
// zwracamy je w kanonicznej postaci E.164. To odsiewa IBAN-y, daty, numery
// zamówień i inne false-positive'y, które przeszły warstwę 1.

import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js/min';

/**
 * Waliduje surowego kandydata i zwraca E.164 albo `null`.
 * @param raw surowy fragment (np. "022 123 45 67", "+48 22 123 45 67")
 * @param defaultCountry region domyślny dla numerów krajowych (np. 'PL', 'GB')
 */
export function validateToE164(raw: string, defaultCountry: CountryCode): string | null {
  let parsed;
  try {
    parsed = parsePhoneNumberFromString(raw, defaultCountry);
  } catch {
    return null;
  }
  if (!parsed || !parsed.isValid()) return null;
  return parsed.number; // format E.164
}
