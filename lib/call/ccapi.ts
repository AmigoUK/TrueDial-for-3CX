// Call path #1 from the plan (§3.F3, §6.2): the 3CX Call Control API.
// POST https://{fqdn}/callcontrol/{ext}/devices/{deviceId}/makecall with a
// Bearer token and { reason, destination, timeout }. This is the preferred path
// (full call status), but it needs an API application and the right licence, so
// it is only available once fully configured.
//
// On a 401 we refresh the token once and retry, because the SW may have woken
// with a stale token. All I/O is injectable for unit testing.

import type { CallStrategy, CallOutcome } from './strategy';
import type { TokenProvider } from './token';

export interface CcapiConfig {
  fqdn: string;
  extension: string;
  deviceId: string;
}

const CALL_TIMEOUT_S = 30;

export function buildMakeCallUrl(cfg: CcapiConfig): string {
  return `https://${cfg.fqdn}/callcontrol/${cfg.extension}/devices/${cfg.deviceId}/makecall`;
}

export function makeCallBody(e164: string): string {
  return JSON.stringify({ reason: 'call', destination: e164, timeout: CALL_TIMEOUT_S });
}

export class CallControlStrategy implements CallStrategy {
  readonly id = 'ccapi' as const;
  private readonly fetchFn: typeof fetch;

  constructor(
    private readonly getCfg: () => Promise<Partial<CcapiConfig>>,
    private readonly token: TokenProvider,
    fetchFn?: typeof fetch,
  ) {
    this.fetchFn = fetchFn ?? fetch;
  }

  async isAvailable(): Promise<boolean> {
    const c = await this.getCfg();
    return Boolean(c.fqdn && c.extension && c.deviceId);
  }

  async placeCall(e164: string): Promise<CallOutcome> {
    const c = await this.getCfg();
    if (!c.fqdn || !c.extension || !c.deviceId) {
      return { ok: false, strategy: this.id, reason: 'not-configured' };
    }
    const cfg = c as CcapiConfig;

    let res = await this.post(cfg, e164, await this.token.getToken());
    if (res.status === 401) {
      // Stale token → force a refresh and retry once.
      res = await this.post(cfg, e164, await this.token.getToken(true));
    }
    if (res.ok) return { ok: true, strategy: this.id };
    return { ok: false, strategy: this.id, reason: `makecall ${res.status}` };
  }

  private post(
    cfg: CcapiConfig,
    e164: string,
    token: string,
  ): Promise<{ ok: boolean; status: number }> {
    return this.fetchFn(buildMakeCallUrl(cfg), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: makeCallBody(e164),
    });
  }
}
