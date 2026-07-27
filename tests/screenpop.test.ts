import { describe, it, expect } from 'vitest';
import { buildScreenPopUrl } from '../lib/crm/template';
import { GenericUrlAdapter } from '../lib/crm/adapter';

describe('buildScreenPopUrl', () => {
  it('substitutes {number} with URL-encoded E.164', () => {
    expect(buildScreenPopUrl('https://crm.example.com/s?p={number}', '+442079460958')).toBe(
      'https://crm.example.com/s?p=%2B442079460958',
    );
  });

  it('substitutes {national} with the national format', () => {
    const url = buildScreenPopUrl('https://crm/s?p={national}', '+442079460958');
    expect(url).not.toBeNull();
    // National UK format contains no country code and no plus sign.
    expect(url).not.toContain('%2B');
    expect(decodeURIComponent(url!)).toContain('020 7946 0958');
  });

  it('returns null for an empty template', () => {
    expect(buildScreenPopUrl('', '+442079460958')).toBeNull();
    expect(buildScreenPopUrl('   ', '+442079460958')).toBeNull();
  });

  it('returns null when the template has no placeholder', () => {
    expect(buildScreenPopUrl('https://crm.example.com/home', '+442079460958')).toBeNull();
  });
});

describe('GenericUrlAdapter', () => {
  it('matches any URL (long-tail fallback) and builds a pop URL', () => {
    const a = new GenericUrlAdapter('https://crm/s?p={number}');
    expect(a.matches(new URL('https://anything.test/'))).toBe(true);
    expect(a.popUrl('+442079460958')).toContain('%2B442079460958');
  });

  it('popUrl is null without a template', () => {
    expect(new GenericUrlAdapter('').popUrl('+442079460958')).toBeNull();
  });
});
