import { describe, it, expect } from 'vitest';
import { exportConfig, importConfig, mergeManaged } from '../lib/storage/portable';
import { withConfigDefaults } from '../lib/storage/config';

const cfg = withConfigDefaults({
  fqdn: 'pbx.test',
  clientId: 'id',
  clientSecret: 'super-secret',
  defaultRegion: 'PL',
});

describe('exportConfig', () => {
  it('omits the client secret by default', () => {
    const json = exportConfig(cfg);
    const parsed = JSON.parse(json);
    expect(parsed.fqdn).toBe('pbx.test');
    expect(parsed.clientId).toBe('id');
    expect('clientSecret' in parsed).toBe(false);
  });

  it('includes the secret when explicitly requested', () => {
    const parsed = JSON.parse(exportConfig(cfg, { includeSecrets: true }));
    expect(parsed.clientSecret).toBe('super-secret');
  });
});

describe('importConfig', () => {
  it('parses a valid export and keeps only known keys', () => {
    const patch = importConfig('{"fqdn":"new.test","defaultRegion":"DE","bogus":1}');
    expect(patch).toEqual({ fqdn: 'new.test', defaultRegion: 'DE' });
  });

  it('returns null for invalid JSON', () => {
    expect(importConfig('{ not json')).toBeNull();
  });

  it('returns null when a known field has the wrong type', () => {
    expect(importConfig('{"allowlist":"nope"}')).toBeNull();
  });
});

describe('mergeManaged (enterprise policy overlay)', () => {
  it('managed policy overrides user config', () => {
    const merged = mergeManaged(withConfigDefaults({ fqdn: 'user.test', allowlistMode: false }), {
      fqdn: 'policy.test',
      allowlistMode: true,
    });
    expect(merged.fqdn).toBe('policy.test');
    expect(merged.allowlistMode).toBe(true);
  });

  it('leaves user config intact when there is no policy', () => {
    const base = withConfigDefaults({ fqdn: 'user.test' });
    expect(mergeManaged(base, null)).toEqual(base);
  });
});
