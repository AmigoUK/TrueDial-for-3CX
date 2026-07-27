// Scanner: znajduje w drzewie DOM prawdziwe numery telefonów i raportuje je
// jako pozycje (text node + offsety) do renderera. Nie modyfikuje DOM.
//
// Wydajność (§7.2): TreeWalker po text nodes, przyrostowe skanowanie mutacji
// z debounce 250 ms, requestIdleCallback dla dużych batchy, twardy limit
// podświetleń na stronę. Zero długich tasków > 50 ms na stronach referencyjnych.

import type { CountryCode } from 'libphonenumber-js/min';
import { extractCandidates } from '../phone/candidates';
import { validateToE164 } from '../phone/validate';
import { isExcludedElement, isVisible } from './exclusions';

export interface Match {
  node: Text;
  start: number;
  end: number;
  e164: string;
}

const MAX_MATCHES = 200; // §7.2: powyżej — tylko licznik
const DEBOUNCE_MS = 250;

export interface ScannerOptions {
  defaultRegion: CountryCode;
  onMatches: (matches: Match[]) => void;
  /** Wywoływane, gdy przekroczono limit — do pokazania licznika w popupie. */
  onOverflow?: (total: number) => void;
}

export class Scanner {
  private observer: MutationObserver | null = null;
  private pending = new Set<Node>();
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private matchCount = 0;

  constructor(private readonly opts: ScannerOptions) {}

  /** Pierwsze pełne skanowanie + start obserwatora mutacji. */
  start(root: ParentNode = document.body): void {
    this.scanSubtree(root);
    this.observer = new MutationObserver((records) => this.onMutations(records));
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  stop(): void {
    this.observer?.disconnect();
    this.observer = null;
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
  }

  private onMutations(records: MutationRecord[]): void {
    for (const r of records) {
      if (r.type === 'characterData' && r.target.parentElement) {
        this.pending.add(r.target.parentElement);
      }
      for (const added of r.addedNodes) {
        if (added.nodeType === Node.ELEMENT_NODE || added.nodeType === Node.TEXT_NODE) {
          this.pending.add(added);
        }
      }
    }
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.flush(), DEBOUNCE_MS);
  }

  private flush(): void {
    const nodes = [...this.pending];
    this.pending.clear();
    const run = () => nodes.forEach((n) => this.scanSubtree(n as ParentNode));
    if ('requestIdleCallback' in window) {
      (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(run);
    } else {
      run();
    }
  }

  private scanSubtree(root: Node): void {
    if (this.matchCount >= MAX_MATCHES) return;
    // Text node dostarczony wprost.
    if (root.nodeType === Node.TEXT_NODE) {
      this.scanTextNode(root as Text);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
      return;
    }
    const el = root as Element;
    if (isExcludedElement(el) || !isVisible(el)) return;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        const parent = (node as Text).parentElement;
        if (!parent || isExcludedElement(parent)) return NodeFilter.FILTER_REJECT;
        if (!(node as Text).data.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    const textNodes: Text[] = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) textNodes.push(n as Text);
    textNodes.forEach((t) => this.scanTextNode(t));
  }

  private scanTextNode(node: Text): void {
    if (this.matchCount >= MAX_MATCHES) {
      this.opts.onOverflow?.(this.matchCount);
      return;
    }
    const parent = node.parentElement;
    if (!parent || isExcludedElement(parent)) return;

    const text = node.data;
    const matches: Match[] = [];
    for (const cand of extractCandidates(text)) {
      const e164 = validateToE164(cand.raw, this.opts.defaultRegion);
      if (!e164) continue;
      matches.push({ node, start: cand.index, end: cand.index + cand.raw.length, e164 });
      if (++this.matchCount >= MAX_MATCHES) {
        this.opts.onOverflow?.(this.matchCount);
        break;
      }
    }
    if (matches.length) this.opts.onMatches(matches);
  }
}
