# Project state — TrueDial for 3CX

_Last updated: 2026-08-05 · Current version: **v1.0.0-rc.1** (prerelease)_

A running handoff of where the project stands and how to resume. Repo:
<https://github.com/AmigoUK/TrueDial-for-3CX>. The plan of record is
[`BACKLOG.md`](../BACKLOG.md) (team review of 2026-08-05, accepted and rejected
items with rationale).

## Snapshot

- **125+ unit/integration tests** (Vitest) green; `tsc --noEmit`, ESLint,
  Prettier and `wxt build` all clean; GitHub Actions CI runs the full pipeline
  on every push.
- Stack: **WXT + TypeScript + Preact** (Manifest V3), `libphonenumber-js/min`,
  `zod`, Vitest + happy-dom. Runtime uses the WXT `browser.*` API (not
  `chrome.*`).
- MVP feature-complete **plus** the 2026-08-05 hardening round: stability fixes
  (deep link with port, reload storm, per-frame badge, offscreen audio race,
  honest `tel:` outcome) and the least-privilege permission model
  (runtime-registered content script, no install-time host warning).
- Extension icons exist (`assets/icon.svg` → `public/icon/*.png`, `pnpm icons`).

## Architecture (where things live)

- `entrypoints/background.ts` — service worker: message router,
  `CallOrchestrator`, context menu, runtime content-script registration,
  per-tab/per-frame badge aggregation, diagnostics, audio trigger. All state in
  `browser.storage` (fully restartable).
- `entrypoints/content.ts` — content script (**runtime-registered**,
  `all_frames`): detection + presentation only; delegates dialling to the SW;
  reacts to config changes in place (no page reloads).
- `entrypoints/offscreen/` — WebAudio player for confirmation tones.
- `entrypoints/popup/`, `entrypoints/options/` — Preact UI (App, Wizard,
  Diagnostics).
- `lib/phone` — candidate regex + E.164 validation.
- `lib/scanner`, `lib/renderer` — DOM scan + non-destructive, reversible
  highlighting (`Renderer.teardown()`).
- `lib/call` — `CallOrchestrator`, strategies (`ccapi`, `deeplink`, `tel`),
  `TokenManager`, path ordering. `tel:` outcomes are flagged `unconfirmed`.
- `lib/permissions` — origin patterns + runtime registration logic.
- `lib/crm` — screen-pop templating + adapter interface.
- `lib/diagnostics` — ring buffer, redaction, report, health check.
- `lib/audio` — pure tone specs + offscreen management (send retry).
- `lib/onboarding` — wizard step machine.
- `lib/storage` — config, history, token cache, import/export, managed overlay,
  `detectionSettingsChanged`.
- `lib/i18n` — `t()` helper; catalogues in `public/_locales/<lang>/messages.json`
  (en/pl/de/fr/es, key parity enforced by tests).

## Conventions / decisions

- **All documentation, code comments, commits and backlog entries in British
  English.** Chat with the user stays Polish. App UI is localised (default
  locale `en`).
- Zero telemetry — permanently (team decision, see `BACKLOG.md`).
- Least privilege: no static host access; the content script is registered for
  granted origins only; the PBX origin is requested when the FQDN is saved.
- Footer credit only on the Options page (popup is space-constrained).
- SemVer + Keep-a-Changelog. Note: pre-1.0 tags referenced by `CHANGELOG.md`
  compare links have not been pushed.

## How to work here

```bash
pnpm install
pnpm dev            # HMR dev build → .output/chrome-mv3-dev
pnpm build          # production → .output/chrome-mv3
pnpm test           # unit tests
pnpm compile        # type check
pnpm lint           # ESLint + Prettier
pnpm zip            # store package
```

Load unpacked from `.output/chrome-mv3` at `chrome://extensions` (Developer
mode). Detection test page: `demo/numbers.html`.

## What remains

Work through `BACKLOG.md` in order. The release gate: **promotion rc → v1.0.0
requires the manual live-3CX V20 verification protocol** (deep link with/without
port, CCAPI token + `makecall`, health check) — the owner has a V20 instance
with admin access and the Call Control API available. Phase 2 candidates
(incoming-call awareness, native CRM adapters) were explicitly deferred with
rationale recorded in the backlog.
