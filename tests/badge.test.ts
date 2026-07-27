import { describe, it, expect } from 'vitest';
import { formatBadge } from '../lib/scanner/badge';
import { parseMessage } from '../lib/messaging/schema';

describe('formatBadge', () => {
  it('is empty for zero', () => {
    expect(formatBadge(0)).toBe('');
  });
  it('shows the exact count below the cap', () => {
    expect(formatBadge(7)).toBe('7');
  });
  it('shows 200+ at or above the cap', () => {
    expect(formatBadge(200)).toBe('200+');
    expect(formatBadge(999)).toBe('200+');
  });
});

describe('DETECTION_COUNT message', () => {
  it('accepts a non-negative integer count', () => {
    expect(parseMessage({ type: 'DETECTION_COUNT', count: 5 })).toEqual({
      type: 'DETECTION_COUNT',
      count: 5,
    });
  });
  it('rejects a negative or fractional count', () => {
    expect(parseMessage({ type: 'DETECTION_COUNT', count: -1 })).toBeNull();
    expect(parseMessage({ type: 'DETECTION_COUNT', count: 1.5 })).toBeNull();
  });
});
