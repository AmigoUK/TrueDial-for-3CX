import { describe, it, expect } from 'vitest';
import { extractCandidates } from '../lib/phone/candidates';
import { validateToE164 } from '../lib/phone/validate';

// --- Warstwa 1: ekstrakcja kandydatów (tania, tolerancyjna) ---
describe('extractCandidates', () => {
  it('wyłapuje numery z różnymi separatorami', () => {
    const text = 'Zadzwoń: +48 22 123 45 67 albo (022) 123-45-67 lub 0048.22.1234567';
    const found = extractCandidates(text).map((c) => c.raw);
    expect(found).toContain('+48 22 123 45 67');
    expect(found).toContain('(022) 123-45-67');
    expect(found).toContain('0048.22.1234567');
  });

  it('ignoruje zbyt krótkie ciągi (<7 cyfr)', () => {
    expect(extractCandidates('kod 12345 i pokój 42')).toHaveLength(0);
  });

  it('ignoruje zbyt długie ciągi bez separatorów (>16 cyfr — heurystyka anty-record-ID)', () => {
    // Salesforce record ID / długi identyfikator liczbowy
    expect(extractCandidates('rekord 00170000012ABCDe i 12345678901234567890')).toHaveLength(0);
  });

  it('zwraca pozycję (index) kandydata w tekście', () => {
    const found = extractCandidates('tel +48221234567 koniec');
    expect(found[0]?.index).toBe(4);
  });

  it('nie wyłapuje numeru będącego częścią tokenu alfanumerycznego', () => {
    expect(extractCandidates('SKU-4842123456-X order')).toHaveLength(0);
  });
});

// --- Warstwa 2: walidacja libphonenumber → E.164 ---
describe('validateToE164', () => {
  it('normalizuje poprawny numer międzynarodowy', () => {
    expect(validateToE164('+48 22 123 45 67', 'PL')).toBe('+48221234567');
  });

  it('normalizuje numer krajowy używając defaultCountry (PL, 9 cyfr bez trunk-0)', () => {
    expect(validateToE164('22 123 45 67', 'PL')).toBe('+48221234567');
  });

  it('obsługuje numery UK', () => {
    expect(validateToE164('020 7946 0958', 'GB')).toBe('+442079460958');
  });

  it('odrzuca IBAN', () => {
    expect(validateToE164('PL61109010140000071219812874', 'PL')).toBeNull();
  });

  it('odrzuca datę', () => {
    expect(validateToE164('2026-07-27', 'PL')).toBeNull();
  });

  it('odrzuca numer zamówienia bez sensu telefonicznego', () => {
    expect(validateToE164('000123456', 'PL')).toBeNull();
  });

  it('odrzuca niepełny numer', () => {
    expect(validateToE164('123 45', 'PL')).toBeNull();
  });
});
