# TrueDial for 3CX

A reliable **click-to-call** extension for 3CX (Manifest V3, Chrome). It detects
phone numbers on web pages and places calls through your 3CX system —
**without breaking the host page** and **without asking for access to every
website you visit**.

> ⚠️ Independent project. Not affiliated with, nor endorsed by, 3CX. "for 3CX"
> denotes compatibility only.

Status: **v1.0.0-rc.1** — feature-complete release candidate. Promotion to
1.0.0 is gated on verification against a live 3CX V20 instance
(see [`docs/VERIFICATION.md`](docs/VERIFICATION.md)) and the project backlog lives in
[`BACKLOG.md`](BACKLOG.md).

---

## Why TrueDial

- **Detection quality.** A cheap candidate regex is followed by strict
  `libphonenumber-js` validation to E.164, so IBANs, order numbers, record IDs
  and dates are not turned into fake phone links. UK is the default region.
- **Never break the host page.** Highlights are `<span>` wrappers created with
  `Range.surroundContents` — no `innerHTML`, no `<a>` hijacking, no touching of
  editable fields, existing links or code blocks. Everything is reversible.
- **Least privilege.** The detection content script is registered at runtime for
  exactly the origins you grant. Installing TrueDial shows **no** "read data on
  all websites" warning; host access is optional and requested in context.
- **Three call paths with honest fallback.** Call Control API → web client deep
  link → `tel:` handler, in that order (configurable). Failures are explicit;
  a `tel:` hand-off is recorded as _attempted_, never claimed as _placed_.
- **Zero telemetry.** Nothing leaves the browser. Diagnostics live in a local
  ring buffer with a manual, anonymised copy-report.

## For users

1. Build and load the extension (see "Development" below) or install it from
   the Chrome Web Store (eventually).
2. Open the extension **Settings** (a first-run wizard covers the same steps):
   - **3CX instance FQDN** — e.g. `pbx.example.co.uk` (optionally `:5001`).
     Saving it asks for permission to talk to that server (needed for the Call
     Control API and connectivity checks).
   - **Default region** — the country used for numbers written without a
     country prefix (defaults to the United Kingdom).
   - **Auto-detection** — either allow detection on all sites, or enable
     **allowlist mode** and list only the domains you choose. Detection runs
     solely on origins you have granted.
3. On a page containing numbers: hover over a highlighted number and click the
   handset icon, or select a number and use the right-click menu.
4. The **popup** provides a manual dialler, call history and a per-site
   detection toggle for the current domain.

## How dialling works

The orchestrator tries each configured path in order and reports which one
succeeded (visible in Diagnostics):

1. **Call Control API** — `POST https://{FQDN}/callcontrol/{ext}/devices/{device}/makecall`
   with an OAuth _client credentials_ token from `https://{FQDN}/connect/token`.
   Requires an API application in the 3CX console and the appropriate licence.
2. **Web client deep link** — opens (or focuses) the 3CX web client tab at
   `https://{FQDN}/webclient/#/call?phone={number}`. No administrator
   configuration required. Port-qualified FQDNs are fully supported.
3. **`tel:`** — hands the number to the operating system's registered handler.
   TrueDial cannot confirm anything happened, so history records these as
   _attempted_.

## For 3CX administrators

- The **deep link** path needs nothing beyond user access to the web client.
- The **Call Control API** path requires an API application
  (Admin → Integrations → API) and the appropriate licence; the user needs the
  Client ID/Secret, their extension number and device ID.
- **Enterprise deployment**: configuration can be enforced via Chrome policy
  (`chrome.storage.managed`); managed values take precedence over local
  settings. Config export/import (JSON, secrets excluded) is built in.

## Privacy

**No data leaves the browser.** Call history is stored locally (30-day
retention by default, clearable from the popup). There is no vendor backend, no
telemetry and no analytics. Diagnostic reports are generated locally, are
anonymised (numbers and URLs masked) and are only shared if you copy them
yourself.

---

## Development

Requirements: Node 22+, pnpm.

```bash
pnpm install          # install dependencies
pnpm dev              # development mode (HMR) — loads .output/chrome-mv3-dev
pnpm build            # production build → .output/chrome-mv3
pnpm zip              # store-ready package → .output/*.zip
pnpm test             # unit tests (Vitest)
pnpm compile          # type check (tsc --noEmit)
pnpm lint             # ESLint + Prettier check
pnpm icons            # regenerate PNG icons from assets/icon.svg
```

Load the unpacked extension at `chrome://extensions` (Developer mode) from the
`.output/chrome-mv3` directory (or `-dev`).

Detection test page: `demo/numbers.html` (12 formats plus false-positive traps).
CI (GitHub Actions) runs lint, type-check, tests, build and packaging on every
push.

### Architecture (summary)

- `entrypoints/background.ts` — service worker: message router, orchestrator,
  context menu, runtime content-script registration, badge aggregation. All
  state lives in `browser.storage` (the SW is fully restartable).
- `entrypoints/content.ts` — content script (runtime-registered, `all_frames`):
  detection and presentation only; dialling is delegated to the SW by message.
- `lib/phone` — candidates (regex) plus E.164 validation (libphonenumber).
- `lib/scanner`, `lib/renderer` — DOM scanning and reversible highlighting
  without breaking the page.
- `lib/call` — `CallOrchestrator` plus the `ccapi`, `deeplink` and `tel`
  strategies, and the OAuth `TokenManager`.
- `lib/permissions` — least-privilege origin patterns and content-script
  registration logic.
- `lib/messaging` — `zod` message schemas (the content script is treated as an
  untrusted channel).
- `lib/storage` — configuration, history, managed-policy overlay and the
  "should we scan this domain" decision.
- `lib/diagnostics` — local ring buffer, health check, anonymised reports.

---

dev@attv.uk · Project & Development: Tomasz 'Amigo' Lewandowski · www.attv.uk ·
[GitHub](https://github.com/AmigoUK/TrueDial-for-3CX)
