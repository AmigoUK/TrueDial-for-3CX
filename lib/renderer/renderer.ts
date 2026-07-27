// The subtle-mode renderer. It wraps a matched fragment in a lightweight <span>
// WITHOUT changing the text and without wrapping in <a> (no navigation hijack).
// The DOM change is minimal and reversible; we use Range.surroundContents
// (which splits the text node), NEVER innerHTML. Clicks are handled by
// delegation on document.

import type { Match } from '../scanner/scanner';

const STYLE_ID = 'truedial-style';
const ATTR = 'data-truedial';

const CSS = `
[${ATTR}]{
  cursor:pointer;
  text-decoration:underline dotted currentColor;
  text-underline-offset:2px;
  border-radius:2px;
}
[${ATTR}]:hover{ background:rgba(37,99,235,.12); }
[${ATTR}]::after{
  content:"\\260E";
  font-size:.85em;
  margin-left:.25em;
  opacity:0;
  transition:opacity .12s;
}
[${ATTR}]:hover::after{ opacity:.85; }
`;

export class Renderer {
  private clickBound = false;

  constructor(private readonly onCall: (e164: string) => void) {}

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
      (byNode.get(m.node) ?? byNode.set(m.node, []).get(m.node)!).push(m);
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
}
