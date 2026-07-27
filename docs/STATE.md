# Project state — TrueDial for 3CX

_Last updated: 2026-07-27 · Current version: **v1.0.0-rc.1** (prerelease)_

A running handoff of where the project stands and how to resume. Repo:
<https://github.com/AmigoUK/TrueDial-for-3CX>.

## Snapshot

- **11 releases shipped** (v0.0.1 → v1.0.0-rc.1), each tagged with a matching
  GitHub Release; `main` is in sync with `origin`.
- **100 unit/integration tests** (Vitest) green; `tsc --noEmit` clean;
  `wxt build` clean.
- Stack: **WXT + TypeScript + Preact** (Manifest V3), `libphonenumber-js/min`,
  `zod`, Vitest + happy-dom. Runtime uses the WXT `browser.*` API (not `chrome.*`).
- MVP §3 (F1–F7) is **feature-complete**, plus roadmap items (enterprise policy,
  audio, aggressive mode, onboarding wizard, full i18n).

## What is built (by release)

| Version | Summary |
|---|---|
| v0.0.1 | Walking skeleton: detection + web-client deep link + popup + options + context menu |
| v0.1.0 | `tel:` strategy + preferred-path selection + real orchestrator fallback |
| v0.2.0 | Diagnostics ring buffer + anonymised "copy report" |
| v0.3.0 | Screen-pop URL + `CrmAdapter` interface + `GenericUrlAdapter` |
| v0.4.0 | **Call Control API** path + `TokenManager` (OAuth, 401 refresh-retry) |
| v0.5.0 | Health check (reachability, token, configured/recommended path) |
| v0.6.0 | Config import/export (JSON) + `storage.managed` enterprise overlay |
| v0.7.0 | Aggressive detection mode + detected-number badge counter |
| v0.8.0 | WebAudio confirmation tone (offscreen) + volume slider |
| v0.9.0 | First-run onboarding wizard |
| v1.0.0-rc.1 | Full i18n (`public/_locales` en/pl/de/fr/es), manifest `__MSG__` |

## Architecture (where things live)

- `entrypoints/background.ts` — service worker: message router, `CallOrchestrator`,
  context menu, badge, diagnostics, audio trigger. All state in `browser.storage`
  (fully restartable).
- `entrypoints/content.ts` — content script (`all_frames`): detection +
  presentation only; delegates dialling to the SW.
- `entrypoints/offscreen/` — WebAudio player for confirmation tones.
- `entrypoints/popup/`, `entrypoints/options/` — Preact UI (App, Wizard, Diagnostics).
- `lib/phone` — candidate regex + E.164 validation.
- `lib/scanner`, `lib/renderer` — DOM scan + non-destructive highlighting.
- `lib/call` — `CallOrchestrator`, strategies (`ccapi`, `deeplink`, `tel`),
  `TokenManager`, path ordering.
- `lib/crm` — screen-pop templating + adapter interface.
- `lib/diagnostics` — ring buffer, redaction, report, health check.
- `lib/audio` — pure tone specs + offscreen management.
- `lib/onboarding` — wizard step machine.
- `lib/storage` — config, history, token cache, import/export, managed overlay.
- `lib/i18n` — `t()` helper; catalogues in `public/_locales/<lang>/messages.json`.

## Conventions / decisions

- **All documentation and code comments in British English.** Chat with the user
  stays Polish. App UI is localised (default locale `en`).
- Footer credit only on the Options page (popup is space-constrained).
- Full release management: SemVer, Keep-a-Changelog `CHANGELOG.md`, git tags,
  GitHub Releases (one per meaningful change).
- Permissions: `optional_host_permissions: ["<all_urls>"]` + allowlist mode.

## How to work here

```bash
pnpm install
pnpm dev            # HMR dev build → .output/chrome-mv3-dev
pnpm build         # production → .output/chrome-mv3
./node_modules/.bin/vitest run     # tests (avoid `pnpm test`: its predep-check runs wxt prepare)
./node_modules/.bin/tsc --noEmit   # type check
```

Load unpacked from `.output/chrome-mv3` at `chrome://extensions` (Developer mode).
Detection test page: `demo/numbers.html`.

Release step for a new slice: bump `package.json` version → move `[Unreleased]`
into a dated `CHANGELOG.md` section → commit `feat(...)`/`chore(release): vX.Y.Z`
→ `git tag -a vX.Y.Z` → push main + tag → `gh release create vX.Y.Z`.

## What remains (needs the user's environment — not doable headless)

1. **Promote rc → v1.0.0** = Definition of Done §14: real Chrome E2E (Salesforce
   Lightning record-ID safety, service-worker restart mid-flow, click → captured
   `makecall`) + smoke test against a live 3CX V20 instance.
2. **Phase 2**: native CRM adapters (OAuth apps for HubSpot/Pipedrive/Zoho/
   Salesforce), incoming-call awareness (offscreen WebSocket/SSE + live PBX).

## Resume next session

Pick up with option **B** (load the build, run E2E together, fix via the
code→test→commit→push loop, promote to v1.0.0) or **C** (Phase 2 — needs CRM
credentials / a live PBX). Planning doc:
`/root/.claude/plans/nowy-projekt-wtyczka-do-cached-bentley.md`.
