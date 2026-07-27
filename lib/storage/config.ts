// The configuration shape plus the pure "should we scan this domain" logic.
// Kept out of the chrome.storage layer so it is 100% testable under Node.

import type { CountryCode } from 'libphonenumber-js/min';
import type { PreferredPath } from '../call/select';

export type DetectionMode = 'subtle' | 'off';

export interface Config {
  /** The 3CX instance FQDN (host[:port]); absent = the extension is unconfigured. */
  fqdn?: string;
  /** Default region for national numbers (libphonenumber). */
  defaultRegion: CountryCode;
  /** Presentation mode for detection (slice 1: 'subtle' or 'off'). */
  detectionMode: DetectionMode;
  /** Preferred call path; the orchestrator falls back from here. */
  preferredPath: PreferredPath;
  /** Screen-pop URL template (§3.F5); empty = disabled. Placeholders:
   *  {number} (E.164), {national}. Opened on an outgoing call. */
  screenPopUrl: string;
  /** When true, scan ONLY hosts on the allowlist (the CWS plan B). */
  allowlistMode: boolean;
  allowlist: string[];
  /** Per-site enable/disable from the popup; overrides everything. */
  siteOverrides: Record<string, boolean>;
  historyRetentionDays: number;
}

export const DEFAULT_CONFIG: Config = {
  fqdn: undefined,
  defaultRegion: 'GB',
  detectionMode: 'subtle',
  preferredPath: 'auto',
  screenPopUrl: '',
  allowlistMode: false,
  allowlist: [],
  siteOverrides: {},
  historyRetentionDays: 30,
};

export function withConfigDefaults(partial: Partial<Config>): Config {
  return { ...DEFAULT_CONFIG, ...partial };
}

/** Whether the content script should scan a given host. Order: override → allowlist. */
export function isSiteEnabled(cfg: Config, host: string): boolean {
  const override = cfg.siteOverrides[host];
  if (override !== undefined) return override; // a manual decision wins
  if (cfg.allowlistMode) return cfg.allowlist.includes(host);
  return true;
}
