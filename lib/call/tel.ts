// Call path #3 from the plan (§3.F3): the system `tel:` protocol handler.
// It routes to whichever desktop application is registered for tel: links.
// There is no configuration and no success feedback, so it sits last in 'auto'.
//
// A known pain point (§7.3) is handler conflicts: we cannot detect from here
// whether the correct application opened. The onboarding "test tel:" step
// addresses that; this strategy only launches the link.

import { browser } from 'wxt/browser';
import type { CallStrategy, CallOutcome } from './strategy';

export class TelStrategy implements CallStrategy {
  readonly id = 'tel' as const;

  /** Always usable: no configuration is required. */
  async isAvailable(): Promise<boolean> {
    return true;
  }

  async placeCall(e164: string): Promise<CallOutcome> {
    // Opening a tel: URL in a new tab hands off to the OS handler; the tab
    // itself does not render anything meaningful.
    await browser.tabs.create({ url: `tel:${e164}`, active: false });
    return { ok: true, strategy: this.id };
  }
}
