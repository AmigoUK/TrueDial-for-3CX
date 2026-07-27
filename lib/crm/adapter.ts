// CRM adapter interface (§9). In the MVP only GenericUrlAdapter exists — it is
// the proof that the interface works. Native adapters (HubSpot, Pipedrive, Zoho,
// Salesforce) arrive in phase 2 and add contact matching and call logging.

import { buildScreenPopUrl } from './template';

export interface CrmAdapter {
  readonly id: string;
  /** Whether this adapter applies to the given page URL. */
  matches(url: URL): boolean;
  /** The screen-pop URL for an E.164 number, or null if not applicable. */
  popUrl(e164: string): string | null;
  // Phase 2: matchContact(e164), logCall(entry).
}

/** The long-tail fallback: a user-configured URL template, applied everywhere. */
export class GenericUrlAdapter implements CrmAdapter {
  readonly id = 'generic-url';

  constructor(private readonly template: string) {}

  matches(_url: URL): boolean {
    return true;
  }

  popUrl(e164: string): string | null {
    return buildScreenPopUrl(this.template, e164);
  }
}
