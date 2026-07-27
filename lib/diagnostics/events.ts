// Pure diagnostics helpers: the event ring buffer, redaction, and report
// building. Kept free of chrome APIs so they are fully testable under Node.
//
// The local ring buffer is what replaces telemetry when debugging with a user
// (§11): it is always on, but nothing leaves the browser unless the user copies
// the report themselves — and even then numbers and URLs are redacted.

export type DiagKind = 'lifecycle' | 'call' | 'error' | 'config';
export type DiagLevel = 'info' | 'warn' | 'error';

export interface DiagEvent {
  ts: number;
  kind: DiagKind;
  level: DiagLevel;
  message: string;
}

export const DIAG_CAP = 50;

/** Appends an event and keeps only the last `cap` (oldest evicted). */
export function appendEvent(buf: DiagEvent[], ev: DiagEvent, cap: number = DIAG_CAP): DiagEvent[] {
  const next = [...buf, ev];
  return next.length > cap ? next.slice(next.length - cap) : next;
}

const NUMBER_RE = /\+?\d[\d ().-]{5,}\d/g;
const URL_RE = /https?:\/\/\S+/g;

/** Masks phone numbers and URLs so a copied report carries no personal data. */
export function redact(text: string): string {
  return text.replace(URL_RE, '<url>').replace(NUMBER_RE, '<number>');
}

export interface ReportInput {
  version: string;
  fqdnConfigured: boolean;
  region: string;
  preferredPath: string;
  detectionMode: string;
  events: DiagEvent[];
}

/** Builds an anonymised, paste-ready diagnostic report. */
export function buildReport(input: ReportInput): string {
  const lines = [
    'TrueDial for 3CX — diagnostic report',
    `Version: ${input.version}`,
    `FQDN configured: ${input.fqdnConfigured ? 'yes' : 'no'}`,
    `Region: ${input.region}`,
    `Preferred path: ${input.preferredPath}`,
    `Detection: ${input.detectionMode}`,
    '',
    'Events (most recent last):',
    ...input.events.map((e) => {
      const time = new Date(e.ts).toISOString();
      return `[${time}] ${e.level.toUpperCase()} ${e.kind}: ${redact(e.message)}`;
    }),
  ];
  return lines.join('\n');
}
