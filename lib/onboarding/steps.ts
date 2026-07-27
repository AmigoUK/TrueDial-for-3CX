// Pure step machine for the onboarding wizard (§10). Kept free of UI so the
// navigation and gating rules are unit-tested; the Wizard component renders it.

import type { Config } from '../storage/config';

export const STEPS = ['fqdn', 'path', 'region', 'permissions', 'done'] as const;
export type Step = (typeof STEPS)[number];

/** Whether the extension has the minimum configuration to place calls. */
export function isConfigured(cfg: Config): boolean {
  return Boolean(cfg.fqdn);
}

/** Whether the user may leave a given step. */
export function canAdvance(step: Step, cfg: Config): boolean {
  switch (step) {
    case 'fqdn':
      return Boolean(cfg.fqdn && cfg.fqdn.trim());
    // The remaining steps all have sensible defaults, so they never block.
    default:
      return true;
  }
}

export function nextStep(step: Step): Step {
  const i = STEPS.indexOf(step);
  return STEPS[Math.min(i + 1, STEPS.length - 1)]!;
}

export function prevStep(step: Step): Step {
  const i = STEPS.indexOf(step);
  return STEPS[Math.max(i - 1, 0)]!;
}
