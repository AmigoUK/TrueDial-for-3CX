// Kształt konfiguracji + czysta logika decyzji „czy skanować tę domenę".
// Wydzielone z warstwy chrome.storage, by było w 100% testowalne w node.

import type { CountryCode } from 'libphonenumber-js/min';

export type DetectionMode = 'subtle' | 'off';

export interface Config {
  /** FQDN instancji 3CX (host[:port]); brak = rozszerzenie nieskonfigurowane. */
  fqdn?: string;
  /** Region domyślny dla numerów krajowych (libphonenumber). */
  defaultRegion: CountryCode;
  /** Tryb prezentacji detekcji (plasterek 1: 'subtle' lub 'off'). */
  detectionMode: DetectionMode;
  /** Gdy true — skanujemy WYŁĄCZNIE hosty z allowlisty (plan B na CWS). */
  allowlistMode: boolean;
  allowlist: string[];
  /** Per-site włącz/wyłącz z popupu; wygrywa nad wszystkim. */
  siteOverrides: Record<string, boolean>;
  historyRetentionDays: number;
}

export const DEFAULT_CONFIG: Config = {
  fqdn: undefined,
  defaultRegion: 'GB',
  detectionMode: 'subtle',
  allowlistMode: false,
  allowlist: [],
  siteOverrides: {},
  historyRetentionDays: 30,
};

export function withConfigDefaults(partial: Partial<Config>): Config {
  return { ...DEFAULT_CONFIG, ...partial };
}

/** Czy content script ma skanować dany host. Kolejność: override → allowlist. */
export function isSiteEnabled(cfg: Config, host: string): boolean {
  const override = cfg.siteOverrides[host];
  if (override !== undefined) return override; // ręczna decyzja wygrywa
  if (cfg.allowlistMode) return cfg.allowlist.includes(host);
  return true;
}
