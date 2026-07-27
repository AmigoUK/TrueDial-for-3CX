import { describe, it, expect } from 'vitest';
import { withConfigDefaults, isSiteEnabled, DEFAULT_CONFIG } from '../lib/storage/config';

describe('withConfigDefaults', () => {
  it('uzupełnia brakujące pola defaultami', () => {
    const cfg = withConfigDefaults({ fqdn: 'pbx.firma.pl' });
    expect(cfg.fqdn).toBe('pbx.firma.pl');
    expect(cfg.defaultRegion).toBe(DEFAULT_CONFIG.defaultRegion);
    expect(cfg.detectionMode).toBe('subtle');
    expect(cfg.allowlist).toEqual([]);
  });

  it('nie nadpisuje istniejących pól', () => {
    const cfg = withConfigDefaults({ detectionMode: 'off', allowlistMode: true });
    expect(cfg.detectionMode).toBe('off');
    expect(cfg.allowlistMode).toBe(true);
  });
});

describe('isSiteEnabled', () => {
  it('domyślnie włączone gdy brak override i allowlistMode=false', () => {
    const cfg = withConfigDefaults({});
    expect(isSiteEnabled(cfg, 'app.example.com')).toBe(true);
  });

  it('respektuje per-site wyłączenie (override)', () => {
    const cfg = withConfigDefaults({ siteOverrides: { 'app.example.com': false } });
    expect(isSiteEnabled(cfg, 'app.example.com')).toBe(false);
    expect(isSiteEnabled(cfg, 'other.com')).toBe(true);
  });

  it('w allowlistMode skanuje tylko hosty z allowlisty', () => {
    const cfg = withConfigDefaults({ allowlistMode: true, allowlist: ['crm.firma.pl'] });
    expect(isSiteEnabled(cfg, 'crm.firma.pl')).toBe(true);
    expect(isSiteEnabled(cfg, 'random.com')).toBe(false);
  });

  it('override wyłączający wygrywa nawet w allowlistMode', () => {
    const cfg = withConfigDefaults({
      allowlistMode: true,
      allowlist: ['crm.firma.pl'],
      siteOverrides: { 'crm.firma.pl': false },
    });
    expect(isSiteEnabled(cfg, 'crm.firma.pl')).toBe(false);
  });
});
