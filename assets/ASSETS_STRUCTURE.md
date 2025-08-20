# ROMION O'LOGIC — ASSETS STRUCTURE (JS + CSS)
**Version:** 2025-08-20  
**Scope:** `/assets/js/**` and `/assets/css/**`  
**Goal:** małe moduły (≤ ~10 KB/pl), globalnie unikalne nazwy, ładowanie on-demand.

## Entry points (stałe w HTML)
- CSS: `<link rel="stylesheet" href="/assets/css/site.css">`
- JS (SPEC): `<script type="module" src="/assets/js/spec.js"></script>`
- JS (SIM): `<script type="module" src="/assets/js/sim.js"></script>`

## Zasady ogólne
1. Unikalne nazwy bazowe plików (`rjs-*`, `rcss-*`).
2. Limit pliku ~8–10 KB (powyżej 12 KB — tnij dalej).
3. Brak ciężkich zależności; YAML parser ładuje się **on-demand**.
4. `spec.js` i `site.css` są tylko agregatorami importów.
5. Deploy/CI — bez zmian, dopóki nie padnie decyzja.
6. Klasy CSS: prefiks `.r-…` (+ BEM, gdy sensowne).

---

## /assets/js/ (ES Modules)

**spec.js** — ENTRY dla `/sim/spec`; tylko import `rjs-spec-bootstrap.mjs`.  
**sim.js** — ENTRY dla `/sim/`; tylko import `rjs-sim-bootstrap.mjs`.

**rjs-dom-utils.mjs** — utilsy DOM: `qs`, `qsa`, `ce`, `on`, `css`.  
**rjs-net-fetch.mjs** — `fetch` z timeoutem, proste cache, kontrola statusów.  
**rjs-formatters.mjs** — `prettyJSON`, `bytes()`, `time()`, `snippet()`  
**rjs-router-lite.mjs** — hash-routing (#section), `onRoute`, `setRoute`, `getRoute`.

**rjs-ui-components.mjs** — mikro-komponenty: `Card`, `Notice`, `Spinner`, `Button`.  
**rjs-ui-renderers.mjs** — `renderCode`, `renderTable`, `renderList`, `renderTree`.  
**rjs-ui-toast.mjs** — `toast(type, message, opts?)`.

**rjs-spec-bootstrap.mjs** — init `/sim/spec`: spinner → load → render → nav → validate.  
**rjs-spec-data-loader.mjs** — ładowanie `/examples/**`, rozpoznanie formatu po rozszerzeniu:  
- `.json` → `JSON.parse`  
- `.yaml`/`.yml` → `import('./rjs-yaml-lite.mjs')` + `parseYAML()`  
**rjs-spec-render.mjs** — render sekcji/specyfikacji.  
**rjs-spec-nav.mjs** — nawigacja/TOC (+ integracja z router-lite).  
**rjs-spec-validate.mjs** — walidacja ścieżek/struktur, raport do UI.

**rjs-sim-bootstrap.mjs** — init `/sim/` (scena, dane, kontrole).  
**rjs-sim-render.mjs** — rysowanie/aktualizacja sceny/diagramów.  
**rjs-sim-controls.mjs** — play/pause/zoom/reset, hotkeys.

**rjs-yaml-lite.mjs** — lekki parser YAML (mapy, listy, string/num/bool/null, `---/...`, `#`, bloki `|`/`>`).  
> Brak wsparcia dla `&`/`*` i `!!`; jeśli wykryte → czytelny błąd `{line,col}`.

---

## /assets/css/

**site.css** — ENTRY; tylko `@import` pozostałych plików (kolejność = kaskada).

**rcss-reset.css** — lekki reset/normalize.  
**rcss-variables.css** — `:root` zmienne (kolory, spacing, font-sizes, radii, shadows).  
**rcss-typography.css** — body, nagłówki, linki, `code/pre/kbd`.

**rcss-grid.css** — siatka, kontenery, gapy, breakpoints.  
**rcss-header.css** — sticky header/topbar.  
**rcss-sidebar.css** — panel boczny/TOC (mobile: off-canvas/stack).  
**rcss-main.css** — obszar treści, max-width, spacing.

**rcss-cards.css** — `.r-card` i warianty.  
**rcss-buttons.css** — przyciski (primary/ghost/danger).  
**rcss-notices.css** — alerty/info/warn/error.  
**rcss-tables.css** — tabele (overflow-x na mobile, opcj. sticky header).  
**rcss-code.css** — `pre/code` (lekki highlight, bez libki).  
**rcss-spinner.css** — animacja spinnera CSS-only.

**rcss-spec-page.css** — specyficzne poprawki dla `/sim/spec`.  
**rcss-sim-page.css** — specyficzne dla `/sim/`.  
**rcss-utilities.css** — drobne helpery: `.sr-only`, `.mt-*`, `.px-*`, `.grid-col-*`.

---

## Ładowanie warunkowe

**/sim/spec.html**  
- MUSI: `site.css`, `spec.js`.  
- `rjs-yaml-lite.mjs` ładuje się **tylko** przy plikach `.yaml/.yml`.

**/sim/index.html**  
- MUSI: `site.css`, `sim.js`.  
- Tylko moduły `rjs-sim-*` + wspólne `rjs-ui-*`/`rjs-dom-*`.

---

## Checklist (wdrożenie krokami)
- [ ] Utworzyć puste pliki wg listy.  
- [ ] Wypełnić entry: `site.css` (same `@import`) i `spec.js` (import bootstrapu).  
- [ ] Dodać szkielety: `rjs-spec-bootstrap.mjs`, `rjs-spec-data-loader.mjs`.  
- [ ] Dodać minimalny `rjs-yaml-lite.mjs` i spiąć **on-demand**.  
- [ ] Smoke test `/sim/spec` na JSON.  
- [ ] Test `/examples/yaml/**`.  
- [ ] Przenoszenie styli do `rcss-*` (partiami).  
- [ ] (opcjonalnie) `rjs-router-lite.mjs` + `rcss-sidebar.css` po zrobieniu TOC.

---

## Konwencje
- Pliki JS: `rjs-<obszar>-<rola>.mjs`  
- Pliki CSS: `rcss-<kategoria>.css`  
- Klasy: `.r-<komponent>__(element)--(modyfikator)`  
- Id sekcji: `data-section="id"` + `#id` w URL.

*End of file.*