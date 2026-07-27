import { describe, it, expect } from 'vitest';
import { STEPS, canAdvance, nextStep, prevStep, isConfigured } from '../lib/onboarding/steps';
import { withConfigDefaults } from '../lib/storage/config';

describe('onboarding steps', () => {
  it('has a defined linear order ending in done', () => {
    expect(STEPS[0]).toBe('fqdn');
    expect(STEPS[STEPS.length - 1]).toBe('done');
  });

  it('navigates forward and backward within bounds', () => {
    expect(nextStep('fqdn')).toBe('path');
    expect(prevStep('path')).toBe('fqdn');
    expect(nextStep('done')).toBe('done'); // clamped
    expect(prevStep('fqdn')).toBe('fqdn'); // clamped
  });
});

describe('canAdvance', () => {
  it('blocks leaving the fqdn step until an FQDN is set', () => {
    expect(canAdvance('fqdn', withConfigDefaults({}))).toBe(false);
    expect(canAdvance('fqdn', withConfigDefaults({ fqdn: 'pbx.test' }))).toBe(true);
  });

  it('allows advancing from steps with sensible defaults', () => {
    const cfg = withConfigDefaults({ fqdn: 'pbx.test' });
    expect(canAdvance('path', cfg)).toBe(true);
    expect(canAdvance('region', cfg)).toBe(true);
    expect(canAdvance('permissions', cfg)).toBe(true);
  });
});

describe('isConfigured', () => {
  it('is false without an FQDN', () => {
    expect(isConfigured(withConfigDefaults({}))).toBe(false);
  });
  it('is true once an FQDN is present', () => {
    expect(isConfigured(withConfigDefaults({ fqdn: 'pbx.test' }))).toBe(true);
  });
});
