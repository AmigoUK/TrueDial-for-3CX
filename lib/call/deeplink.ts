// Call path #2 from the plan (§3.F3): the 3CX web client deep link.
// It works WITHOUT administrator configuration and on older versions, so in
// 'auto' it sits between the Call Control API and the tel: handler.
//
// This file contains:
//  - pure, testable functions: normalizeFqdn, buildDeepLinkUrl, isWebClientUrl
//  - the DeepLinkStrategy class implementing CallStrategy (uses browser.tabs)

import { browser } from 'wxt/browser';
import type { CallStrategy, CallOutcome } from './strategy';

/** Reduces an FQDN to a bare host[:port] — no protocol, no trailing slash. */
export function normalizeFqdn(fqdn: string): string {
  return fqdn
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');
}

/** Builds the 3CX web client URL that starts a call to the given E.164 number. */
export function buildDeepLinkUrl(fqdn: string, e164: string): string {
  const host = normalizeFqdn(fqdn);
  return `https://${host}/webclient/#/call?phone=${encodeURIComponent(e164)}`;
}

/** Whether a tab URL is the 3CX web client on the given host[:port].
 *  Match patterns cannot express a port, so tabs are matched by parsing the URL
 *  instead of passing a pattern to tabs.query. */
export function isWebClientUrl(tabUrl: string, host: string): boolean {
  let url: URL;
  try {
    url = new URL(tabUrl);
  } catch {
    return false;
  }
  return url.host === host && url.pathname.startsWith('/webclient');
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
    const url = buildDeepLinkUrl(fqdn, e164);

    // Prefer an existing web client tab (focus rather than duplicate). The
    // query takes no URL pattern because a port-qualified host (pbx.test:5001)
    // is not expressible as a match pattern; we filter the tab list instead.
    const tabs = await browser.tabs.query({});
    const tab = tabs.find((t) => t.url != null && isWebClientUrl(t.url, host));
    if (tab?.id != null) {
      await browser.tabs.update(tab.id, { url, active: true });
      if (tab.windowId != null) await browser.windows.update(tab.windowId, { focused: true });
    } else {
      await browser.tabs.create({ url, active: true });
    }
    return { ok: true, strategy: this.id };
  }
}
