// Pure, testable ordering of call strategies from the user's preference.
// 'auto' tries the richest path first (Call Control API) and degrades to the
// deep link, then the tel: handler.

import type { StrategyId } from './strategy';

export type PreferredPath = 'auto' | 'ccapi' | 'deeplink' | 'tel';

export function orderStrategyIds(preferred: PreferredPath): StrategyId[] {
  switch (preferred) {
    case 'ccapi':
      return ['ccapi'];
    case 'deeplink':
      return ['deeplink'];
    case 'tel':
      return ['tel'];
    case 'auto':
    default:
      return ['ccapi', 'deeplink', 'tel'];
  }
}
