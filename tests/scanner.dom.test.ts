// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { Scanner, type Match } from '../lib/scanner/scanner';

function collect(html: string): { matches: Match[]; bodyText: string } {
  document.body.innerHTML = html;
  const matches: Match[] = [];
  const scanner = new Scanner({ defaultRegion: 'GB', onMatches: (m) => matches.push(...m) });
  scanner.start(document.body);
  scanner.stop();
  return { matches, bodyText: document.body.textContent ?? '' };
}

describe('Scanner (DOM)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('detects a genuine number in text', () => {
    const { matches } = collect('<p>Call +44 20 7946 0958 today</p>');
    expect(matches.map((m) => m.e164)).toContain('+442079460958');
  });

  it('does NOT touch input/textarea fields (never break host)', () => {
    const { matches } = collect(
      '<input value="+44 20 7946 0958"><textarea>+44 20 7946 0958</textarea>',
    );
    expect(matches).toHaveLength(0);
  });

  it('does NOT treat a Salesforce record ID as a number', () => {
    const { matches } = collect('<div>Record: 0011x00000ABCDeAAF · 500170000012345</div>');
    expect(matches).toHaveLength(0);
  });

  it('does NOT scan existing links or <code>', () => {
    const { matches } = collect(
      '<a href="tel:+442079460958">+44 20 7946 0958</a><code>+44 20 7946 0958</code>',
    );
    expect(matches).toHaveLength(0);
  });

  it('the renderer does not change the visible page text', () => {
    document.body.innerHTML = '<p>Office: +44 20 7946 0958.</p>';
    const before = document.body.textContent;
    const scanner = new Scanner({ defaultRegion: 'GB', onMatches: () => {} });
    scanner.start(document.body);
    scanner.stop();
    expect(document.body.textContent).toBe(before);
  });
});
