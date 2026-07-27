// Pure audio helpers: volume clamping and named tone specifications.
// Confirmation sounds are synthesised (WebAudio oscillator) in the offscreen
// document, so there are no bundled audio assets and the volume is fully under
// the user's control — directly addressing the "damaged my hearing" complaint.

export interface ToneSpec {
  freq: number; // Hz
  durationMs: number;
}

export const TONES: Record<string, ToneSpec> = {
  beep: { freq: 660, durationMs: 140 },
  chime: { freq: 880, durationMs: 220 },
  soft: { freq: 440, durationMs: 180 },
};

export const TONE_NAMES = Object.keys(TONES);

/** Clamps a volume to the [0, 1] range; non-finite becomes 0 (silent). */
export function clampVolume(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.min(1, Math.max(0, v));
}

/** Returns the spec for a named tone, falling back to 'beep'. */
export function toneSpec(name: string): ToneSpec {
  return TONES[name] ?? TONES.beep!;
}
