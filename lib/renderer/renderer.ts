// The subtle-mode renderer. It wraps a matched fragment in a lightweight <span>
// WITHOUT changing the text and without wrapping in <a> (no navigation hijack).
// The DOM change is minimal and reversible; we use Range.surroundContents
// (which splits the text node), NEVER innerHTML. Clicks are handled by
// delegation on document.

import type { Match } from '../scanner/scanner';

const STYLE_ID = 'truedial-style';
const ATTR = 'data-truedial';

// Subtle (default): dotted underline, handset on hover only. Aggressive (opt-in
// per site): solid accent underline and accent colour — a stronger, link-like
// affordance, but still no <a> and no navigation hijack.
//
// The handset is drawn by an absolutely positioned pseudo-element carrying an
// SVG mask. Two rules follow from "never break the host page":
//   * out of flow, so it reserves NO space — an in-flow pseudo-element shifts
//     every line containing a number, whether or not the icon is visible;
//   * masked rather than glyphed, so `currentColor` gives it the page's own
//     text colour and it renders identically everywhere. The old U+260E
//     dingbat was a lottery: a mono glyph on one system, colour emoji on
//     another.
// Being out of flow, it can overlap the character that follows while visible,
// which is why it appears on hover only — in aggressive mode too, where the
// solid underline and accent colour already carry the affordance.
const HANDSET_MASK = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z'/%3E%3C/svg%3E")`;

const CSS = `
[${ATTR}]{
  cursor:pointer;
  position:relative;
  text-decoration:underline dotted currentColor;
  text-underline-offset:2px;
  border-radius:2px;
}
[${ATTR}]:hover{ background:rgba(37,99,235,.12); }
[${ATTR}]::after{
  content:"";
  position:absolute;
  left:100%;
  top:50%;
  transform:translateY(-50%);
  margin-left:.15em;
  width:.85em;
  height:.85em;
  background-color:currentColor;
  -webkit-mask-image:${HANDSET_MASK};
  mask-image:${HANDSET_MASK};
  -webkit-mask-repeat:no-repeat;
  mask-repeat:no-repeat;
  -webkit-mask-size:contain;
  mask-size:contain;
  opacity:0;
  transition:opacity .12s;
  pointer-events:none;
}
[${ATTR}]:hover::after{ opacity:.85; }
[${ATTR}][data-aggressive]{
  text-decoration:underline solid #2563eb;
  color:#2563eb;
}
`;

export type RenderMode = 'subtle' | 'aggressive';

export class Renderer {
  private clickBound = false;

  constructor(
    private readonly onCall: (e164: string) => void,
    private readonly mode: RenderMode = 'subtle',
  ) {}

  private ensureStyle(): void {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = CSS;
    (document.head ?? document.documentElement).appendChild(style);
  }

  private ensureClickHandler(): void {
    if (this.clickBound) return;
    this.clickBound = true;
    document.addEventListener(
      'click',
      (ev) => {
        const target = (ev.target as Element | null)?.closest?.(`[${ATTR}]`);
        const e164 = target?.getAttribute('data-e164');
        if (!e164) return;
        ev.preventDefault();
        ev.stopPropagation();
        this.onCall(e164);
      },
      true,
    );
  }

  /** Applies highlights. Within a single text node we go last-to-first so that
   *  earlier matches' offsets stay valid after each split. */
  apply(matches: Match[]): void {
    if (!matches.length) return;
    this.ensureStyle();
    this.ensureClickHandler();

    const byNode = new Map<Text, Match[]>();
    for (const m of matches) {
      const list = byNode.get(m.node) ?? [];
      list.push(m);
      byNode.set(m.node, list);
    }
    for (const [node, list] of byNode) {
      list.sort((a, b) => b.start - a.start);
      for (const m of list) {
        if (!node.parentNode) continue;
        try {
          const range = document.createRange();
          range.setStart(node, m.start);
          range.setEnd(node, m.end);
          const span = document.createElement('span');
          span.setAttribute(ATTR, '');
          if (this.mode === 'aggressive') span.setAttribute('data-aggressive', '');
          span.setAttribute('data-e164', m.e164);
          span.setAttribute('role', 'button');
          span.setAttribute('tabindex', '0');
          span.setAttribute('aria-label', `Call ${m.e164} via 3CX`);
          span.setAttribute('title', `Call ${m.e164} via 3CX`);
          range.surroundContents(span);
        } catch {
          // The range may cross element boundaries — skip this fragment quietly
          // (never break the host page).
        }
      }
    }
  }

  /** Reverses every highlight: unwraps our spans back into plain text and
   *  removes the injected style. Leaves the host DOM as it was found (modulo
   *  text-node splits, which are invisible to the page). */
  teardown(): void {
    for (const span of [...document.querySelectorAll(`[${ATTR}]`)]) {
      const parent = span.parentNode;
      if (!parent) continue;
      while (span.firstChild) parent.insertBefore(span.firstChild, span);
      parent.removeChild(span);
      parent.normalize();
    }
    document.getElementById(STYLE_ID)?.remove();
  }
}
