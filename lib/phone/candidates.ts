// Detection layer 1: a cheap, tolerant sweep for phone-number CANDIDATES.
// It deliberately does NOT validate correctness — that is layer 2's job
// (libphonenumber). Its task: find strings that look like a number, with
// separators, and reject the obvious rubbish (too short, too long, or sitting
// inside an alphanumeric token).

export interface Candidate {
  /** The raw fragment exactly as it appeared. */
  raw: string;
  /** Start offset within the supplied text (for the renderer). */
  index: number;
}

// Characters allowed inside a candidate: digits, space, - . ( ) and a leading
// +/(. We anchor so the number does not sit next to a letter/digit (i.e. it is
// not part of a larger token).
const CANDIDATE_RE = /(?<![\p{L}\d])(\(?\+?\d[\d\s().-]{5,}\d)(?![\p{L}\d])/gu;

const MIN_DIGITS = 7;
const MAX_DIGITS = 16;
// Separators that in practice join a number to a code/SKU (e.g. "SKU-123456-X").
const CODE_JOINERS = new Set(['-', '.', '/']);

function countDigits(s: string): number {
  let n = 0;
  for (const ch of s) if (ch >= '0' && ch <= '9') n++;
  return n;
}

function isAlnum(ch: string | undefined): boolean {
  return ch !== undefined && /[\p{L}\d]/u.test(ch);
}

export function extractCandidates(text: string): Candidate[] {
  const out: Candidate[] = [];
  for (const m of text.matchAll(CANDIDATE_RE)) {
    const raw = m[1]!;
    const digits = countDigits(raw);
    if (digits < MIN_DIGITS || digits > MAX_DIGITS) continue;
    // A long run of bare digits with no separators (>11) is a likely record ID.
    const hasSeparator = /[\s().+-]/.test(raw);
    if (!hasSeparator && digits > 11) continue;

    const start = m.index;
    const end = start + raw.length;
    // Reject when the number joins an alphanumeric token via -./ on either side
    // (e.g. "SKU-4842123456-X"): that is a code, not a phone number.
    const joinedBefore = CODE_JOINERS.has(text[start - 1] ?? '') && isAlnum(text[start - 2]);
    const joinedAfter = CODE_JOINERS.has(text[end] ?? '') && isAlnum(text[end + 1]);
    if (joinedBefore || joinedAfter) continue;

    out.push({ raw, index: start });
  }
  return out;
}
