// Picks the first AVAILABLE strategy by priority and places the call. If an
// available strategy fails (returns ok:false or throws), it falls through to the
// next one. Degradation is explicit: if nothing succeeds we return a clear
// result with a reason (reported to the user — zero silent failures).

import type { CallStrategy, CallOutcome, StrategyId } from './strategy';

export class CallOrchestrator {
  /** Strategies in preference order (e.g. [ccapi, deeplink, tel]). */
  constructor(private readonly strategies: CallStrategy[]) {}

  async placeCall(e164: string): Promise<CallOutcome> {
    let lastId: StrategyId = this.strategies[0]?.id ?? 'deeplink';
    let lastReason = 'no-strategy-available';

    for (const s of this.strategies) {
      if (!(await s.isAvailable())) continue;
      lastId = s.id;
      try {
        const outcome = await s.placeCall(e164);
        if (outcome.ok) return outcome;
        lastReason = outcome.reason ?? 'failed';
      } catch (err) {
        lastReason = String(err);
      }
    }
    return { ok: false, strategy: lastId, reason: lastReason };
  }
}
