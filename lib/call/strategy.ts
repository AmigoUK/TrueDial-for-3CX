// The shared interface for call paths. In slice 1 only DeepLinkStrategy exists;
// later slices add CallControlStrategy (CCAPI) and TelStrategy (tel:) WITHOUT
// changing callers — CallOrchestrator picks the first available one by priority.

export type StrategyId = 'ccapi' | 'deeplink' | 'tel';

export interface CallOutcome {
  ok: boolean;
  strategy: StrategyId;
  /** The failure reason (for explicit reporting — zero silent failures). */
  reason?: string;
}

export interface CallStrategy {
  readonly id: StrategyId;
  /** Whether the strategy is configured and usable right now. */
  isAvailable(): Promise<boolean>;
  /** Places a call to an E.164 number. */
  placeCall(e164: string): Promise<CallOutcome>;
}
