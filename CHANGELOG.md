# Changelog

All notable changes to **TrueDial for 3CX** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

_Nothing yet._

## [0.1.0] — 2026-07-27

### Added
- `tel:` call strategy (routes to the registered desktop application).
- Preferred call-path selection in Settings: automatic (deep link → `tel:`),
  deep link only, or `tel:` only.
- Real fallback in `CallOrchestrator`: when an available path fails (returns
  `ok:false` or throws), it falls through to the next — no silent failures.

### Changed
- All documentation and code comments switched to British English.

## [0.0.1] — 2026-07-27

First vertical slice (the "walking skeleton"): number detection → 3CX web client
deep link, with no dependency on the Call Control API. Delivers the product's
guiding principle: **never break the host page**.

### Added
- WXT + TypeScript + Preact scaffold (Manifest V3), file-based entrypoints.
- Two-layer number detection: candidate regex → `libphonenumber-js` validation →
  E.164 normalisation, with structural exclusions and an anti-record-ID
  heuristic.
- Content script (`all_frames`) with a scanner (`MutationObserver` + debounce +
  `requestIdleCallback`, 200-highlight cap) and a subtle-mode renderer (dotted
  underline + hover icon, no `innerHTML`, no wrapping in `<a>`).
- Call placement via `CallOrchestrator` with a single strategy: the **3CX web
  client deep link** (`/webclient/#/call?phone=`), focusing an existing tab.
- "Call via 3CX" context-menu entry on selected text.
- Popup: health status, a manual dialler with live validation, a per-site toggle
  and a local call history (30-day retention).
- Options page: FQDN, default region (picker), detection mode, allowlist, an
  optional `<all_urls>` grant and the credit footer.
- Typed messaging (`zod` validation + a `sender.id` guard in the service worker).
- 35 tests (Vitest): phone corpus, false-positive corpus, messaging,
  orchestrator, and a DOM-level scanner integration (happy-dom).

[Unreleased]: https://github.com/AmigoUK/TrueDial-for-3CX/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/AmigoUK/TrueDial-for-3CX/compare/v0.0.1...v0.1.0
[0.0.1]: https://github.com/AmigoUK/TrueDial-for-3CX/releases/tag/v0.0.1
