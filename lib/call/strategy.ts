// The shared interface for call paths. Three strategies implement it —
// CallControlStrategy (CCAPI), DeepLinkStrategy and TelStrategy — and
// CallOrchestrator picks the first available one by priority.

export type StrategyId = 'ccapi' | 'deeplink' | 'tel';

/** One strategy's result within a dialling attempt (orchestrator bookkeeping). */
export interface CallAttempt {
  strategy: StrategyId;
  ok: boolean;
  reason?: string;
}

export interface CallOutcome {
  ok: boolean;
  strategy: StrategyId;
  /** The failure reason (for explicit reporting — zero silent failures). */
  reason?: string;
  /** True when the strategy can only hand the call off (e.g. tel:) and cannot
   *  confirm anything actually happened. History records these as 'attempted',
   *  not 'placed'. */
  unconfirmed?: boolean;
  /** Every strategy the orchestrator touched, in order — surfaced in the popup
   *  so the user can see WHY a fallback happened, not just that it did. */
  attempts?: CallAttempt[];
}

export interface CallStrategy {
  readonly id: StrategyId;
  /** Whether the strategy is configured and usable right now. */
  isAvailable(): Promise<boolean>;
  /** Places a call to an E.164 number. */
  placeCall(e164: string): Promise<CallOutcome>;
}
