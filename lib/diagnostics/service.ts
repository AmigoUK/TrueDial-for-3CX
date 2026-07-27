// The diagnostics store, backed by chrome.storage.session (ephemeral — cleared
// when the browser restarts, which is the right lifetime for a debug buffer).
// Reads/writes are small; the SW may be restarted at any time, so we never keep
// the buffer in a global variable.

import { browser } from 'wxt/browser';
import { appendEvent, type DiagEvent, type DiagKind, type DiagLevel } from './events';

const KEY = 'diag';

// storage.session is present in MV3 Chrome; fall back to local if unavailable.
function area() {
  return browser.storage.session ?? browser.storage.local;
}

export async function recordEvent(
  kind: DiagKind,
  level: DiagLevel,
  message: string,
): Promise<void> {
  const store = area();
  const raw = await store.get(KEY);
  const buf = (raw[KEY] as DiagEvent[] | undefined) ?? [];
  const next = appendEvent(buf, { ts: Date.now(), kind, level, message });
  await store.set({ [KEY]: next });
}

export async function getEvents(): Promise<DiagEvent[]> {
  const raw = await area().get(KEY);
  return (raw[KEY] as DiagEvent[] | undefined) ?? [];
}

export async function clearEvents(): Promise<void> {
  await area().remove(KEY);
}
