// Wykluczenia strukturalne stosowane PRZED regexem (tanio odrzucamy).
// Cel: nie dotykać pól edycyjnych, elementów niewidocznych, kodu itp. —
// realizacja naczelnej zasady „never break the host page".

// Tagi, których wnętrza w ogóle nie skanujemy.
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
  'A', // istniejące linki zostawiamy nietknięte (w tym tel:)
]);

/** Czy element (lub jego przodek) dyskwalifikuje tekst z detekcji. */
export function isExcludedElement(el: Element | null): boolean {
  for (let node: Element | null = el; node; node = node.parentElement) {
    if (SKIP_TAGS.has(node.tagName)) return true;
    if ((node as HTMLElement).isContentEditable) return true;
    if (node.getAttribute('aria-hidden') === 'true') return true;
    // Nasze własne artefakty renderera — nie skanuj ponownie.
    if (node.hasAttribute('data-truedial')) return true;
  }
  return false;
}

/** Czy element jest realnie widoczny (tani sygnał, bez wymuszania layoutu). */
export function isVisible(el: Element | null): boolean {
  if (!el) return false;
  const htmlEl = el as HTMLElement;
  // offsetParent === null → display:none lub odłączony (poza position:fixed).
  if (htmlEl.offsetParent === null && getComputedStyle(htmlEl).position !== 'fixed') {
    return false;
  }
  return true;
}
