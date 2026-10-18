# Moje Osiedle – PWA

Klikalny prototyp „Moje Osiedle” jako instalowalna aplikacja PWA (działa offline).

## Uruchomienie

```bash
npm install
npm run dev        # http://localhost:5173, także w sieci lokalnej (--host)
npm run build      # produkcja → dist/
npm run preview    # podgląd builda: http://localhost:4173
```

## Jak to działa

- `design/` – pliki z kanwy „Moje Osiedle – makieta” (`*.dc.html`, `canvas.json`, `tokens/`). To jest źródło prawdy dla wyglądu i logiki ekranów.
- `vite/dc-plugin.ts` – kompiluje każdy `*.dc.html` do modułu JS (drzewo szablonu + klasa logiki).
- `src/dc/runtime.tsx` – renderuje szablony w React: `{{dziury}}`, `<sc-if>`, `<sc-for>`, `<dc-import>`, zdarzenia, linki między ekranami (`Start.dc.html` → `#/Start`).
- `src/App.tsx` – routing po hashu, ramka telefonu i lista ekranów na komputerze, pełny ekran na telefonie, panele urzędu na pełną szerokość.

Aktualizacja makiety: podmień pliki w `design/` na nowe z kanwy i przebuduj.

## Prezentacja

- **Telefon:** otwórz adres aplikacji → „Dodaj do ekranu głównego” / „Zainstaluj”. Startuje od ekranu aplikacji miejskiej (`#/Main`).
- **Laptop / rzutnik:** lista wszystkich ekranów po lewej, telefon pośrodku. Panele urzędu i instytucji otwierają się na całą szerokość; przycisk „Ekrany” wraca do listy.
- **Lista ekranów na telefonie:** `#/ekrany`.
- Instalacja PWA wymaga HTTPS (albo `localhost`). Najprościej: wrzuć `dist/` na Netlify Drop, Vercel, Cloudflare Pages lub GitHub Pages – build działa z dowolnej ścieżki.

Ikony: `public/favicon.svg` → `npm run icons`.
