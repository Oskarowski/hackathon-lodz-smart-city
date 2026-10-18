# Tokeny designu — Moje Osiedle

| Plik | Co zawiera |
|---|---|
| `tokens.json` | Źródło prawdy: wszystkie tokeny, w tym motyw miasta (gałąź `theme`). |
| `tokens.css` | Te same wartości jako zmienne CSS, bez motywu. Ekrany makiety go nie używają; jest dla PWA. |
| `theme.css` | Motyw miasta: kolor główny, akcent, kropka znaku, nazwa aplikacji, nazwa karty, znak słowny. |

## Zasady

- Zmiany zaczynasz w `tokens.json`. Pliki CSS uzupełniasz ręcznie przy każdej zmianie, z tymi samymi wartościami.
- `theme.css` podmienia się per miasto. Reszta tokenów jest wspólna dla wszystkich miast.
- Obrys przycisków drugorzędnych, filtrów i pól = `color.controlBorder`.
- Nazwy zmiennych to ścieżka klucza w JSON-ie w kebab-case: `color.textSecondary` → `--color-text-secondary`, `status.done.bg` → `--status-done-bg`, `space.1_5` → `--space-1-5`, `theme.wordmark.light` → `--theme-wordmark-light`.
- W JSON-ie rozmiary są liczbami w px. W CSS rozmiary, odstępy i promienie mają jednostkę `px`, grubości fontu są bez jednostki.
- Teksty motywu (`--theme-app-name` itd.) są dla zespołu dev. W makiecie te napisy są wpisane w markup.

## Kontrast (WCAG 2.x, luminancja względna)

| Para | Kontrast | Wymóg | Wynik |
|---|---|---|---|
| biały `#FFFFFF` na primary `#1D5FA8` | 6,45:1 | AA tekst ≥4,5:1 | ✓ |
| biały `#FFFFFF` na accent `#7A3EB1` | 6,66:1 | AA tekst ≥4,5:1 | ✓ |
| w toku: `#174E8C` na `#E8EFF8` | 7,24:1 | AA tekst ≥4,5:1 | ✓ |
| zakończone: `#1E6B33` na `#E3F4E8` | 5,73:1 | AA tekst ≥4,5:1 | ✓ |
| ostrzeżenie: `#8A5300` na `#FDF1DD` | 5,67:1 | AA tekst ≥4,5:1 | ✓ |
| pilne/odrzucone: `#A61F1F` na `#FDECEC` | 6,48:1 | AA tekst ≥4,5:1 | ✓ |
| obrys toru `#7D8A9C` na `#FFFFFF` | 3,51:1 | AA elementy UI ≥3:1 | ✓ |
| obrys toru `#7D8A9C` na `#F5F7FA` | 3,27:1 | AA elementy UI ≥3:1 | ✓ |
| obrys kontrolek `#7D8A9C` na `#FFFFFF` / na `#F5F7FA` | 3,51:1 / 3,27:1 | AA elementy UI ≥3:1 | ✓ |

## Nowy motyw miasta

Nowe primary i accent muszą mieć kontrast **≥4,5:1 z białym**, bo w makiecie stoją na nich biały tekst i białe ikony. Sprawdź to, zanim podmienisz `theme.css`.
