// Wspólny interfejs ścieżek dzwonienia. W plasterku 1 istnieje tylko
// DeepLinkStrategy; kolejne plasterki dokładają CallControlStrategy (CCAPI)
// i TelStrategy (tel:) BEZ zmian w wołających — CallOrchestrator wybiera
// pierwszą dostępną wg priorytetu.

export type StrategyId = 'ccapi' | 'deeplink' | 'tel';

export interface CallOutcome {
  ok: boolean;
  strategy: StrategyId;
  /** Powód niepowodzenia (do jawnego raportowania — zero silent failures). */
  reason?: string;
}

export interface CallStrategy {
  readonly id: StrategyId;
  /** Czy strategia jest skonfigurowana i użyteczna teraz. */
  isAvailable(): Promise<boolean>;
  /** Inicjuje połączenie na numer w E.164. */
  placeCall(e164: string): Promise<CallOutcome>;
}
