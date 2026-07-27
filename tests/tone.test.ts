import { describe, it, expect } from 'vitest';
import { clampVolume, toneSpec, TONE_NAMES } from '../lib/audio/tone';

describe('clampVolume', () => {
  it('keeps values within 0..1', () => {
    expect(clampVolume(0.5)).toBe(0.5);
    expect(clampVolume(-1)).toBe(0);
    expect(clampVolume(2)).toBe(1);
  });
  it('coerces non-finite to a safe default', () => {
    expect(clampVolume(NaN)).toBe(0);
  });
});

describe('toneSpec', () => {
  it('returns a spec for each known tone', () => {
    for (const name of TONE_NAMES) {
      const spec = toneSpec(name);
      expect(spec.freq).toBeGreaterThan(0);
      expect(spec.durationMs).toBeGreaterThan(0);
    }
  });
  it('falls back to a default for an unknown name', () => {
    expect(toneSpec('does-not-exist')).toEqual(toneSpec('beep'));
  });
});
