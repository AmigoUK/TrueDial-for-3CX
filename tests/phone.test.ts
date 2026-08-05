import { describe, it, expect } from 'vitest';
import { extractCandidates } from '../lib/phone/candidates';
import { validateToE164 } from '../lib/phone/validate';

// --- Layer 1: candidate extraction (cheap, tolerant) ---
describe('extractCandidates', () => {
  it('picks up numbers with assorted separators', () => {
    const text = 'Call: +48 22 123 45 67 or (022) 123-45-67 or 0048.22.1234567';
    const found = extractCandidates(text).map((c) => c.raw);
    expect(found).toContain('+48 22 123 45 67');
    expect(found).toContain('(022) 123-45-67');
    expect(found).toContain('0048.22.1234567');
  });

  it('ignores strings that are too short (<7 digits)', () => {
    expect(extractCandidates('code 12345 and room 42')).toHaveLength(0);
  });

  it('ignores overlong separator-free strings (>16 digits — anti-record-ID heuristic)', () => {
    // Salesforce record ID / long numeric identifier
    expect(extractCandidates('record 00170000012ABCDe and 12345678901234567890')).toHaveLength(0);
  });

  it("returns the candidate's position (index) in the text", () => {
    const found = extractCandidates('tel +48221234567 ends');
    expect(found[0]?.index).toBe(4);
  });

  it('does not pick up a number embedded in an alphanumeric token', () => {
    expect(extractCandidates('SKU-4842123456-X order')).toHaveLength(0);
  });
});

// --- Layer 2: libphonenumber validation → E.164 ---
describe('validateToE164', () => {
  it('normalises a valid international number', () => {
    expect(validateToE164('+48 22 123 45 67', 'PL')).toBe('+48221234567');
  });

  it('normalises a national number using defaultCountry (PL, 9 digits, no trunk 0)', () => {
    expect(validateToE164('22 123 45 67', 'PL')).toBe('+48221234567');
  });

  it('handles UK numbers', () => {
    expect(validateToE164('020 7946 0958', 'GB')).toBe('+442079460958');
  });

  it('rejects an IBAN', () => {
    expect(validateToE164('PL61109010140000071219812874', 'PL')).toBeNull();
  });

  it('rejects a date', () => {
    expect(validateToE164('2026-07-27', 'PL')).toBeNull();
  });

  it('rejects an order number that makes no telephonic sense', () => {
    expect(validateToE164('000123456', 'PL')).toBeNull();
  });

  it('rejects an incomplete number', () => {
    expect(validateToE164('123 45', 'PL')).toBeNull();
  });
});
