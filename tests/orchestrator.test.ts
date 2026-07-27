import { describe, it, expect, vi } from 'vitest';
import { CallOrchestrator } from '../lib/call/orchestrator';
import { orderStrategyIds } from '../lib/call/select';
import type { CallStrategy, CallOutcome, StrategyId } from '../lib/call/strategy';

function fake(id: StrategyId, available: boolean, outcome: Partial<CallOutcome> = {}): CallStrategy {
  return {
    id,
    isAvailable: vi.fn(async () => available),
    placeCall: vi.fn(async () => ({ ok: true, strategy: id, ...outcome })),
  };
}

describe('orderStrategyIds', () => {
  it('auto → deeplink, potem tel', () => {
    expect(orderStrategyIds('auto')).toEqual(['deeplink', 'tel']);
  });
  it('wymuszony deeplink', () => {
    expect(orderStrategyIds('deeplink')).toEqual(['deeplink']);
  });
  it('wymuszony tel', () => {
    expect(orderStrategyIds('tel')).toEqual(['tel']);
  });
});

describe('CallOrchestrator (matryca fallbacków)', () => {
  it('wybiera pierwszą dostępną', async () => {
    const o = new CallOrchestrator([fake('deeplink', true), fake('tel', true)]);
    const out = await o.placeCall('+48221234567');
    expect(out).toEqual({ ok: true, strategy: 'deeplink' });
  });

  it('pomija niedostępną i schodzi do następnej', async () => {
    const deeplink = fake('deeplink', false);
    const tel = fake('tel', true);
    const out = await new CallOrchestrator([deeplink, tel]).placeCall('+48221234567');
    expect(out.strategy).toBe('tel');
    expect(deeplink.placeCall).not.toHaveBeenCalled();
  });

  it('gdy dostępna strategia zawiedzie (ok:false), próbuje następnej', async () => {
    const failing: CallStrategy = {
      id: 'deeplink',
      isAvailable: async () => true,
      placeCall: async () => ({ ok: false, strategy: 'deeplink', reason: 'boom' }),
    };
    const tel = fake('tel', true);
    const out = await new CallOrchestrator([failing, tel]).placeCall('+48221234567');
    expect(out.strategy).toBe('tel');
    expect(out.ok).toBe(true);
  });

  it('gdy strategia rzuci wyjątek, próbuje następnej', async () => {
    const throwing: CallStrategy = {
      id: 'deeplink',
      isAvailable: async () => true,
      placeCall: async () => {
        throw new Error('network');
      },
    };
    const out = await new CallOrchestrator([throwing, fake('tel', true)]).placeCall('+1');
    expect(out.strategy).toBe('tel');
    expect(out.ok).toBe(true);
  });

  it('gdy żadna niedostępna — jawny błąd z ostatnim powodem', async () => {
    const out = await new CallOrchestrator([fake('deeplink', false)]).placeCall('+1');
    expect(out.ok).toBe(false);
    expect(out.reason).toBeDefined();
  });
});
