// Wrappers over chrome.storage. Config and history live in `local` (persistent);
// ephemeral state lives in `session`. NO state lives in the SW's global
// variables — the SW is fully restartable at any moment (an MV3 requirement).

import { browser } from 'wxt/browser';
import { type Config, withConfigDefaults } from './config';

export * from './config';

const CONFIG_KEY = 'config';
const HISTORY_KEY = 'history';

export interface CallHistoryEntry {
  e164: string;
  ts: number;
  source?: string;
  status: 'placed' | 'failed';
}

export async function getConfig(): Promise<Config> {
  const raw = await browser.storage.local.get(CONFIG_KEY);
  return withConfigDefaults(raw[CONFIG_KEY] ?? {});
}

export async function setConfig(patch: Partial<Config>): Promise<Config> {
  const next = { ...(await getConfig()), ...patch };
  await browser.storage.local.set({ [CONFIG_KEY]: next });
  return next;
}

export async function setSiteEnabled(host: string, enabled: boolean): Promise<void> {
  const cfg = await getConfig();
  await setConfig({ siteOverrides: { ...cfg.siteOverrides, [host]: enabled } });
}

export async function getHistory(): Promise<CallHistoryEntry[]> {
  const raw = await browser.storage.local.get(HISTORY_KEY);
  return (raw[HISTORY_KEY] as CallHistoryEntry[] | undefined) ?? [];
}

/** Appends an entry and prunes by retention (retention in days from config). */
export async function pushHistory(entry: CallHistoryEntry): Promise<void> {
  const cfg = await getConfig();
  const cutoff = entry.ts - cfg.historyRetentionDays * 24 * 60 * 60 * 1000;
  const history = [entry, ...(await getHistory())]
    .filter((e) => e.ts >= cutoff)
    .slice(0, 500);
  await browser.storage.local.set({ [HISTORY_KEY]: history });
}

export async function clearHistory(): Promise<void> {
  await browser.storage.local.remove(HISTORY_KEY);
}
