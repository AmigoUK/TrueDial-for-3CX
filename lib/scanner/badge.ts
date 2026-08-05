// The extension toolbar badge shows how many numbers were detected on the
// current tab (CloudTalk-style "detected numbers" counter, §2.2). At or above
// the scan cap we show "200+".

import { MAX_MATCHES } from './constants';

export const BADGE_CAP = MAX_MATCHES;

export function formatBadge(count: number): string {
  if (count <= 0) return '';
  if (count >= BADGE_CAP) return `${BADGE_CAP}+`;
  return String(count);
}
