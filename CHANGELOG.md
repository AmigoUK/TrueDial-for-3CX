# Changelog

All notable changes to **TrueDial for 3CX** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

_Nothing yet._

## [0.7.0] — 2026-07-27

### Added
- Aggressive detection mode (opt-in): prominent, link-like clickable numbers
  (still no `<a>`, no navigation hijack).
- Detected-number counter on the toolbar badge per tab ("200+" above the cap).

## [0.6.0] — 2026-07-27

### Added
- Import/export of the configuration as JSON on the Settings page. Exports omit
  the client secret by default.
- Enterprise policy support: `chrome.storage.managed` is validated and overlaid
  on top of the user's config (policy wins), for GPO/Intune deployments.

## [0.5.0] — 2026-07-27

### Added
- Connectivity health check (§6.3) on the Settings diagnostics panel: PBX
  reachability, API token validity, the configured call paths and the path that
  will actually be used.
- Explicit path recommendation via `recommendedPath` — the first configured path
  matching the user's preference order (no silent degradation).

## [0.4.0] — 2026-07-27

### Added
- **Call Control API path** (§6.2): places calls via
  `POST /callcontrol/{ext}/devices/{deviceId}/makecall` with a Bearer token —
  the preferred, richest path.
- **TokenManager**: OAuth client-credentials against `/connect/token`, with a
  cached token, proactive refresh before expiry and a lazy refresh-and-retry on
  a 401.
- Settings: Call Control API section (Client ID/Secret, extension, device ID)
  and a "Call Control API only" preferred-path option.

### Changed
- 'auto' path order is now Call Control API → deep link → `tel:`.

## [0.3.0] — 2026-07-27

### Added
- Screen-pop URL (§3.F5): a configurable template opened on an outgoing call,
  with `{number}` (E.164) and `{national}` placeholders. Empty template =
  disabled.
- CRM adapter interface (§9) with `GenericUrlAdapter` as the proof that the
  interface works; native CRM adapters follow in phase 2.
- "Screen-pop (CRM)" section on the Settings page.

## [0.2.0] — 2026-07-27

### Added
- Diagnostics panel on the Settings page: an always-on local ring buffer of the
  last 50 events (lifecycle, calls, errors).
- "Copy diagnostic report" — a paste-ready, anonymised report (versions,
  settings and events, with phone numbers and URLs redacted) for IT tickets.
- The service worker now records every call attempt and its outcome, plus
  install/update lifecycle events.

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

[Unreleased]: https://github.com/AmigoUK/TrueDial-for-3CX/compare/v0.7.0...HEAD
[0.7.0]: https://github.com/AmigoUK/TrueDial-for-3CX/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/AmigoUK/TrueDial-for-3CX/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/AmigoUK/TrueDial-for-3CX/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/AmigoUK/TrueDial-for-3CX/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/AmigoUK/TrueDial-for-3CX/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/AmigoUK/TrueDial-for-3CX/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/AmigoUK/TrueDial-for-3CX/compare/v0.0.1...v0.1.0
[0.0.1]: https://github.com/AmigoUK/TrueDial-for-3CX/releases/tag/v0.0.1
