# AGENTS.md – Tooldex

Anleitung für KI-Assistenten, die an diesem Projekt arbeiten. Zuerst lesen, dann ändern.

## Projekt in einem Satz

**Tooldex** ist ein Quiz-Abenteuer im Pokémon-Stil aus dem STARTPLATZ AI HUB (Jakow Smirin): Man erkundet Düsseldorf, beantwortet KI-Fragen und fängt 21 KI-Tools. Vite + TypeScript, gehostet auf Vercel.

- Repo: https://github.com/TheMavel/KI-Development-Woche (Branch `main`)
- Sprache des Spiels und der Kommunikation mit dem Nutzer: **Deutsch**

## Entwickeln

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # Typprüfung + Build nach dist/
```

Vercel liest `vercel.json` (Framework Vite, Ausgabe `dist`).

## Aufbau

| Pfad | Zweck |
|---|---|
| `index.html` | Grundgerüst: Kopfzeile, HUD, Canvas, Dialog, Kampf-, Menü- und Titel-Ebene, Touch-Steuerung |
| `src/main.ts` | Ablauf: Story, Interaktionen, Ereignisse beim Betreten von Kacheln, Eingabe-Routing, Spielschleife |
| `src/world.ts` | Karte, Figuren, Bewegung, Kamera, Trainer-Sichtlinien, Darstellung |
| `src/state.ts` | Spielstand, Einstellungen, Level/XP (`localStorage`: `tooldex-save-v1`, `tooldex-settings-v1`) |
| `src/data/` | Inhalte: `tools.ts` (21 Tools + Joker), `questions.ts` (Fragen), `maps.ts` (Karten, NPCs, Trainer; Kachel-Legende oben), `items.ts` |
| `src/engine/` | Farben (`palette.ts`), Kacheln, Sprites, Eingabe, Audio (Chiptune per Web Audio) |
| `src/ui/` | Dialoge, Kampf/Quiz, Menüs, HUD, Titelbildschirm |
| `src/style.css` | Gesamtes Styling |

## Regeln

- **Design:** dunkles „gertix“-Design. Dunkle Bühne (`--night`), helles Blatt (`--paper`) für Kampf und Menüs. `--glow` (Orange) nur als Licht-Akzent, nie als Fläche. Jost 300 in Versalien für Headlines, IBM Plex Mono für Text. 1px gepunktete Linien, Radius 0, Pills mit 999px. Keine neuen Farben – Pixelgrafik nutzt dieselben Tokens.
- **Fakten:** Fragen (erste Antwort ist die richtige, `d` = Schwierigkeit 1–3) und Tool-Texte müssen stimmen. Im Zweifel weglassen statt raten.
- **Texte:** Ich-/Du-Form, kurz, konkret, keine Buzzwords. Deutsche Anführungszeichen „…“, Zahlen unter 10 mit führender Null in Anzeigen (03).
- **Karten** nach Änderungen prüfen: gleiche Zeilenlängen, Warps auf begehbaren Kacheln, Schilder haben Text.
- Nach Änderungen im Browser prüfen: keine Konsolenfehler, kein horizontales Scrollen bei ~375px.
- Im Dev-Modus gibt es `window.__tooldex` (u. a. `tick()`) für automatisierte Tests, weil `requestAnimationFrame` in versteckten Vorschaufenstern pausiert. Im Produktions-Build ist der Hook nicht enthalten.
- Git: auf `main` committen und pushen, wenn der Nutzer es verlangt. Commit-Nachrichten auf Deutsch.

## Hinweis

Bis Commit `a241e58` lag hier auch Jakows Portfolio (`index.html`, `design-system.html`, `supabase/`). Lokal gesichert im Tag `portfolio-backup`.
