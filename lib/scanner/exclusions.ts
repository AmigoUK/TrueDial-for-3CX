// Structural exclusions applied BEFORE the regex (we reject cheaply).
// Goal: never touch editable fields, invisible elements, code, etc. — the
// implementation of the guiding principle, "never break the host page".

// Tags whose contents we do not scan at all.
const SKIP_TAGS = new Set([
  'INPUT',
  'TEXTAREA',
  'SELECT',
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'CODE',
  'PRE',
  'KBD',
  'SAMP',
  'A', // leave existing links (including tel:) untouched
]);

/** Whether an element (or an ancestor) disqualifies its text from detection. */
export function isExcludedElement(el: Element | null): boolean {
  for (let node: Element | null = el; node; node = node.parentElement) {
    if (SKIP_TAGS.has(node.tagName)) return true;
    if ((node as HTMLElement).isContentEditable) return true;
    if (node.getAttribute('aria-hidden') === 'true') return true;
    // Our own renderer artefacts — do not re-scan them.
    if (node.hasAttribute('data-truedial')) return true;
  }
  return false;
}

/** Whether an element is genuinely visible. Note: these checks DO force
 *  style/layout; acceptable because this runs once per scanned subtree root,
 *  not per text node. */
export function isVisible(el: Element | null): boolean {
  if (!el) return false;
  const htmlEl = el as HTMLElement;
  // Chrome 105+: authoritative, and correct for the root elements —
  // document.body.offsetParent is null BY DEFINITION, so the legacy check
  // below silently excluded the entire page on the initial scan (caught by
  // the smoke E2E; unit DOM environments do not reproduce it).
  if (typeof htmlEl.checkVisibility === 'function') return htmlEl.checkVisibility();
  // Legacy path, for engines without checkVisibility: <body> and the root
  // element must be judged by computed display, because offsetParent is null
  // for them by definition — the very trap described above.
  const doc = htmlEl.ownerDocument;
  if (htmlEl === doc.body || htmlEl === doc.documentElement) {
    return getComputedStyle(htmlEl).display !== 'none';
  }
  // Fallback: offsetParent === null → display:none or detached (except fixed).
  if (htmlEl.offsetParent === null && getComputedStyle(htmlEl).position !== 'fixed') {
    return false;
  }
  return true;
}
