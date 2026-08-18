// Presentation helpers for numbers and call timestamps. E.164 is the right
// storage and transport form, but it is a poor thing to read: the popup shows
// the number the way the country writes it, and a call's age rather than a
// stopwatch reading.

import { parsePhoneNumberFromString } from 'libphonenumber-js/min';

/** An E.164 number in readable international form; unparseable input is passed
 *  through untouched, so the UI never blanks a value it cannot improve. */
export function formatE164(e164: string): string {
  try {
    return parsePhoneNumberFromString(e164)?.formatInternational() ?? e164;
  } catch {
    return e164;
  }
}

/** Whether two instants fall on the same local calendar day. */
export function isSameDay(a: number, b: number): boolean {
  const x = new Date(a);
  const y = new Date(b);
  return (
    x.getFullYear() === y.getFullYear() &&
    x.getMonth() === y.getMonth() &&
    x.getDate() === y.getDate()
  );
}

/** A clock time for calls placed today, a date for anything older. Seconds are
 *  noise in a call list, and a bare time on an older entry reads as "today". */
export function formatCallTime(ts: number, now: number = Date.now()): string {
  const when = new Date(ts);
  return isSameDay(ts, now)
    ? when.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : when.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}
