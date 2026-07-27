// Pure, testable ordering of call strategies from the user's preference.
// When the Call Control API strategy lands, 'auto' becomes
// ['ccapi', 'deeplink', 'tel'] and 'ccapi' joins PreferredPath.

import type { StrategyId } from './strategy';

export type PreferredPath = 'auto' | 'deeplink' | 'tel';

export function orderStrategyIds(preferred: PreferredPath): StrategyId[] {
  switch (preferred) {
    case 'deeplink':
      return ['deeplink'];
    case 'tel':
      return ['tel'];
    case 'auto':
    default:
      return ['deeplink', 'tel'];
  }
}
