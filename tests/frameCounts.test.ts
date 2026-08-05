import { describe, it, expect, beforeEach } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import { totalCount, setFrameCount, clearFrameCounts } from '../lib/scanner/frameCounts';

describe('totalCount', () => {
  it('sums per-frame counts', () => {
    expect(totalCount({})).toBe(0);
    expect(totalCount({ '0': 3, '42': 2 })).toBe(5);
  });
});

describe('frame count store', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it('aggregates counts across frames of one tab', async () => {
    expect(await setFrameCount(1, 0, 3)).toBe(3);
    expect(await setFrameCount(1, 42, 2)).toBe(5);
    // A frame re-reporting replaces its own count, not the tab total.
    expect(await setFrameCount(1, 0, 4)).toBe(6);
  });

  it('keeps tabs independent', async () => {
    await setFrameCount(1, 0, 3);
    expect(await setFrameCount(2, 0, 7)).toBe(7);
  });

  it('clears a tab on navigation/close', async () => {
    await setFrameCount(1, 0, 3);
    await clearFrameCounts(1);
    expect(await setFrameCount(1, 5, 1)).toBe(1);
  });
});
