// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Renderer } from '../lib/renderer/renderer';
import type { Match } from '../lib/scanner/scanner';

function matchesIn(node: Text, raw: string, e164: string): Match[] {
  const start = node.data.indexOf(raw);
  return [{ node, start, end: start + raw.length, e164 }];
}

describe('Renderer', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.getElementById('truedial-style')?.remove();
  });

  it('wraps a match in a focusable span without changing the visible text', () => {
    document.body.innerHTML = '<p>Office: +44 20 7946 0958.</p>';
    const node = document.querySelector('p')!.firstChild as Text;
    const before = document.body.textContent;

    new Renderer(vi.fn()).apply(matchesIn(node, '+44 20 7946 0958', '+442079460958'));

    const span = document.querySelector('[data-truedial]');
    expect(span?.getAttribute('data-e164')).toBe('+442079460958');
    expect(span?.getAttribute('role')).toBe('button');
    expect(document.body.textContent).toBe(before);
  });

  it('teardown restores the DOM and removes the injected style', () => {
    document.body.innerHTML = '<p>Office: +44 20 7946 0958.</p>';
    const node = document.querySelector('p')!.firstChild as Text;
    const before = document.body.textContent;

    const renderer = new Renderer(vi.fn());
    renderer.apply(matchesIn(node, '+44 20 7946 0958', '+442079460958'));
    expect(document.querySelector('[data-truedial]')).not.toBeNull();

    renderer.teardown();

    expect(document.querySelector('[data-truedial]')).toBeNull();
    expect(document.getElementById('truedial-style')).toBeNull();
    expect(document.body.textContent).toBe(before);
    // Text nodes are merged back, so a re-scan sees the original text shape.
    expect(document.querySelector('p')!.childNodes).toHaveLength(1);
  });

  it('a click on the highlight triggers the call handler with the E.164 number', () => {
    document.body.innerHTML = '<p>Office: +44 20 7946 0958.</p>';
    const node = document.querySelector('p')!.firstChild as Text;
    const onCall = vi.fn();

    new Renderer(onCall).apply(matchesIn(node, '+44 20 7946 0958', '+442079460958'));
    (document.querySelector('[data-truedial]') as HTMLElement).click();

    expect(onCall).toHaveBeenCalledWith('+442079460958');
  });
});
