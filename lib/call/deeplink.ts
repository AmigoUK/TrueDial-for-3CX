// Strategia dzwonienia #2 z §3.F3: deep-link do web clienta 3CX.
// Działa BEZ konfiguracji admina i na starszych wersjach — dlatego jest
// pierwszą (i w plasterku 1 jedyną) zaimplementowaną ścieżką.
//
// Ten plik zawiera:
//  - czyste, testowalne funkcje: normalizeFqdn, buildDeepLinkUrl
//  - klasę DeepLinkStrategy implementującą CallStrategy (używa browser.tabs)

import { browser } from 'wxt/browser';
import type { CallStrategy, CallOutcome } from './strategy';

/** Sprowadza FQDN do gołego host[:port] — bez protokołu i końcowego slasha. */
export function normalizeFqdn(fqdn: string): string {
  return fqdn
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');
}

/** Buduje URL web clienta 3CX inicjujący połączenie na podany numer E.164. */
export function buildDeepLinkUrl(fqdn: string, e164: string): string {
  const host = normalizeFqdn(fqdn);
  return `https://${host}/webclient/#/call?phone=${encodeURIComponent(e164)}`;
}

export class DeepLinkStrategy implements CallStrategy {
  readonly id = 'deeplink' as const;

  constructor(private readonly getFqdn: () => Promise<string | undefined>) {}

  async isAvailable(): Promise<boolean> {
    return Boolean(await this.getFqdn());
  }

  async placeCall(e164: string): Promise<CallOutcome> {
    const fqdn = await this.getFqdn();
    if (!fqdn) return { ok: false, strategy: this.id, reason: 'no-fqdn' };

    const host = normalizeFqdn(fqdn);
    const url = buildDeepLinkUrl(host, e164);

    // Preferuj istniejącą kartę web clienta (fokus zamiast duplikacji).
    const existing = await browser.tabs.query({ url: `*://${host}/webclient/*` });
    const tab = existing[0];
    if (tab?.id != null) {
      await browser.tabs.update(tab.id, { url, active: true });
      if (tab.windowId != null) await browser.windows.update(tab.windowId, { focused: true });
    } else {
      await browser.tabs.create({ url, active: true });
    }
    return { ok: true, strategy: this.id };
  }
}
