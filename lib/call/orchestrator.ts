// Wybiera pierwszą DOSTĘPNĄ strategię wg priorytetu i inicjuje połączenie.
// Degradacja jest jawna: jeśli żadna strategia nie jest dostępna, zwracamy
// jasny wynik z powodem (raportowany użytkownikowi — zero silent failures).

import type { CallStrategy, CallOutcome } from './strategy';

export class CallOrchestrator {
  /** Strategie w kolejności preferencji (np. [ccapi, deeplink, tel]). */
  constructor(private readonly strategies: CallStrategy[]) {}

  async placeCall(e164: string): Promise<CallOutcome> {
    for (const s of this.strategies) {
      if (await s.isAvailable()) {
        try {
          return await s.placeCall(e164);
        } catch (err) {
          // Spróbuj następnej strategii, ale zapamiętaj powód.
          return { ok: false, strategy: s.id, reason: String(err) };
        }
      }
    }
    return { ok: false, strategy: 'deeplink', reason: 'no-strategy-available' };
  }
}
