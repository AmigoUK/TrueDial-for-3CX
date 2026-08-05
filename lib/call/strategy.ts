// The shared interface for call paths. Three strategies implement it —
// CallControlStrategy (CCAPI), DeepLinkStrategy and TelStrategy — and
// CallOrchestrator picks the first available one by priority.

export type StrategyId = 'ccapi' | 'deeplink' | 'tel';

export interface CallOutcome {
  ok: boolean;
  strategy: StrategyId;
  /** The failure reason (for explicit reporting — zero silent failures). */
  reason?: string;
  /** True when the strategy can only hand the call off (e.g. tel:) and cannot
   *  confirm anything actually happened. History records these as 'attempted',
   *  not 'placed'. */
  unconfirmed?: boolean;
}

export interface CallStrategy {
  readonly id: StrategyId;
  /** Whether the strategy is configured and usable right now. */
  isAvailable(): Promise<boolean>;
  /** Places a call to an E.164 number. */
  placeCall(e164: string): Promise<CallOutcome>;
}
