// TokenManager: OAuth client-credentials for the 3CX Call Control API (§6.1).
// POST https://{fqdn}/connect/token → Bearer token. It caches the token and
// refreshes proactively before expiry, plus lazily on a 401 (via force=true),
// because the SW may have been asleep when the refresh alarm was due.
//
// All I/O is injectable (fetch, clock, store) so the logic is fully unit-tested.
// Secrets live only in chrome.storage.local and never in `sync`.

export interface TokenSet {
  accessToken: string;
  expiresAt: number; // epoch ms
}

export interface TokenProvider {
  getToken(force?: boolean): Promise<string>;
}

export interface TokenManagerDeps {
  fqdn: string;
  clientId: string;
  clientSecret: string;
  load: () => Promise<TokenSet | null>;
  save: (t: TokenSet | null) => Promise<void>;
  fetchFn?: typeof fetch;
  now?: () => number;
}

// Refresh this many ms before the real expiry, to avoid racing the clock.
const SAFETY_MARGIN_MS = 30_000;

export class TokenManager implements TokenProvider {
  private readonly fetchFn: typeof fetch;
  private readonly now: () => number;

  constructor(private readonly deps: TokenManagerDeps) {
    this.fetchFn = deps.fetchFn ?? fetch;
    this.now = deps.now ?? Date.now;
  }

  async getToken(force = false): Promise<string> {
    const cached = await this.deps.load();
    if (!force && cached && cached.expiresAt - this.now() > SAFETY_MARGIN_MS) {
      return cached.accessToken;
    }
    return this.refresh();
  }

  private async refresh(): Promise<string> {
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.deps.clientId,
      client_secret: this.deps.clientSecret,
    });
    const res = await this.fetchFn(`https://${this.deps.fqdn}/connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (!res.ok) throw new Error(`token endpoint ${res.status}`);

    const json = (await res.json()) as { access_token: string; expires_in: number };
    const set: TokenSet = {
      accessToken: json.access_token,
      expiresAt: this.now() + json.expires_in * 1000,
    };
    await this.deps.save(set);
    return set.accessToken;
  }
}
