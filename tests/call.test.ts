import { describe, it, expect } from 'vitest';
import { normalizeFqdn, buildDeepLinkUrl } from '../lib/call/deeplink';

describe('normalizeFqdn', () => {
  it('zdejmuje protokół i końcowy slash', () => {
    expect(normalizeFqdn('https://pbx.firma.pl/')).toBe('pbx.firma.pl');
    expect(normalizeFqdn('http://pbx.firma.pl')).toBe('pbx.firma.pl');
  });
  it('zachowuje port', () => {
    expect(normalizeFqdn('pbx.firma.pl:5001')).toBe('pbx.firma.pl:5001');
  });
  it('przycina białe znaki', () => {
    expect(normalizeFqdn('  pbx.firma.pl  ')).toBe('pbx.firma.pl');
  });
});

describe('buildDeepLinkUrl', () => {
  it('buduje URL web clienta z numerem E.164', () => {
    expect(buildDeepLinkUrl('pbx.firma.pl', '+48221234567')).toBe(
      'https://pbx.firma.pl/webclient/#/call?phone=%2B48221234567',
    );
  });
  it('normalizuje FQDN przy okazji', () => {
    expect(buildDeepLinkUrl('https://pbx.firma.pl/', '+442079460958')).toBe(
      'https://pbx.firma.pl/webclient/#/call?phone=%2B442079460958',
    );
  });
});
