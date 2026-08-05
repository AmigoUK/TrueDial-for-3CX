# Live 3CX V20 verification protocol

**Release gate:** v1.0.0-rc.1 is promoted to v1.0.0 only after every step below
passes against a live 3CX V20 instance. Everything else (unit tests, smoke E2E,
CI) is already automated; this protocol covers exactly what cannot be verified
without a real PBX.

Time required: ~30 minutes. You will need: administrator access to the 3CX
console, a test extension (e.g. 100) with a registered device, and a phone
number that is safe to ring.

## 0. Setup

1. `pnpm install && pnpm build`, then load `.output/chrome-mv3` unpacked at
   `chrome://extensions` (Developer mode).
2. Confirm the install prompt shows **no** "read data on all websites"
   warning. ☐
3. Complete the wizard: FQDN (with the port if your instance uses one, e.g.
   `pbx.example.co.uk:5001`), path _Automatic_, region _United Kingdom_, grant
   PBX access, grant detection (all sites or an allowlist). ☐

## 1. Detection sanity (any machine)

1. Open `demo/numbers.html`. All "should be detected" rows are highlighted;
   no trap row is. ☐
2. Toolbar badge shows the detected count. ☐

## 2. Deep link path

1. In Settings, set the preferred path to **Web client deep link only**; Save.
2. Log in to the 3CX web client in another tab.
3. Click a highlighted number. Expected: the **existing** web client tab is
   focused (not duplicated) and the call screen opens with the number
   pre-filled, in E.164. ☐
4. Close the web client tab and click a number again. Expected: a new web
   client tab opens on the call screen. ☐
5. **Port check** (only if your FQDN carries a port): repeat step 3 — the tab
   focus must still work. This code path failed silently before the 2026-08-05
   hardening round. ☐
6. Popup shows _Last call: deeplink ✓_. ☐

## 3. Call Control API path

1. In the 3CX console: Admin → Integrations → API → add an application; note
   the Client ID and Client Secret. Confirm your licence includes the Call
   Control API. ☐
2. In Settings: enter Client ID, Client Secret, extension number and device ID
   (list devices via `GET https://{FQDN}/callcontrol/{ext}/devices` with a
   Bearer token if unsure); set the preferred path to **Call Control API
   only**; Save.
3. Run the connectivity test in the popup. Expected: _PBX reachable: yes ·
   API token: yes · Active path: ccapi_. ☐
4. Click a highlighted number. Expected: your registered device rings first,
   then the outward leg is placed; history records **placed** (not
   _attempted_). ☐
5. Enter a wrong Client Secret, Save, call again. Expected: the call falls
   back (path _auto_) or fails **visibly** (path _ccapi_), and the popup's
   last-call trail shows the ccapi failure reason — nothing fails silently. ☐
   Restore the correct secret afterwards.

## 4. tel: path

1. Set the preferred path to **tel: only**; Save.
2. Click a highlighted number. Expected: the OS handler prompt appears (or the
   registered app opens); history records **attempted** with the ≈ marker —
   never _placed_. ☐

## 5. Fallback matrix

1. Set the path to **Automatic**, break CCAPI (wrong secret), click a number.
   Expected: the call still goes through via the deep link, and the popup's
   last-call trail reads `ccapi ✗ (…) → deeplink ✓`. ☐
2. Restore the correct secret.

## 6. Screen-pop

1. Pick a CRM preset in Settings (or the generic template), replace the
   UPPER-CASE segment, Save.
2. Place a call. Expected: the CRM search opens in a background tab with the
   number substituted. ☐

## 7. Real-page robustness

1. Open your CRM / accounting system (e.g. HubSpot, Xero) with detection
   granted. Expected: genuine numbers highlighted; invoice numbers, record IDs
   and amounts untouched; the page behaves normally (forms, buttons, editing). ☐
2. Open a Salesforce Lightning record if available. Expected: no record ID is
   highlighted. ☐

## 8. Sign-off

When every box is ticked: bump `package.json` to `1.0.0`, move the
`[Unreleased]` CHANGELOG section into a dated `1.0.0` entry, commit
`chore(release): v1.0.0`, tag and push. Any failed step goes back into
`BACKLOG.md` as a P1 defect first.
