# Changelog

All notable changes to **TrueDial for 3CX** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

> Note: the version compare links at the bottom of this file refer to git tags
> that have not yet been pushed to the repository; the pre-1.0 versions were
> cut in a single development session.

### Added
- The popup names its own state and always offers a way out: the status dot now
  carries a "Ready" / "Not set up" label rather than meaning something by colour
  alone, and a settings button sits beside it — previously settings were
  reachable from the popup only while the extension was unconfigured, leaving
  everyone else to right-click the toolbar icon.
- Least-privilege permission model: the detection content script is registered
  at **runtime** for exactly the origins the user has granted (no install-time
  "read data on all websites" warning). The PBX origin is requested separately
  when the FQDN is saved; all-sites detection remains an explicit opt-in.
- Per-tab badge now sums detection counts across frames (iframes no longer
  overwrite the page total); counts are cleared on navigation and tab close.
- `attempted` call-history status: a `tel:` hand-off can never be confirmed, so
  it is no longer recorded (or announced) as `placed`. The popup marks such
  entries.
- Extension icons (16/32/48/128) generated from `assets/icon.svg`
  (`pnpm icons`), alongside the store's 440×280 promo tile from
  `assets/promo-tile.svg`.
- Localised store listing copy for Polish, German, French and Spanish
  (`docs/store/LISTING.<locale>.md`), matching the locales the package ships.
- `pnpm store:check` — a pre-submission check on the built package: version
  drift against `package.json`, icon dimensions, locale completeness,
  unexpected permissions, hoisted `host_permissions`, statically declared
  content scripts and stray source maps. It also warns that a pre-release
  suffix cannot survive into the manifest, so uploading `1.0.0-rc.1` publishes
  — and burns — `1.0.0`.
- Engineering hygiene: GitHub Actions CI (lint, type-check, tests, build,
  package, smoke E2E), ESLint (flat config) + Prettier, and a project backlog
  (`BACKLOG.md`).
- Honest call-path diagnostics: the popup shows the last call's winning path
  and the full per-strategy trail (e.g. `ccapi ✗ (makecall 401) → deeplink ✓`),
  plus the connectivity health check.
- CRM screen-pop presets for HubSpot, Zoho CRM and Salesforce (URL templates,
  user-editable, no OAuth).
- Playwright smoke E2E loading the built extension into real Chromium:
  detection corpus, never-break-the-page assertions, click-to-history flow,
  options/popup rendering (`pnpm e2e`).
- Chrome Web Store pack: `PRIVACY.md`, listing copy and permission
  justifications, submission checklist, generated 1280×800 screenshots
  (`pnpm store:screenshots`).
- Live 3CX V20 verification protocol (`docs/VERIFICATION.md`) gating the
  1.0.0 release.

### Fixed
- Settings styling gaps that made the page look broken: the Client Secret field
  rendered as a bright white box (the input rule matched `type='text'` only, so
  `password` fell through to the browser default), the volume slider kept a
  light track on the dark card, unchecked boxes rendered light-on-dark, and a
  button standing between two fields sat flush against the label below it,
  reading as its caption. The input rule now matches by exclusion so future
  field types are covered, and the page declares `color-scheme: dark`.
- **The hover affordance shifted the host page's text.** The handset lived in an
  in-flow `::after`, so every line containing a number carried a phantom gap
  whether or not the icon was visible — 19 px on the demo corpus, in direct
  contradiction of the extension's one promise. It is now absolutely positioned
  and takes no layout space in either state, pinned by an E2E assertion that
  measures a character's position with and without the extension's stylesheet.
- Web client deep link with a port-qualified FQDN (e.g. `pbx.example.co.uk:5001`)
  no longer fails the existing-tab lookup — match patterns cannot carry ports,
  so tabs are matched by URL parsing instead.
- Saving settings no longer reloads every open tab: the content script tears
  down its highlights and re-scans in place, and only when a detection-relevant
  setting actually changed. "Test sound" no longer persists configuration.
- Detection counter no longer double-counts incremental mutation scans.
- First confirmation tone is no longer lost to the offscreen-document startup
  race (short send retry).
- **Detection worked in unit tests but not in a real browser:**
  `document.body.offsetParent` is null by definition in Chrome, so the
  visibility check silently excluded the entire page from the initial scan.
  `isVisible` now prefers `Element.checkVisibility()`. Caught by the new
  smoke E2E on its first run. The legacy branch, still taken by any engine
  without `checkVisibility`, carried the same fault: `<body>` and the root
  element are now judged by computed display there too. `tests/visibility.test.ts`
  pins both paths — happy-dom reports `offsetParent` as `undefined`, so the
  regression only reproduces in unit tests once that is forced to `null`.

### Changed
- Call history reads like a phone list instead of a database dump: numbers are
  shown in international form (`+44 20 7946 0958`, the raw E.164 kept in the
  title), times lose their seconds, and anything older than today shows a date
  so last week's call cannot be mistaken for this morning's. The connectivity
  test is styled as an action rather than sharing the history links' appearance.
- The handset affordance is drawn from an SVG mask tinted with `currentColor`
  instead of the U+260E dingbat, which rendered as a mono glyph on one system
  and a colour emoji on the next. Aggressive mode no longer shows it
  permanently — out-of-flow positioning means a persistent icon would overlap
  the following character, and the solid underline plus accent colour already
  carry the stronger affordance.
- Completed the British English convention: options page title, UI
  placeholders, the demo/test page and the remaining Polish test descriptions
  are now in English. Placeholders use `pbx.example.co.uk`.
- README rewritten to match the actual feature set (three call paths, runtime
  permission model, CRM screen-pop, privacy stance).

## [1.0.0-rc.1] — 2026-07-27

Release candidate for 1.0.0. Feature-complete for the MVP scope; promotion to
1.0.0 awaits real-browser E2E and live-3CX validation (DoD §14).

### Added
- Full internationalisation (`_locales`): the UI is now translatable, shipping
  complete **English (default)**, **Polish**, **German**, **French** and
  **Spanish** catalogues. Missing keys fall back to English.
- Manifest name and description are localised via `__MSG__`.

### Changed
- All in-app UI strings now resolve through the i18n layer (`t()`); `_locales`
  moved under `public/` so they are bundled into the build.

## [0.9.0] — 2026-07-27

### Added
- First-run onboarding wizard (§10): a guided four-step setup (FQDN → call path
  → region → auto-detection permission) shown automatically when unconfigured,
  and available any time via a "Setup wizard" button.

## [0.8.0] — 2026-07-27

### Added
- Confirmation sound when a call is placed, synthesised with WebAudio in an
  offscreen document (no bundled audio assets).
- Sound settings on the Settings page: enable/disable, tone choice and a
  **volume slider** (default deliberately quiet) — directly addressing the
  "damaged my hearing" complaint — plus a "Test sound" button.

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

[Unreleased]: https://github.com/AmigoUK/TrueDial-for-3CX/compare/v1.0.0-rc.1...HEAD
[1.0.0-rc.1]: https://github.com/AmigoUK/TrueDial-for-3CX/compare/v0.9.0...v1.0.0-rc.1
[0.9.0]: https://github.com/AmigoUK/TrueDial-for-3CX/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/AmigoUK/TrueDial-for-3CX/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/AmigoUK/TrueDial-for-3CX/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/AmigoUK/TrueDial-for-3CX/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/AmigoUK/TrueDial-for-3CX/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/AmigoUK/TrueDial-for-3CX/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/AmigoUK/TrueDial-for-3CX/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/AmigoUK/TrueDial-for-3CX/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/AmigoUK/TrueDial-for-3CX/compare/v0.0.1...v0.1.0
[0.0.1]: https://github.com/AmigoUK/TrueDial-for-3CX/releases/tag/v0.0.1
