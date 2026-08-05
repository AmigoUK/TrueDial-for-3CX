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

/** Whether an element is genuinely visible. Note: offsetParent/getComputedStyle
 *  DO force style/layout; acceptable because this runs once per scanned subtree
 *  root, not per text node. */
export function isVisible(el: Element | null): boolean {
  if (!el) return false;
  const htmlEl = el as HTMLElement;
  // offsetParent === null → display:none or detached (except position:fixed).
  if (htmlEl.offsetParent === null && getComputedStyle(htmlEl).position !== 'fixed') {
    return false;
  }
  return true;
}
