// Config import/export (JSON) and the enterprise managed-policy overlay (§8).
// Pure and testable. Secrets are excluded from exports by default so a shared
// config file carries no credentials.

import { z } from 'zod';
import type { Config } from './config';

const SECRET_KEYS = ['clientSecret'] as const;

export function exportConfig(cfg: Config, opts: { includeSecrets?: boolean } = {}): string {
  const out: Record<string, unknown> = { ...cfg };
  if (!opts.includeSecrets) {
    for (const k of SECRET_KEYS) delete out[k];
  }
  return JSON.stringify(out, null, 2);
}

// A permissive schema: every field optional, unknown keys stripped. This is how
// both imports and managed policies are validated before use.
const importSchema = z
  .object({
    fqdn: z.string(),
    clientId: z.string(),
    clientSecret: z.string(),
    ccExtension: z.string(),
    ccDeviceId: z.string(),
    defaultRegion: z.string(),
    detectionMode: z.enum(['subtle', 'aggressive', 'off']),
    preferredPath: z.enum(['auto', 'ccapi', 'deeplink', 'tel']),
    screenPopUrl: z.string(),
    allowlistMode: z.boolean(),
    allowlist: z.array(z.string()),
    siteOverrides: z.record(z.boolean()),
    historyRetentionDays: z.number(),
  })
  .partial()
  .strict()
  .catchall(z.unknown());

/** Parses a JSON config into a validated partial patch, or null on failure. */
export function importConfig(json: string): Partial<Config> | null {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }
  const res = importSchema.safeParse(raw);
  if (!res.success) return null;

  // Keep only keys we recognise (drop the catchall extras).
  const known = importSchema.omit({}).keyof().options as string[];
  const patch: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(res.data)) {
    if (known.includes(k) && v !== undefined) patch[k] = v;
  }
  return patch as Partial<Config>;
}

/** Overlays a managed (admin) policy on top of the user config — policy wins. */
export function mergeManaged(cfg: Config, managed: Partial<Config> | null): Config {
  if (!managed) return cfg;
  return { ...cfg, ...managed };
}
