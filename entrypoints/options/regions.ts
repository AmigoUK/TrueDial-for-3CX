import type { CountryCode } from 'libphonenumber-js/min';

// Curated region list (a picker, not free text) — the most common 3CX SMB markets.
export const REGIONS: { code: CountryCode; label: string }[] = [
  { code: 'GB', label: 'United Kingdom (+44)' },
  { code: 'PL', label: 'Polska (+48)' },
  { code: 'DE', label: 'Deutschland (+49)' },
  { code: 'FR', label: 'France (+33)' },
  { code: 'ES', label: 'España (+34)' },
  { code: 'IT', label: 'Italia (+39)' },
  { code: 'NL', label: 'Nederland (+31)' },
  { code: 'US', label: 'United States (+1)' },
  { code: 'IE', label: 'Ireland (+353)' },
];

export function suggestRegion(): CountryCode {
  const loc = navigator.language.split('-')[1]?.toUpperCase();
  return (REGIONS.find((r) => r.code === loc)?.code ?? 'GB') as CountryCode;
}
