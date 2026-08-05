import { describe, it, expect } from 'vitest';
import { buildScreenPopUrl } from '../lib/crm/template';
import { CRM_PRESETS, presetById } from '../lib/crm/presets';

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

describe('CRM presets', () => {
  it('covers the targeted CRMs with unique ids', () => {
    expect(CRM_PRESETS.map((p) => p.id)).toEqual(['hubspot', 'zoho', 'salesforce']);
    expect(new Set(CRM_PRESETS.map((p) => p.id)).size).toBe(CRM_PRESETS.length);
  });

  it('every preset template carries a placeholder and builds a pop URL', () => {
    for (const p of CRM_PRESETS) {
      // After the user substitutes their account segment, the template must
      // resolve into a working screen-pop URL.
      const filled = p.template
        .replace('YOUR-PORTAL-ID', '12345678')
        .replace('YOUR-DOMAIN', 'example');
      const url = buildScreenPopUrl(filled, '+442079460958');
      expect(url, p.id).not.toBeNull();
      expect(url!, p.id).toMatch(/^https:\/\//);
      expect(decodeURIComponent(url!), p.id).toMatch(/0958/);
    }
  });

  it('presetById finds presets and returns undefined for unknown ids', () => {
    expect(presetById('hubspot')?.label).toBe('HubSpot');
    expect(presetById('nope')).toBeUndefined();
  });
});
