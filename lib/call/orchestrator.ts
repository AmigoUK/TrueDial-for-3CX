// Picks the first AVAILABLE strategy by priority and places the call. If an
// available strategy fails (returns ok:false or throws), it falls through to the
// next one. Degradation is explicit: every touched strategy is recorded in
// `attempts`, and if nothing succeeds we return a clear result with a reason
// (reported to the user — zero silent failures).

import type { CallStrategy, CallOutcome, CallAttempt, StrategyId } from './strategy';

export class CallOrchestrator {
  /** Strategies in preference order (e.g. [ccapi, deeplink, tel]). */
  constructor(private readonly strategies: CallStrategy[]) {}

  async placeCall(e164: string): Promise<CallOutcome> {
    const attempts: CallAttempt[] = [];
    let lastId: StrategyId = this.strategies[0]?.id ?? 'deeplink';
    let lastReason = 'no-strategy-available';

    for (const s of this.strategies) {
      if (!(await s.isAvailable())) {
        attempts.push({ strategy: s.id, ok: false, reason: 'not-configured' });
        continue;
      }
      lastId = s.id;
      try {
        const outcome = await s.placeCall(e164);
        attempts.push({ strategy: s.id, ok: outcome.ok, reason: outcome.reason });
        if (outcome.ok) return { ...outcome, attempts };
        lastReason = outcome.reason ?? 'failed';
      } catch (err) {
        lastReason = String(err);
        attempts.push({ strategy: s.id, ok: false, reason: lastReason });
      }
    }
    return { ok: false, strategy: lastId, reason: lastReason, attempts };
  }
}
