import { describe, it, expect, vi } from 'vitest';
import { TokenManager, type TokenSet } from '../lib/call/token';

function makeStore(initial: TokenSet | null = null) {
  let value = initial;
  return {
    load: vi.fn(async () => value),
    save: vi.fn(async (t: TokenSet | null) => {
      value = t;
    }),
    get value() {
      return value;
    },
  };
}

function tokenResponse(access: string, expiresIn = 3600) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ access_token: access, expires_in: expiresIn }),
  };
}

describe('TokenManager', () => {
  it('fetches and caches a token', async () => {
    const store = makeStore();
    const fetchFn = vi.fn(async () => tokenResponse('tok-1')) as unknown as typeof fetch;
    const tm = new TokenManager({
      fqdn: 'pbx.test',
      clientId: 'id',
      clientSecret: 'secret',
      fetchFn,
      now: () => 0,
      load: store.load,
      save: store.save,
    });

    expect(await tm.getToken()).toBe('tok-1');
    expect(fetchFn).toHaveBeenCalledOnce();
    expect(store.value?.expiresAt).toBe(3600 * 1000);
  });

  it('reuses a cached token that is still valid', async () => {
    const store = makeStore({ accessToken: 'cached', expiresAt: 10_000_000 });
    const fetchFn = vi.fn(async () => tokenResponse('fresh')) as unknown as typeof fetch;
    const tm = new TokenManager({
      fqdn: 'pbx.test',
      clientId: 'id',
      clientSecret: 'secret',
      fetchFn,
      now: () => 0,
      load: store.load,
      save: store.save,
    });

    expect(await tm.getToken()).toBe('cached');
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('refreshes when the cached token is near expiry', async () => {
    const store = makeStore({ accessToken: 'old', expiresAt: 20_000 });
    const fetchFn = vi.fn(async () => tokenResponse('new')) as unknown as typeof fetch;
    const tm = new TokenManager({
      fqdn: 'pbx.test',
      clientId: 'id',
      clientSecret: 'secret',
      fetchFn,
      now: () => 0,
      load: store.load,
      save: store.save,
    });
    // 20s left < 30s safety margin → refresh.
    expect(await tm.getToken()).toBe('new');
    expect(fetchFn).toHaveBeenCalledOnce();
  });

  it('force=true always refetches', async () => {
    const store = makeStore({ accessToken: 'cached', expiresAt: 10_000_000 });
    const fetchFn = vi.fn(async () => tokenResponse('forced')) as unknown as typeof fetch;
    const tm = new TokenManager({
      fqdn: 'pbx.test',
      clientId: 'id',
      clientSecret: 'secret',
      fetchFn,
      now: () => 0,
      load: store.load,
      save: store.save,
    });
    expect(await tm.getToken(true)).toBe('forced');
  });

  it('throws and does not cache on token endpoint error', async () => {
    const store = makeStore();
    const fetchFn = vi.fn(async () => ({
      ok: false,
      status: 401,
      json: async () => ({}),
    })) as unknown as typeof fetch;
    const tm = new TokenManager({
      fqdn: 'pbx.test',
      clientId: 'id',
      clientSecret: 'secret',
      fetchFn,
      now: () => 0,
      load: store.load,
      save: store.save,
    });
    await expect(tm.getToken()).rejects.toThrow();
    expect(store.value).toBeNull();
  });
});
