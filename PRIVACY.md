# Privacy Policy — TrueDial for 3CX

_Last updated: 2026-08-05_

TrueDial for 3CX ("the extension") is an independent browser extension that
detects telephone numbers on web pages and places calls through your own 3CX
telephone system. It is not affiliated with 3CX.

## The short version

**No data leaves your browser.** The extension has no vendor backend, no
telemetry, no analytics and no advertising. Nothing you do with it is
transmitted to the developer or to any third party.

## What the extension stores, and where

All data is stored locally in your browser's extension storage
(`chrome.storage.local` / `chrome.storage.session`) on your device:

| Data                                                                              | Purpose                                   | Lifetime                                                       |
| --------------------------------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------- |
| Configuration (your 3CX server address, extension number, device ID, preferences) | Placing calls, detection settings         | Until you change or remove it                                  |
| Call Control API credentials (Client ID / Client Secret), if you configure them   | Authenticating to **your own** 3CX server | Until you remove them; never synced, never exported by default |
| Call history (numbers you dialled, timestamp, outcome)                            | The popup's history list                  | 30 days by default (configurable), clearable at any time       |
| Diagnostics ring buffer (recent event descriptions)                               | Local troubleshooting                     | Session-scoped; cleared when the browser closes                |

Configuration export files omit secrets by default. Diagnostic reports are
generated locally, anonymise telephone numbers and URLs, and leave the browser
only if you copy and share them yourself.

## What the extension transmits

The extension communicates exclusively with **the 3CX server address you
configure** — to obtain an access token, to place calls via the 3CX Call
Control API, and to run connectivity checks — and, if you use the web client
or `tel:` call paths, hands the number to your 3CX web client tab or your
operating system's telephone handler. No other network requests are made.

## Page content

With your permission, the extension scans pages for telephone numbers. This
analysis happens entirely inside your browser. Page content is never recorded,
stored beyond the current page view, or transmitted anywhere. The extension
only runs on origins you have explicitly granted (or allowlisted); it requests
no blanket host access at install time.

## Your choices

- Grant or revoke site access at any time (`chrome://extensions` → TrueDial →
  Site access, or the extension's own settings).
- Clear call history from the popup; adjust or disable history retention in
  settings.
- Remove the extension to delete all locally stored data.

## Contact

Questions about this policy: **dev@attv.uk**.
