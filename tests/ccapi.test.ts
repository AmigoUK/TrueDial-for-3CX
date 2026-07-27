import { describe, it, expect, vi } from 'vitest';
import { CallControlStrategy, buildMakeCallUrl } from '../lib/call/ccapi';
import type { TokenProvider } from '../lib/call/token';

const cfg = { fqdn: 'pbx.test', extension: '100', deviceId: 'dev-1' };

function fakeToken(): TokenProvider & { calls: boolean[] } {
  const calls: boolean[] = [];
  return {
    calls,
    getToken: vi.fn(async (force = false) => {
      calls.push(force);
      return force ? 'tok-2' : 'tok-1';
    }),
  };
}

describe('buildMakeCallUrl', () => {
  it('targets the device makecall endpoint', () => {
    expect(buildMakeCallUrl(cfg)).toBe('https://pbx.test/callcontrol/100/devices/dev-1/makecall');
  });
});

describe('CallControlStrategy', () => {
  it('isAvailable only when fully configured', async () => {
    const t = fakeToken();
    expect(await new CallControlStrategy(async () => cfg, t).isAvailable()).toBe(true);
    expect(await new CallControlStrategy(async () => ({ fqdn: 'x' }), t).isAvailable()).toBe(false);
  });

  it('places a call and sends the E.164 destination with a Bearer token', async () => {
    const t = fakeToken();
    const fetchFn = vi.fn(async () => ({ ok: true, status: 200 })) as unknown as typeof fetch;
    const out = await new CallControlStrategy(async () => cfg, t, fetchFn).placeCall('+48221234567');

    expect(out).toEqual({ ok: true, strategy: 'ccapi' });
    const init = (fetchFn as unknown as ReturnType<typeof vi.fn>).mock.calls[0]![1];
    expect(init.headers.Authorization).toBe('Bearer tok-1');
    expect(JSON.parse(init.body).destination).toBe('+48221234567');
    expect(JSON.parse(init.body).reason).toBe('call');
  });

  it('refreshes the token and retries once on 401', async () => {
    const t = fakeToken();
    let n = 0;
    const fetchFn = vi.fn(async () => (n++ === 0 ? { ok: false, status: 401 } : { ok: true, status: 200 })) as unknown as typeof fetch;
    const out = await new CallControlStrategy(async () => cfg, t, fetchFn).placeCall('+48221234567');

    expect(out.ok).toBe(true);
    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(t.calls).toEqual([false, true]); // second call forced a refresh
  });

  it('reports a clear failure on a non-OK response', async () => {
    const t = fakeToken();
    const fetchFn = vi.fn(async () => ({ ok: false, status: 500 })) as unknown as typeof fetch;
    const out = await new CallControlStrategy(async () => cfg, t, fetchFn).placeCall('+48221234567');
    expect(out.ok).toBe(false);
    expect(out.reason).toContain('500');
  });
});
