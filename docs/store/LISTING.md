# Chrome Web Store listing copy — TrueDial for 3CX

All copy in British English. Paste into the Developer Dashboard as indicated.

## Basic information

- **Name:** TrueDial for 3CX
- **Summary (132 chars max):**
  Reliable click-to-call for 3CX. Detects phone numbers without breaking the
  page. Unofficial — not affiliated with 3CX.
- **Category:** Productivity → Communication
- **Language:** English (UK). Additional locales shipped in-package: Polish,
  German, French, Spanish — listing copy for each in [`LISTING.pl.md`](LISTING.pl.md),
  [`LISTING.de.md`](LISTING.de.md), [`LISTING.fr.md`](LISTING.fr.md) and
  [`LISTING.es.md`](LISTING.es.md). The sections below (privacy tab, permission
  justifications) address the review team and stay in English.

## Description

> TrueDial turns telephone numbers on any web page into one-click calls
> through your own 3CX phone system — built for teams that live in a browser
> and dial all day.
>
> **Accurate detection, not guesswork.** Every candidate number is validated
> with Google's libphonenumber before it is highlighted, so IBANs, invoice
> numbers, record IDs and dates are left alone. The United Kingdom is the
> default region; eight further regions are built in.
>
> **Never breaks the page.** Highlights are lightweight, reversible and
> keyboard-accessible. TrueDial never rewrites links, never touches form
> fields or code blocks, and never uses innerHTML.
>
> **Three ways to dial, honestly reported.** The 3CX Call Control API, the
> 3CX web client, or your computer's tel: handler — tried in order, with the
> winning path (and any fallback reason) shown in the popup. A call TrueDial
> cannot confirm is recorded as "attempted", never claimed as placed.
>
> **Private by design.** No telemetry, no analytics, no vendor backend — no
> data leaves your browser. TrueDial requests no access to your browsing at
> install time; you grant detection per site, per allowlist, or everywhere,
> and you can revoke it whenever you like.
>
> **Ready for teams.** CRM screen-pop presets for HubSpot, Zoho CRM and
> Salesforce, call history with configurable retention, a first-run wizard,
> config export/import, and enterprise policy support via managed storage.
>
> Requires access to a 3CX system (V20 recommended). Independent project —
> not affiliated with, nor endorsed by, 3CX. "for 3CX" denotes compatibility
> only.

## Privacy tab

- **Single purpose:** Detect telephone numbers on web pages and place calls
  through the user's own 3CX telephone system.
- **Privacy policy URL:** link to `PRIVACY.md` in the repository (or a hosted
  copy).
- **Data usage disclosures:** the extension does **not** collect or transmit
  any user data. All storage is local. Tick "No, I am not collecting user
  data" equivalents throughout.

## Permission justifications

| Permission                                                         | Justification text                                                                                                                                                                                                            |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `storage`                                                          | Stores the user's own configuration (3CX server address, preferences) and local call history on-device. Nothing is transmitted.                                                                                               |
| `contextMenus`                                                     | Adds the "Call via 3CX" right-click action for a selected telephone number.                                                                                                                                                   |
| `tabs`                                                             | Opens or focuses the user's 3CX web client tab to place a call, and shows the per-tab detected-number badge.                                                                                                                  |
| `offscreen`                                                        | Plays a short, user-configurable confirmation tone when a call is placed (audio is unavailable in MV3 service workers).                                                                                                       |
| `scripting`                                                        | Registers the number-detection content script at runtime, restricted to the origins the user has granted.                                                                                                                     |
| Optional host access (`<all_urls>` in `optional_host_permissions`) | Requested only in context: the user's own 3CX server origin (to place calls via its API), and — only if the user opts in — the sites where they want automatic number detection. No host access is requested at install time. |

## Assets

- Icon 128×128: `public/icon/128.png` (source `assets/icon.svg`).
- Small promo tile 440×280: `docs/store/promo/small-tile-440x280.png` (source
  `assets/promo-tile.svg`; both it and the icons come from `pnpm icons`).
- Screenshots 1280×800 (generate with `pnpm store:screenshots`, output in
  `docs/store/screenshots/`):
  1. `detection.png` — the demo page with numbers highlighted and traps
     untouched.
  2. `popup.png` — the popup with dialler, last-call path and history.
  3. `options.png` — the settings page (connection, detection, screen-pop
     presets).
