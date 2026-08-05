import { describe, it, expect, beforeEach } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import {
  normalizeFqdn,
  buildDeepLinkUrl,
  isWebClientUrl,
  DeepLinkStrategy,
} from '../lib/call/deeplink';
import { TelStrategy } from '../lib/call/tel';

describe('normalizeFqdn', () => {
  it('strips the protocol and a trailing slash', () => {
    expect(normalizeFqdn('https://pbx.firma.pl/')).toBe('pbx.firma.pl');
    expect(normalizeFqdn('http://pbx.firma.pl')).toBe('pbx.firma.pl');
  });
  it('preserves the port', () => {
    expect(normalizeFqdn('pbx.firma.pl:5001')).toBe('pbx.firma.pl:5001');
  });
  it('trims whitespace', () => {
    expect(normalizeFqdn('  pbx.firma.pl  ')).toBe('pbx.firma.pl');
  });
});

describe('buildDeepLinkUrl', () => {
  it('builds the web client URL with the E.164 number', () => {
    expect(buildDeepLinkUrl('pbx.firma.pl', '+48221234567')).toBe(
      'https://pbx.firma.pl/webclient/#/call?phone=%2B48221234567',
    );
  });
  it('normalises the FQDN along the way', () => {
    expect(buildDeepLinkUrl('https://pbx.firma.pl/', '+442079460958')).toBe(
      'https://pbx.firma.pl/webclient/#/call?phone=%2B442079460958',
    );
  });
});

describe('isWebClientUrl', () => {
  it('matches the web client on a port-qualified host', () => {
    expect(isWebClientUrl('https://pbx.test:5001/webclient/#/people', 'pbx.test:5001')).toBe(true);
  });
  it('rejects a different port, host or path', () => {
    expect(isWebClientUrl('https://pbx.test/webclient/', 'pbx.test:5001')).toBe(false);
    expect(isWebClientUrl('https://other.test:5001/webclient/', 'pbx.test:5001')).toBe(false);
    expect(isWebClientUrl('https://pbx.test:5001/admin/', 'pbx.test:5001')).toBe(false);
  });
  it('rejects an unparsable URL', () => {
    expect(isWebClientUrl('not a url', 'pbx.test')).toBe(false);
  });
});

describe('DeepLinkStrategy (port-qualified FQDN)', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it('reuses an existing web client tab even when the host carries a port', async () => {
    const existing = await fakeBrowser.tabs.create({
      url: 'https://pbx.test:5001/webclient/#/people',
      active: false,
    });
    const strategy = new DeepLinkStrategy(async () => 'pbx.test:5001');

    const outcome = await strategy.placeCall('+442079460958');

    expect(outcome).toEqual({ ok: true, strategy: 'deeplink' });
    // fakeBrowser starts with one blank default tab — look at web client tabs only.
    const tabs = (await fakeBrowser.tabs.query({})).filter((t) => t.url?.includes('/webclient/'));
    expect(tabs).toHaveLength(1);
    expect(tabs[0]?.id).toBe(existing.id);
    expect(tabs[0]?.url).toBe('https://pbx.test:5001/webclient/#/call?phone=%2B442079460958');
  });

  it('opens a new tab when no web client tab exists', async () => {
    const strategy = new DeepLinkStrategy(async () => 'pbx.test:5001');
    const outcome = await strategy.placeCall('+442079460958');

    expect(outcome.ok).toBe(true);
    const tabs = await fakeBrowser.tabs.query({});
    expect(
      tabs.some((t) => t.url === 'https://pbx.test:5001/webclient/#/call?phone=%2B442079460958'),
    ).toBe(true);
  });
});

describe('TelStrategy', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it('reports an unconfirmed hand-off, never a confirmed call', async () => {
    const outcome = await new TelStrategy().placeCall('+442079460958');
    expect(outcome.ok).toBe(true);
    expect(outcome.unconfirmed).toBe(true);
    const tabs = await fakeBrowser.tabs.query({});
    expect(tabs.some((t) => t.url === 'tel:+442079460958')).toBe(true);
  });
});
