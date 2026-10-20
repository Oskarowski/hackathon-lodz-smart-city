# Moje Osiedle – PWA

Aplikacja „Moje Osiedle” – moduł osiedlowy aplikacji miejskiej *Twoje Miasto*.
Instalowalna PWA, działa offline.

## Uruchomienie

```bash
npm install
npm run dev        # http://localhost:5173, także w sieci lokalnej (--host)
npm run build      # produkcja → dist/
npm run preview    # podgląd builda: http://localhost:4173
```

## Jak działa aplikacja

Aplikacja nie ma żadnych elementów demonstracyjnych – żadnej listy ekranów ani
ramki telefonu. Otwiera się na ekranie aplikacji miejskiej i dalej nawigujesz
tak jak w gotowym produkcie: kaflami, dolnym paskiem zakładek i strzałkami
wstecz. Wszystkie 35 ekranów jest osiągalnych z poziomu aplikacji.

- **Telefon:** ekran wypełnia całe okno; kolory paska stanu i paska nawigacji
  systemu dopasowują się do bieżącego ekranu (`safe-area-inset`).
- **Komputer:** układ mobilny jest wyśrodkowany w kolumnie (maks. 480 px), bo
  ekrany są projektowane pod telefon. Panele urzędu i instytucji są
  projektowane jako strony 1280 px i zajmują całą szerokość okna.
- **Panele służbowe:** wejście z ekranu **Więcej → Panel służbowy**; powrót
  linkiem „Wróć do aplikacji” w pasku bocznym panelu.
- **Instalacja:** **Więcej → Zainstaluj aplikację**. Na Androidzie/desktopie
  otwiera systemowe okno instalacji, na iOS pokazuje instrukcję
  („Udostępnij → Dodaj do ekranu początkowego”).

## Architektura

- `design/` – pliki z kanwy „Moje Osiedle – makieta” (`*.dc.html`,
  `canvas.json`, `tokens/`). Źródło prawdy dla wyglądu i logiki ekranów.
- `vite/dc-plugin.ts` – kompiluje każdy `*.dc.html` do modułu JS (drzewo
  szablonu + klasa logiki).
- `src/dc/runtime.tsx` – renderuje szablony w React: `{{dziury}}`, `<sc-if>`,
  `<sc-for>`, `<dc-import>`, zdarzenia, linki między ekranami
  (`Start.dc.html` → `#/Start`).
- `src/App.tsx` – powłoka aplikacji: routing po hashu, tytuł dokumentu,
  `theme-color`, układ telefonu vs. panelu.
- `src/screens.ts` – lista ekranów z `canvas.json` + kolory krawędzi ekranu.

Aktualizacja makiety: podmień pliki w `design/` na nowe z kanwy i przebuduj.

### Zmiany względem kanwy

Kilka plików w `design/` ma dopiski potrzebne, by aplikacja działała jak
produkt, a nie zestaw plansz:

- `Wiecej.dc.html` – sekcje **Aplikacja** (instalacja PWA, woła
  `window.mojeOsiedle.install()` z powłoki) i **Panel służbowy** (wejście do
  paneli).
- `PanelBoczny.dc.html` – link „Wróć do aplikacji” w stopce paska bocznego.
- `Main.dc.html` – karta mieszkańca nachodzi na nagłówek przez ujemny margines
  całego `<main>` (w kanwie była przycinana przez przewijany kontener).
- `Gabaryty-zdjecie.dc.html` – etap **Zrób zdjęcie**: podgląd z aparatu
  (`getUserMedia`), zdjęcie z galerii albo systemowy aparat (`capture`), potem
  makietowe rozpoznanie. Bez dostępu do aparatu działa wybór pliku.
- `Tablica-dodaj` → `Tablica-dodano` i `Zajecia-propozycja` →
  `Zajecia-zaproponowano` – wpisane dane przechodzą na ekran potwierdzenia
  (`sessionStorage`).
- Wszystkie pola `[ADRES]`, `[DATA]`, `[IMIĘ]` itd. są wypełnione spójnymi
  danymi z Łodzi (okolice Parku Źródliska i Księżego Młyna; daty od
  19 października 2026), a miejsca na zdjęcia mają ilustracje z
  `public/ilustracje/`.

Przy kolejnej synchronizacji z kanwy trzeba je nanieść ponownie.

## Wdrożenie

Build jest statyczny i działa z dowolnej ścieżki (`base: './'` + routing po
hashu) – Netlify, Vercel, Cloudflare Pages, GitHub Pages. Instalacja PWA wymaga
HTTPS (albo `localhost`).

Ikony: `public/favicon.svg` → `npm run icons`.

### GitHub Pages

Workflow `.github/workflows/deploy.yml` buduje i publikuje aplikację przy każdym
pushu na `master` (albo ręcznie: Actions → Deploy to GitHub Pages → Run workflow).

1. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
2. Push na `master` – adres pojawi się w podsumowaniu joba `deploy`.

Domena **barrio.jdex.pl** jest zapisana w `public/CNAME` (trafia do `dist/`).

1. DNS w strefie `jdex.pl`: rekord `CNAME` `barrio` → `oskarowski.github.io`.
2. **Settings → Pages → Custom domain:** `barrio.jdex.pl`, zapisz, poczekaj na
   weryfikację DNS i zaznacz **Enforce HTTPS** (aparat i instalacja PWA
   wymagają HTTPS).
3. Uruchom workflow ponownie.

Zalecane: zweryfikuj domenę `jdex.pl` w **Settings (konta) → Pages → Add a
domain**, żeby nikt inny nie mógł podpiąć jej subdomen.

## Dla deweloperów

`npm run dev` udostępnia pod `#/ekrany` listę wszystkich ekranów (skrót do
testów). Nie wchodzi do wersji produkcyjnej.
