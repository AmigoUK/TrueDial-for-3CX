# TrueDial for 3CX

Niezawodne rozszerzenie **click-to-call** dla 3CX (Manifest V3, Chrome).
Wykrywa numery telefonów na stronach i inicjuje połączenie przez Twój web client
3CX — **bez psucia stron hosta**.

> ⚠️ Projekt niezależny. Nie jest powiązany z 3CX ani przez 3CX wspierany.
> „for 3CX" oznacza wyłącznie kompatybilność.

Status: **v0.0.1** — pierwszy plasterek (detekcja + deep-link + popup).
Pełny plan MVP i roadmapa: patrz dokument planistyczny zespołu.

---

## Dla użytkownika

1. Zbuduj i załaduj rozszerzenie (patrz „Rozwój" niżej) lub zainstaluj ze sklepu
   (docelowo).
2. Otwórz **Ustawienia** rozszerzenia:
   - **FQDN instancji 3CX** — np. `pbx.twojafirma.pl` (opcjonalnie `:5001`).
   - **Region domyślny** — kraj dla numerów zapisanych bez prefiksu kraju.
   - **Autodetekcja** — kliknij „Zezwól na wszystkich stronach" (uprawnienie
     `<all_urls>`) albo włącz **tryb allowlist** i podaj tylko wybrane domeny.
3. Na stronie z numerami: najedź na podświetlony numer i kliknij ikonę słuchawki,
   albo zaznacz numer i użyj menu prawego przycisku myszy.
4. W **popupie** masz ręczny dialer, historię połączeń i przełącznik detekcji dla
   bieżącej domeny.

Jak działa dzwonienie w tym plasterku: otwieramy/fokusujemy kartę web clienta
3CX pod adresem `https://{FQDN}/webclient/#/call?phone={numer}`. Nie wymaga to
konfiguracji po stronie administratora ani licencji Call Control API.

## Dla administratora 3CX

Plasterek 1 używa wyłącznie **deep-linku web clienta** — nie wymaga tworzenia
aplikacji API ani żadnych zmian w konsoli 3CX. Wystarczy, że użytkownicy mają
dostęp do web clienta pod `https://{FQDN}/webclient/`.

Ścieżka **Call Control API** (pełny status połączenia, `makecall`) pojawi się w
kolejnym plasterku i będzie wymagała utworzenia aplikacji API
(Admin → Integrations → API) oraz odpowiedniej licencji.

Wdrożenie enterprise (polityki, wymuszony FQDN/allowlist) przez
`chrome.storage.managed` — planowane.

## Prywatność

Domyślnie **żadne dane nie opuszczają przeglądarki**. Historia połączeń jest
przechowywana lokalnie (retencja 30 dni, kasowalna z popupu). Brak backendu
producenta, brak telemetrii w tej wersji.

---

## Rozwój

Wymagania: Node 22+, pnpm.

```bash
pnpm install          # instalacja zależności
pnpm dev              # tryb deweloperski (HMR) — ładuje .output/chrome-mv3-dev
pnpm build            # build produkcyjny → .output/chrome-mv3
pnpm test             # testy (Vitest)
pnpm compile          # sprawdzenie typów (tsc --noEmit)
```

Załaduj `unpacked` w `chrome://extensions` (Developer mode) z katalogu
`.output/chrome-mv3` (lub `-dev`).

Strona testowa detekcji: `demo/numbers.html` (12 formatów + pułapki
false-positive).

### Architektura (skrót)

- `entrypoints/background.ts` — service worker: router komunikatów, orchestrator,
  context menu. Cały stan w `browser.storage` (SW w pełni restartowalny).
- `entrypoints/content.ts` — content script (`all_frames`): tylko detekcja i
  prezentacja; dzwonienie deleguje komunikatem do SW.
- `lib/phone` — kandydaci (regex) + walidacja E.164 (libphonenumber).
- `lib/scanner`, `lib/renderer` — skan DOM i podświetlanie bez łamania strony.
- `lib/call` — `CallOrchestrator` + strategie (obecnie `DeepLinkStrategy`).
- `lib/messaging` — schematy `zod` wiadomości.
- `lib/storage` — konfiguracja, historia, decyzja „czy skanować domenę".

---

dev@attv.uk · Project & Development: Tomasz 'Amigo' Lewandowski · www.attv.uk ·
[GitHub](https://github.com/AmigoUK/TrueDial-for-3CX)
