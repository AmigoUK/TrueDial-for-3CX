// Health check (§6.3, F4). Makes the extension's state explicit: is the PBX
// reachable, can we obtain a token, which call paths are configured, and which
// one will actually be used. Degradation is never silent — the popup and the
// diagnostics panel surface this snapshot.
//
// The reachability probe and token retrieval are injectable, so the decision
// logic is fully unit-tested without a live PBX.

import type { Config } from '../storage/config';
import { orderStrategyIds } from '../call/select';
import { normalizeFqdn } from '../call/deeplink';
import type { StrategyId } from '../call/strategy';

/** Which call paths are configured, in priority order. */
export function configuredPaths(cfg: Config): StrategyId[] {
  const out: StrategyId[] = [];
  if (cfg.fqdn && cfg.clientId && cfg.clientSecret && cfg.ccExtension && cfg.ccDeviceId) {
    out.push('ccapi');
  }
  if (cfg.fqdn) out.push('deeplink');
  out.push('tel'); // always available
  return out;
}

/** The path that will actually be used: the first configured one that also
 *  matches the user's preference order. Null if the forced path is unconfigured. */
export function recommendedPath(cfg: Config): StrategyId | null {
  const configured = new Set(configuredPaths(cfg));
  return orderStrategyIds(cfg.preferredPath).find((id) => configured.has(id)) ?? null;
}

export interface HealthSnapshot {
  reachable: boolean | null;
  tokenOk: boolean | null;
  configured: StrategyId[];
  recommended: StrategyId | null;
}

export interface HealthDeps {
  cfg: Config;
  fetchFn?: typeof fetch;
  getToken: (force?: boolean) => Promise<string>;
}

export async function runHealthCheck(deps: HealthDeps): Promise<HealthSnapshot> {
  const { cfg } = deps;
  const fetchFn = deps.fetchFn ?? fetch;

  let reachable: boolean | null = null;
  if (cfg.fqdn) {
    try {
      await fetchFn(`https://${normalizeFqdn(cfg.fqdn)}/webclient/`, { method: 'HEAD' });
      reachable = true;
    } catch {
      reachable = false;
    }
  }

  let tokenOk: boolean | null = null;
  const ccapiConfigured = Boolean(cfg.fqdn && cfg.clientId && cfg.clientSecret);
  if (ccapiConfigured) {
    try {
      await deps.getToken(true);
      tokenOk = true;
    } catch {
      tokenOk = false;
    }
  }

  return {
    reachable,
    tokenOk,
    configured: configuredPaths(cfg),
    recommended: recommendedPath(cfg),
  };
}
