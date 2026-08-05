# TrueDial for 3CX — Backlog

Product of a team review (senior MV3 developer, 3CX/CTI specialist, UK-SMB product manager, cost/delivery) held on 2026-08-05. The competitive thesis: TrueDial wins against the official 3CX Click2Call extension and its peers on **trust and detection quality** — never break the host page, no false highlights, least-privilege permissions, zero telemetry, UK-first defaults — not on feature count.

Statuses: `todo` → `in progress` → `done`. Estimates are person-days.

## Accepted

| # | Item | Priority | Estimate | Status |
|---|------|----------|----------|--------|
| 1 | Stability bug fixes: deep link with port, settings-save reload storm, per-frame badge overwrite, detection double-counting, offscreen audio race, honest `tel:` outcome, minor dead-code cleanups | P1 | 2–3 d | todo |
| 2 | Least-privilege permission model: runtime-registered content scripts, PBX-origin grant separate from optional all-sites grant, no install-time "read all sites" warning | P1 | 2–3 d | todo |
| 3 | Engineering hygiene: GitHub Actions CI (typecheck, tests, build), ESLint + Prettier, extension icons, README/CHANGELOG refresh, complete the British English convention (UI strings, demo page, test descriptions) | P1 | 1–2 d | todo |
| 4 | Honest path diagnostics: surface which call strategy succeeded or failed (and why) in the popup; health check accessible from the popup | P2 | 1–2 d | todo |
| 5 | CRM screen-pop presets for HubSpot, Zoho CRM and Salesforce (URL templates, no OAuth) | P2 | 1–2 d | todo |
| 6 | Smoke E2E: Playwright loads the built extension, asserts detection on the demo corpus, no false highlights, and an unmodified host DOM | P2 | 2 d | todo |
| 7 | Chrome Web Store pack: privacy policy, listing copy, permission justifications, screenshots, submission checklist | P3 | 1–2 d | todo |
| 8 | Live 3CX V20 verification protocol (manual test script; release 1.0.0 is gated on it) | P1 gate | 0.5 d | todo |

## Rejected (with rationale)

| Item | Rationale |
|------|-----------|
| Incoming-call awareness (CTI screen-pop on inbound ring) | 8–15 d effort; requires a WebSocket held from an MV3 service worker that Chrome suspends; gated on a Call Control API licence and admin configuration, which excludes much of the SMB target market. Deferred to Phase 2, revisited only after the outbound paths are verified against a live PBX. |
| Full CRM adapters (OAuth, contact match, call logging) | Each CRM is a separate OAuth application, a separate review surface and perpetual maintenance. URL-template presets deliver most of the user value at a fraction of the cost. |
| Firefox port | The target market (UK SMBs on 3CX) sits on Chrome/Edge; a second browser doubles the test matrix without adding reach. |
| Opt-in telemetry | Zero telemetry is a marketable differentiator ("no data leaves your browser") and simplifies Chrome Web Store review. Local diagnostics with manual copy-report already cover supportability. |

## Decisions of record

- Live test environment: 3CX V20 with administrator access and the Call Control API available — all three call paths can be manually verified before 1.0.0.
- CRM presets target HubSpot, Zoho CRM and Salesforce.
- Telemetry: none, permanently; diagnostics stay local.
- Chrome Web Store submission is prepared in-repo; the actual submission is performed by the project owner.
