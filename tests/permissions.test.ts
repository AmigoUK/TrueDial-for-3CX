import { describe, it, expect } from 'vitest';
import {
  hostWithoutPort,
  pbxOriginPattern,
  allowlistOriginPattern,
  contentScriptMatches,
} from '../lib/permissions/registration';

describe('hostWithoutPort', () => {
  it('strips a trailing port and leaves plain hosts alone', () => {
    expect(hostWithoutPort('pbx.example.co.uk:5001')).toBe('pbx.example.co.uk');
    expect(hostWithoutPort('pbx.example.co.uk')).toBe('pbx.example.co.uk');
  });
});

describe('pbxOriginPattern', () => {
  it('builds an https origin pattern without a port (patterns cannot carry one)', () => {
    expect(pbxOriginPattern('pbx.example.co.uk:5001')).toBe('https://pbx.example.co.uk/*');
    expect(pbxOriginPattern('pbx.example.co.uk')).toBe('https://pbx.example.co.uk/*');
  });
});

describe('allowlistOriginPattern', () => {
  it('covers both schemes for a detection host', () => {
    expect(allowlistOriginPattern('crm.example.com')).toBe('*://crm.example.com/*');
    expect(allowlistOriginPattern('crm.example.com:8080')).toBe('*://crm.example.com/*');
  });
});

describe('contentScriptMatches', () => {
  it('collapses to <all_urls> when it is granted', () => {
    expect(contentScriptMatches(['https://a.com/*', '<all_urls>'])).toEqual(['<all_urls>']);
  });
  it('passes granted origins through, deduplicated', () => {
    expect(contentScriptMatches(['https://a.com/*', 'https://a.com/*', '*://b.com/*'])).toEqual([
      'https://a.com/*',
      '*://b.com/*',
    ]);
  });
  it('is empty when nothing is granted (no registration at all)', () => {
    expect(contentScriptMatches([])).toEqual([]);
  });
});
