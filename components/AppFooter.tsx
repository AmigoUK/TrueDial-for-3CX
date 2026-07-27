// Credit footer — only on the full-screen Options page (the popup is skipped,
// being space-constrained). Small, muted, single line, "·" separators.
const REPO = 'https://github.com/AmigoUK/TrueDial-for-3CX';

export function AppFooter() {
  return (
    <footer class="app-footer">
      <a href="mailto:dev@attv.uk">dev@attv.uk</a>
      <span class="sep">·</span>
      <span>Project &amp; Development: Tomasz &lsquo;Amigo&rsquo; Lewandowski</span>
      <span class="sep">·</span>
      <a href="https://www.attv.uk" target="_blank" rel="noreferrer">www.attv.uk</a>
      <span class="sep">·</span>
      <a href={REPO} target="_blank" rel="noreferrer">GitHub</a>
    </footer>
  );
}
