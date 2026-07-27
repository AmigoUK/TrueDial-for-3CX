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

  it('wykrywa prawdziwy numer w tekście', () => {
    const { matches } = collect('<p>Zadzwoń +44 20 7946 0958 dzisiaj</p>');
    expect(matches.map((m) => m.e164)).toContain('+442079460958');
  });

  it('NIE dotyka pól input/textarea (never break host)', () => {
    const { matches } = collect('<input value="+44 20 7946 0958"><textarea>+44 20 7946 0958</textarea>');
    expect(matches).toHaveLength(0);
  });

  it('NIE traktuje Salesforce record ID jako numeru', () => {
    const { matches } = collect('<div>Record: 0011x00000ABCDeAAF · 500170000012345</div>');
    expect(matches).toHaveLength(0);
  });

  it('NIE skanuje istniejących linków ani <code>', () => {
    const { matches } = collect(
      '<a href="tel:+442079460958">+44 20 7946 0958</a><code>+44 20 7946 0958</code>',
    );
    expect(matches).toHaveLength(0);
  });

  it('renderer nie zmienia widocznego tekstu strony', () => {
    document.body.innerHTML = '<p>Biuro: +44 20 7946 0958.</p>';
    const before = document.body.textContent;
    const scanner = new Scanner({ defaultRegion: 'GB', onMatches: () => {} });
    scanner.start(document.body);
    scanner.stop();
    expect(document.body.textContent).toBe(before);
  });
});
