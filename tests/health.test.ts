import { describe, it, expect, vi } from 'vitest';
import { configuredPaths, recommendedPath, runHealthCheck } from '../lib/diagnostics/health';
import { withConfigDefaults } from '../lib/storage/config';

const full = withConfigDefaults({
  fqdn: 'pbx.test',
  clientId: 'id',
  clientSecret: 'sec',
  ccExtension: '100',
  ccDeviceId: 'dev-1',
});

describe('configuredPaths', () => {
  it('tel is always configured', () => {
    expect(configuredPaths(withConfigDefaults({}))).toEqual(['tel']);
  });
  it('deeplink needs an FQDN', () => {
    expect(configuredPaths(withConfigDefaults({ fqdn: 'pbx.test' }))).toEqual(['deeplink', 'tel']);
  });
  it('ccapi needs full credentials', () => {
    expect(configuredPaths(full)).toEqual(['ccapi', 'deeplink', 'tel']);
  });
});

describe('recommendedPath', () => {
  it('follows the preference among configured paths', () => {
    expect(recommendedPath(withConfigDefaults({ fqdn: 'pbx.test', preferredPath: 'auto' }))).toBe(
      'deeplink',
    );
    expect(recommendedPath(full)).toBe('ccapi');
  });
  it('is null when the forced path is not configured', () => {
    expect(recommendedPath(withConfigDefaults({ preferredPath: 'ccapi' }))).toBeNull();
  });
});

describe('runHealthCheck', () => {
  it('reports reachable + tokenOk on success', async () => {
    const fetchFn = vi.fn(async () => ({ ok: true, status: 200 })) as unknown as typeof fetch;
    const snap = await runHealthCheck({ cfg: full, fetchFn, getToken: async () => 'tok' });
    expect(snap.reachable).toBe(true);
    expect(snap.tokenOk).toBe(true);
    expect(snap.recommended).toBe('ccapi');
  });

  it('reports unreachable when the fetch throws', async () => {
    const fetchFn = vi.fn(async () => {
      throw new Error('network');
    }) as unknown as typeof fetch;
    const snap = await runHealthCheck({ cfg: full, fetchFn, getToken: async () => 'tok' });
    expect(snap.reachable).toBe(false);
  });

  it('tokenOk is null without CCAPI credentials', async () => {
    const fetchFn = vi.fn(async () => ({ ok: true, status: 200 })) as unknown as typeof fetch;
    const snap = await runHealthCheck({
      cfg: withConfigDefaults({ fqdn: 'pbx.test' }),
      fetchFn,
      getToken: async () => 'tok',
    });
    expect(snap.tokenOk).toBeNull();
  });

  it('tokenOk is false when token retrieval fails', async () => {
    const fetchFn = vi.fn(async () => ({ ok: true, status: 200 })) as unknown as typeof fetch;
    const snap = await runHealthCheck({
      cfg: full,
      fetchFn,
      getToken: async () => {
        throw new Error('401');
      },
    });
    expect(snap.tokenOk).toBe(false);
  });
});
