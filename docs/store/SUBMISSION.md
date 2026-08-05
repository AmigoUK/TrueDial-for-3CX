# Chrome Web Store submission checklist — TrueDial for 3CX

The submission itself is performed by the project owner. Everything below is
prepared in-repo.

## One-off account setup

1. Create/sign in to a [Chrome Web Store developer account](https://chrome.google.com/webstore/devconsole)
   (one-off $5 registration fee).
2. Verify the contact e-mail (dev@attv.uk) in the dashboard.

## Per-release steps

1. Ensure CI is green on the release commit.
2. Build the package: `pnpm zip` → `.output/truedial-for-3cx-<version>-chrome.zip`.
   (Do **not** submit an E2E build; run a plain `pnpm zip` so the manifest has
   no static content script.)
3. Sanity-check the zip's `manifest.json`:
   - no `content_scripts`, no `host_permissions`;
   - `optional_host_permissions: ["<all_urls>"]`;
   - `permissions`: storage, contextMenus, tabs, offscreen, scripting;
   - `icons` present (16/32/48/128).
4. In the dashboard: **New item** → upload the zip.
5. **Store listing** tab: paste name, summary, description and category from
   [`LISTING.md`](LISTING.md); upload the three 1280×800 screenshots from
   `docs/store/screenshots/` and the 128×128 icon.
6. **Privacy** tab: single-purpose statement, permission justifications and
   data-usage answers from `LISTING.md`; link the privacy policy
   ([`PRIVACY.md`](../../PRIVACY.md), hosted copy or GitHub URL).
7. **Distribution** tab: visibility Public (or Unlisted for a soft launch);
   regions: all, or start with the United Kingdom.
8. Submit for review. Typical review turnaround is a few days; the
   least-privilege manifest (no install-time host access) is designed to keep
   review friction low.

## After approval

- Tag the release (`git tag -a vX.Y.Z && git push --tags`) and create the
  matching GitHub Release with the same zip.
- Record the store item ID in this file for future updates.

## Notes for reviewers (if asked)

- The extension's single purpose is click-to-call against the user's own 3CX
  system; the optional `<all_urls>` host permission exists solely so users can
  opt into automatic number detection on sites of their choosing.
- No remote code: all scripts ship in the package; the CSP is the MV3 default.
- No data collection of any kind (see `PRIVACY.md`).
