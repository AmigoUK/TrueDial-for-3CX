// Per-tab, per-frame detection counts for the toolbar badge. A page with
// iframes has one content script per frame (all_frames), each reporting its own
// count; the badge must show the SUM across frames, not whichever frame
// reported last. Counts live in chrome.storage.session (ephemeral, survives SW
// restarts within a browser session) — never in SW globals.

import { browser } from 'wxt/browser';

export type FrameCounts = Record<string, number>;

const keyFor = (tabId: number): string => `frameCounts:${tabId}`;

// storage.session is present in MV3 Chrome; fall back to local if unavailable.
function area() {
  return browser.storage.session ?? browser.storage.local;
}

/** Pure: sums the per-frame counts for a tab. */
export function totalCount(counts: FrameCounts): number {
  return Object.values(counts).reduce((sum, n) => sum + n, 0);
}

/** Records one frame's count and returns the tab's new total. */
export async function setFrameCount(
  tabId: number,
  frameId: number,
  count: number,
): Promise<number> {
  const key = keyFor(tabId);
  const raw = await area().get(key);
  const counts = { ...((raw[key] as FrameCounts | undefined) ?? {}), [String(frameId)]: count };
  await area().set({ [key]: counts });
  return totalCount(counts);
}

/** Drops a tab's counts (tab closed or navigated to a new document). */
export async function clearFrameCounts(tabId: number): Promise<void> {
  await area().remove(keyFor(tabId));
}
