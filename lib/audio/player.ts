// Service-worker side of audio: ensures the offscreen document exists, then
// asks it to play a confirmation tone. The offscreen APIs are not in the
// polyfill's types, so we access them through a minimal local shim.

import { browser } from 'wxt/browser';
import { toneSpec, clampVolume } from './tone';

interface OffscreenApi {
  createDocument(opts: { url: string; reasons: string[]; justification: string }): Promise<void>;
}
interface RuntimeWithContexts {
  getContexts?: (filter: { contextTypes: string[] }) => Promise<unknown[]>;
}

const OFFSCREEN_URL = 'offscreen.html';

async function hasOffscreen(): Promise<boolean> {
  const runtime = browser.runtime as unknown as RuntimeWithContexts;
  if (!runtime.getContexts) return false;
  const contexts = await runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] });
  return contexts.length > 0;
}

async function ensureOffscreen(): Promise<void> {
  if (await hasOffscreen()) return;
  const offscreen = (browser as unknown as { offscreen?: OffscreenApi }).offscreen;
  if (!offscreen) throw new Error('offscreen API unavailable');
  await offscreen.createDocument({
    url: OFFSCREEN_URL,
    reasons: ['AUDIO_PLAYBACK'],
    justification: 'Play a short confirmation tone when a call is placed.',
  });
}

// createDocument resolves before the offscreen page has necessarily registered
// its onMessage listener, so the very first send can find no receiver and
// reject. A short retry covers that startup race.
const SEND_ATTEMPTS = 4;
const SEND_RETRY_DELAY_MS = 75;

async function sendWithRetry(message: unknown): Promise<void> {
  for (let attempt = 1; ; attempt++) {
    try {
      await browser.runtime.sendMessage(message);
      return;
    } catch (err) {
      if (attempt >= SEND_ATTEMPTS) throw err;
      await new Promise((r) => setTimeout(r, SEND_RETRY_DELAY_MS));
    }
  }
}

/** Plays a confirmation tone honouring the user's sound settings. */
export async function playConfirmation(soundName: string, volume: number): Promise<void> {
  const vol = clampVolume(volume);
  if (vol === 0) return;
  await ensureOffscreen();
  const spec = toneSpec(soundName);
  await sendWithRetry({
    type: 'PLAY_TONE',
    freq: spec.freq,
    durationMs: spec.durationMs,
    volume: vol,
  });
}
