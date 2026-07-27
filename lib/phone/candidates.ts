// Warstwa 1 detekcji: tani, tolerancyjny wychwyt KANDYDATÓW na numer telefonu.
// Celowo NIE waliduje poprawności — od tego jest warstwa 2 (libphonenumber).
// Zadanie: znaleźć ciągi wyglądające jak numer, z separatorami, i odrzucić
// oczywiste śmieci (za krótkie, za długie, wewnątrz tokenów alfanumerycznych).

export interface Candidate {
  /** Surowy fragment tekstu dokładnie tak, jak wystąpił. */
  raw: string;
  /** Offset początku w przekazanym tekście (dla renderera). */
  index: number;
}

// Dozwolone znaki wewnątrz kandydata: cyfry, spacja, - . ( ) oraz wiodący +/(.
// Kotwiczymy tak, by numer nie sąsiadował z literą/cyfrą (część większego tokenu).
const CANDIDATE_RE = /(?<![\p{L}\d])(\(?\+?\d[\d\s().-]{5,}\d)(?![\p{L}\d])/gu;

const MIN_DIGITS = 7;
const MAX_DIGITS = 16;
// Separatory, które w praktyce łączą numer z kodem/SKU (np. "SKU-123456-X").
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
    // Długi ciąg samych cyfr bez separatorów (>11) → prawdopodobny record ID.
    const hasSeparator = /[\s().+-]/.test(raw);
    if (!hasSeparator && digits > 11) continue;

    const start = m.index;
    const end = start + raw.length;
    // Odrzuć, jeśli numer łączy się przez -./ z tokenem alfanumerycznym po
    // którejś stronie (np. "SKU-4842123456-X"): to kod, nie telefon.
    const joinedBefore = CODE_JOINERS.has(text[start - 1] ?? '') && isAlnum(text[start - 2]);
    const joinedAfter = CODE_JOINERS.has(text[end] ?? '') && isAlnum(text[end + 1]);
    if (joinedBefore || joinedAfter) continue;

    out.push({ raw, index: start });
  }
  return out;
}
