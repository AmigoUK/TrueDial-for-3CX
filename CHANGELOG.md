# Changelog

All notable changes to **TrueDial for 3CX** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

_Nothing yet._

## [0.0.1] — 2026-07-27

Pierwszy pionowy plasterek („walking skeleton"): detekcja numerów → deep-link do
web clienta 3CX, bez zależności od Call Control API. Realizacja naczelnej zasady
produktu: **never break the host page**.

### Added
- Szkielet WXT + TypeScript + Preact (Manifest V3), file-based entrypoints.
- Dwuwarstwowa detekcja numerów: regex kandydatów → walidacja `libphonenumber-js`
  → normalizacja do E.164, z wykluczeniami strukturalnymi i heurystyką
  anty-record-ID.
- Content script (`all_frames`) ze scanerem (`MutationObserver` + debounce +
  `requestIdleCallback`, limit 200 podświetleń) i rendererem trybu subtelnego
  (podkreślenie + ikona na hover, bez `innerHTML`, bez owijania w `<a>`).
- Inicjowanie połączeń przez `CallOrchestrator` z jedną strategią: **deep-link
  web clienta 3CX** (`/webclient/#/call?phone=`), z fokusem istniejącej karty.
- Context menu „Zadzwoń przez 3CX" na zaznaczeniu.
- Popup: status zdrowia, ręczny dialer z live-walidacją, per-site toggle,
  lokalna historia połączeń (retencja 30 dni).
- Options page: FQDN, region domyślny (picker), tryb detekcji, allowlist,
  grant `<all_urls>` (opcjonalny) + stopka kredytowa.
- Typed messaging (walidacja `zod` + sprawdzenie `sender.id` w service workerze).
- 35 testów (Vitest): korpus telefonów, false-positive corpus, messaging,
  orchestrator, integracja scanera na DOM (happy-dom).

[Unreleased]: https://github.com/AmigoUK/TrueDial-for-3CX/compare/v0.0.1...HEAD
[0.0.1]: https://github.com/AmigoUK/TrueDial-for-3CX/releases/tag/v0.0.1
