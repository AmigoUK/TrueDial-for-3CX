// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from 'vitest';
import { isVisible } from '../lib/scanner/exclusions';
import { Scanner, type Match } from '../lib/scanner/scanner';

// `checkVisibility` carries the modern path, but the legacy branch still runs on
// any engine that lacks it. That branch is where detection died once already:
// `document.body.offsetParent` is null BY SPECIFICATION, so a scan rooted at
// <body> — which is every initial scan — judged the whole page invisible.
// happy-dom reports `undefined` rather than `null`, so the plain `=== null`
// comparison never reproduced it. These tests pin both paths.
function withoutCheckVisibility(run: () => void): void {
  const proto = Element.prototype as unknown as { checkVisibility?: unknown };
  const original = proto.checkVisibility;
  delete proto.checkVisibility;
  try {
    run();
  } finally {
    proto.checkVisibility = original;
  }
}

function pretendSpecCompliantOffsetParent(el: Element): void {
  Object.defineProperty(el, 'offsetParent', { value: null, configurable: true });
}

describe('isVisible', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('defers to checkVisibility when the engine provides it', () => {
    const el = document.createElement('div');
    document.body.append(el);
    Object.defineProperty(el, 'checkVisibility', { value: () => false, configurable: true });
    expect(isVisible(el)).toBe(false);
  });

  it('treats <body> as visible on the legacy path, where offsetParent is null by spec', () => {
    withoutCheckVisibility(() => {
      pretendSpecCompliantOffsetParent(document.body);
      expect(isVisible(document.body)).toBe(true);
    });
  });

  it('treats the root element as visible on the legacy path', () => {
    withoutCheckVisibility(() => {
      pretendSpecCompliantOffsetParent(document.documentElement);
      expect(isVisible(document.documentElement)).toBe(true);
    });
  });

  it('still scans from <body> on the legacy path (regression: zero matches in Chrome)', () => {
    withoutCheckVisibility(() => {
      document.body.innerHTML = '<p>Office: +44 20 7946 0958</p>';
      pretendSpecCompliantOffsetParent(document.body);
      const matches: Match[] = [];
      const scanner = new Scanner({ defaultRegion: 'GB', onMatches: (m) => matches.push(...m) });
      scanner.start(document.body);
      scanner.stop();
      expect(matches.map((m) => m.e164)).toContain('+442079460958');
    });
  });
});
