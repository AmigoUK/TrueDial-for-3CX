import { describe, it, expect } from 'vitest';
import { appendEvent, redact, buildReport, type DiagEvent } from '../lib/diagnostics/events';

const ev = (message: string, ts = 1000): DiagEvent => ({
  ts,
  kind: 'call',
  level: 'info',
  message,
});

describe('appendEvent (ring buffer)', () => {
  it('appends events', () => {
    const buf = appendEvent([], ev('a'), 3);
    expect(buf).toHaveLength(1);
    expect(buf[0]?.message).toBe('a');
  });

  it('keeps only the last N, evicting the oldest', () => {
    let buf: DiagEvent[] = [];
    for (let i = 0; i < 5; i++) buf = appendEvent(buf, ev(String(i)), 3);
    expect(buf.map((e) => e.message)).toEqual(['2', '3', '4']);
  });
});

describe('redact', () => {
  it('masks phone numbers', () => {
    expect(redact('called +48 22 123 45 67 now')).toBe('called <number> now');
  });
  it('masks URLs', () => {
    expect(redact('source https://crm.example.com/lead/42 ok')).toBe('source <url> ok');
  });
});

describe('buildReport', () => {
  const report = buildReport({
    version: '0.2.0',
    fqdnConfigured: true,
    region: 'GB',
    preferredPath: 'auto',
    detectionMode: 'subtle',
    events: [
      ev('dialing +44 20 7946 0958', 0),
      { ...ev('error', 1), level: 'error', kind: 'error' },
    ],
  });

  it('includes version and settings summary', () => {
    expect(report).toContain('Version: 0.2.0');
    expect(report).toContain('Preferred path: auto');
    expect(report).toContain('FQDN configured: yes');
  });

  it('never leaks phone numbers into the report', () => {
    expect(report).not.toContain('7946');
    expect(report).toContain('<number>');
  });
});
