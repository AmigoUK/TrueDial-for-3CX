// Wrappers over chrome.storage. Config and history live in `local` (persistent);
// ephemeral state lives in `session`. NO state lives in the SW's global
// variables — the SW is fully restartable at any moment (an MV3 requirement).

import { browser } from 'wxt/browser';
import { type Config, withConfigDefaults } from './config';
import { importConfig, mergeManaged } from './portable';
import type { TokenSet } from '../call/token';

export * from './config';
export { exportConfig, importConfig } from './portable';

const CONFIG_KEY = 'config';
const HISTORY_KEY = 'history';
const CC_TOKEN_KEY = 'ccToken';

export interface CallHistoryEntry {
  e164: string;
  ts: number;
  source?: string;
  /** 'attempted' = handed off without confirmation (the tel: path). */
  status: 'placed' | 'attempted' | 'failed';
}

/** Whether the user has ever saved a config (as opposed to pure defaults). */
export async function hasStoredConfig(): Promise<boolean> {
  const raw = await browser.storage.local.get(CONFIG_KEY);
  return raw[CONFIG_KEY] != null;
}

// Enterprise policy (§8): read chrome.storage.managed and validate it through
// the same import schema. Returns null when there is no policy.
async function getManagedConfig(): Promise<Partial<Config> | null> {
  try {
    const managed = await browser.storage.managed?.get();
    if (!managed || Object.keys(managed).length === 0) return null;
    return importConfig(JSON.stringify(managed));
  } catch {
    return null; // no managed store configured
  }
}

export async function getConfig(): Promise<Config> {
  const raw = await browser.storage.local.get(CONFIG_KEY);
  const local = withConfigDefaults(raw[CONFIG_KEY] ?? {});
  // A managed policy overlays (and wins over) the user's local config.
  return mergeManaged(local, await getManagedConfig());
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

// Cached Call Control API token. Kept in local so it survives SW restarts; it is
// short-lived and refreshed by the TokenManager.
export async function loadCcToken(): Promise<TokenSet | null> {
  const raw = await browser.storage.local.get(CC_TOKEN_KEY);
  return (raw[CC_TOKEN_KEY] as TokenSet | undefined) ?? null;
}

export async function saveCcToken(t: TokenSet | null): Promise<void> {
  if (t === null) await browser.storage.local.remove(CC_TOKEN_KEY);
  else await browser.storage.local.set({ [CC_TOKEN_KEY]: t });
}
