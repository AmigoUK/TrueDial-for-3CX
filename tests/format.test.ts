import { describe, it, expect } from 'vitest';
import { formatE164, isSameDay, formatCallTime } from '../lib/phone/format';

describe('formatE164', () => {
  it('renders an E.164 number in readable international form', () => {
    expect(formatE164('+442079460958')).toBe('+44 20 7946 0958');
  });

  it('groups a Polish number the way the country writes it', () => {
    expect(formatE164('+48221234567')).toBe('+48 22 123 45 67');
  });

  it('returns anything unparseable unchanged, never empty', () => {
    expect(formatE164('not a number')).toBe('not a number');
    expect(formatE164('')).toBe('');
  });
});

describe('isSameDay', () => {
  const noon = new Date(2026, 7, 18, 12, 0, 0).getTime();

  it('accepts two moments in the same local day', () => {
    expect(isSameDay(new Date(2026, 7, 18, 0, 1, 0).getTime(), noon)).toBe(true);
    expect(isSameDay(new Date(2026, 7, 18, 23, 59, 0).getTime(), noon)).toBe(true);
  });

  it('rejects the minute either side of midnight', () => {
    expect(isSameDay(new Date(2026, 7, 17, 23, 59, 0).getTime(), noon)).toBe(false);
    expect(isSameDay(new Date(2026, 7, 19, 0, 1, 0).getTime(), noon)).toBe(false);
  });

  it('rejects the same calendar day a year apart', () => {
    expect(isSameDay(new Date(2025, 7, 18, 12, 0, 0).getTime(), noon)).toBe(false);
  });
});

describe('formatCallTime', () => {
  const now = new Date(2026, 7, 18, 15, 30, 0).getTime();

  it('shows a clock time for calls placed today, without seconds', () => {
    const out = formatCallTime(new Date(2026, 7, 18, 9, 17, 42).getTime(), now);
    expect(out).toMatch(/\d{1,2}[:.]\d{2}/);
    expect(out).not.toMatch(/\d{1,2}[:.]\d{2}[:.]\d{2}/); // no seconds
  });

  it('shows a date for older calls, so yesterday cannot read as today', () => {
    const today = formatCallTime(new Date(2026, 7, 18, 9, 17, 0).getTime(), now);
    const older = formatCallTime(new Date(2026, 7, 11, 9, 17, 0).getTime(), now);
    expect(older).not.toBe(today);
    expect(older).toMatch(/\d/);
  });
});
