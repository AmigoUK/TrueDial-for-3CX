# TrueDial for 3CX

A reliable **click-to-call** extension for 3CX (Manifest V3, Chrome). It detects
phone numbers on web pages and places calls through your 3CX web client —
**without breaking the host page**.

> ⚠️ Independent project. Not affiliated with, nor endorsed by, 3CX. "for 3CX"
> denotes compatibility only.

Status: **v0.0.1** — first vertical slice (detection + deep link + popup).
The full MVP plan and roadmap live in the team's planning document.

---

## For users

1. Build and load the extension (see "Development" below) or install it from the
   store (eventually).
2. Open the extension **Settings**:
   - **3CX instance FQDN** — e.g. `pbx.yourcompany.com` (optionally `:5001`).
   - **Default region** — the country used for numbers written without a country
     prefix.
   - **Auto-detection** — click "Allow on all sites" (the `<all_urls>` permission)
     or enable **allowlist mode** and list only the domains you choose.
3. On a page containing numbers: hover over a highlighted number and click the
   handset icon, or select a number and use the right-click menu.
4. The **popup** provides a manual dialler, call history and a per-site detection
   toggle for the current domain.

How dialling works in this slice: we open (or focus) the 3CX web client tab at
`https://{FQDN}/webclient/#/call?phone={number}`. This requires no administrator
configuration and no Call Control API licence.

## For 3CX administrators

Slice 1 uses the **web client deep link** only — it requires no API application
and no changes in the 3CX console. Users simply need access to the web client at
`https://{FQDN}/webclient/`.

The **Call Control API** path (full call status, `makecall`) arrives in a later
slice and will require an API application (Admin → Integrations → API) and the
appropriate licence.

Enterprise deployment (policies, enforced FQDN/allowlist) via
`chrome.storage.managed` is planned.

## Privacy

By default, **no data leaves the browser**. Call history is stored locally
(30-day retention, clearable from the popup). There is no vendor backend and no
telemetry in this version.

---

## Development

Requirements: Node 22+, pnpm.

```bash
pnpm install          # install dependencies
pnpm dev              # development mode (HMR) — loads .output/chrome-mv3-dev
pnpm build            # production build → .output/chrome-mv3
pnpm test             # tests (Vitest)
pnpm compile          # type check (tsc --noEmit)
```

Load the unpacked extension at `chrome://extensions` (Developer mode) from the
`.output/chrome-mv3` directory (or `-dev`).

Detection test page: `demo/numbers.html` (12 formats plus false-positive traps).

### Architecture (summary)

- `entrypoints/background.ts` — service worker: message router, orchestrator,
  context menu. All state lives in `browser.storage` (the SW is fully
  restartable).
- `entrypoints/content.ts` — content script (`all_frames`): detection and
  presentation only; dialling is delegated to the SW by message.
- `lib/phone` — candidates (regex) plus E.164 validation (libphonenumber).
- `lib/scanner`, `lib/renderer` — DOM scanning and highlighting without breaking
  the page.
- `lib/call` — `CallOrchestrator` plus strategies (currently `DeepLinkStrategy`).
- `lib/messaging` — `zod` message schemas.
- `lib/storage` — configuration, history, and the "should we scan this domain"
  decision.

---

dev@attv.uk · Project & Development: Tomasz 'Amigo' Lewandowski · www.attv.uk ·
[GitHub](https://github.com/AmigoUK/TrueDial-for-3CX)
