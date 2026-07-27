import { clampVolume } from '../../lib/audio/tone';

// Offscreen document: the only place in MV3 that can play audio. It waits for a
// PLAY_TONE message from the service worker and synthesises a short tone with
// WebAudio at the requested (clamped) volume. No bundled audio assets.
interface PlayTone {
  type: 'PLAY_TONE';
  freq: number;
  durationMs: number;
  volume: number;
}

function isPlayTone(m: unknown): m is PlayTone {
  return typeof m === 'object' && m !== null && (m as { type?: unknown }).type === 'PLAY_TONE';
}

browser.runtime.onMessage.addListener((msg: unknown) => {
  if (!isPlayTone(msg)) return;
  playTone(msg);
});

function playTone({ freq, durationMs, volume }: PlayTone): void {
  const vol = clampVolume(volume);
  if (vol === 0) return;

  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;

  const now = ctx.currentTime;
  const dur = durationMs / 1000;
  // Short attack/release envelope to avoid a harsh click.
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(vol, now + 0.01);
  gain.gain.linearRampToValueAtTime(0, now + dur);

  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + dur + 0.02);
  osc.onended = () => void ctx.close();
}
