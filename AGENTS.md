# AGENTS.md – Portfolio Jakow Smirin

Anleitung für KI-Assistenten (ChatGPT/Codex, Claude, Cursor, Copilot …), die an diesem Projekt arbeiten. Zuerst lesen, dann ändern.

## Projekt in einem Satz

Persönliche Portfolio-Seite von **Jakow Smirin**, CEO des STARTPLATZ AI HUB in Düsseldorf (KI-Beratung, AIOps, AI Literacy). Statische HTML-Seite ohne Build-Schritt, gehostet über GitHub, mit Newsletter-Anmeldung in Supabase.

- Repo: https://github.com/TheMavel/KI-Development-Woche (Branch `main`)
- Sprache der Seite und der Kommunikation mit dem Nutzer: **Deutsch**
- Inhalte stammen aus `Jakow-Profil.pdf` (LinkedIn-Export). Keine Fakten erfinden; alles muss sich auf das PDF oder Aussagen des Nutzers stützen.

## Dateien

| Datei | Zweck |
|---|---|
| `index.html` | Die Portfolio-Seite. Eine Datei mit Inline-CSS und Inline-JS. **Das ist die Live-Seite.** |
| `design-system.html` | Dokumentation des Designs (Tokens, Typografie, Komponenten mit Live-Vorschau). Referenz, nicht verlinkt. |
| `supabase/newsletter.sql` | SQL für die Newsletter-Tabelle inkl. Row Level Security. Wurde im Supabase-Projekt bereits ausgeführt. |
| `Jakow-Profil.pdf` | Quelle für Lebenslauf und Profiltexte. |

Keine Abhängigkeiten, kein `npm`. Zum Ansehen `index.html` im Browser öffnen. Einzige externe Ressource: Google Fonts (Jost, IBM Plex Mono).

## Design (gewählt: dunkles „gertix“-Design)

Vorbild ist https://gertix.studio/. Ein Alternativ-Entwurf nach einem fremden Designsystem (Mandy Kettner) wurde verworfen. **Das bestehende Design beibehalten.**

**Regeln**
1. **Dunkle Bühne, helles Blatt:** Hero und Abschluss (Kontakt/Newsletter) auf `--night`, Inhalte auf `--paper`/`--card-1`.
2. **Licht ist der einzige Akzent:** `--glow` (Orange) nur punktuell (Logo-Slash, Live-Punkt, Ticker-Glyphen, Fokus, Fehlermeldungen, Grafik). Nie als Fläche oder Fließtextfarbe.
3. **Display zeigt, Mono spricht:** Jost 300 in Versalien für Headlines/Zahlen, IBM Plex Mono für Fließtext, Labels, Buttons.
4. **Struktur zeigt Ordnung:** 1px gepunktete Linien, Fadenkreuze (`.xgrid`), Nummern nur bei echten Reihenfolgen. Radius 0, keine Schatten; Pills/Tags mit 999px.

**Wichtige Tokens** (in `:root` von `index.html`)
- Farben: `--night #0e1513`, `--paper #f2f2f0`, `--ink #17181a`, `--glow #ff8a3d`, `--mute #566060`, `--sage #7f8a88`, Kartentöne `--card-1..4` (`#e3e7e6`, `#aab4b2`, `#7d8886`, `#2c3735`), Linien `--line-dark` / `--line-light`, Text auf Dunkel `--paper-soft` / `--paper-dim`
- Schrift: `--font-display` (Jost), `--font-mono` (IBM Plex Mono), Größen `--t-label 11px`, `--t-small 13px`, `--t-body 15px`, `--t-mid`, `--t-lg`, `--t-xl`, `--t-num` (fluid mit `clamp`)
- Layout: `--gutter clamp(16px,4vw,56px)`, `--header-h 60px`, `--strip 76px`, max. Breite 1600px
- Breakpoints: 960 (Toolkit 1-spaltig), 860 (Karten/Köpfe 1-spaltig, Sticky aus), 760 (Hero-Text unten, Stats 2-spaltig), 700 (Kontaktzeilen stapeln), 520 (Uhr aus)

Neue Elemente immer aus diesen Tokens bauen, keine neuen Farben einführen. Vollständige Referenz: `design-system.html`.

## Aufbau von `index.html`

1. Header (fixiert, wechselt hell/dunkel je nach Fläche über `data-tone="dark"`), Menü-Overlay
2. `#top` Hero mit Canvas-Grafik (Glaswürfel als Prisma), Claim **„Problemlöser aus der Zukunft“**, Ticker
3. `#profil` Statement mit Pills + Kennzahlen (14 Jahre, 3 Jahre AI HUB, 15 Köpfe, 4 Sprachen)
4. `#felder` Vier Schwerpunkt-Karten (Sticky-Stapel) mit Canvas-Grafiken
5. `#stationen` Zeitleiste, 9 Stationen 2012–heute
6. `#toolkit` n8n, Anthropic Claude, LangChain; Sprachen; Ausbildung
7. `#kontakt` Über mich, Kontaktzeilen, **`#newsletter` Anmeldeformular**, Footer

JS am Dateiende: Header-Ton, Menü, Uhr (Europe/Berlin), E-Mail kopieren, Newsletter, Canvas-Szenen (laufen nur sichtbar, respektieren `prefers-reduced-motion`).

## Newsletter / Supabase

- Projekt-URL: `https://jyewqmrwdpkihchtauxw.supabase.co`
- Tabelle `public.newsletter_subscribers` (name, email unique + lowercase, consent = true, consented_at, source)
- RLS: Rolle `anon` darf **nur INSERT**, kein Lesen/Ändern/Löschen. Einträge sieht der Nutzer im Supabase-Dashboard → Table Editor.
- Im JS von `index.html`: `SUPABASE_URL`, `SUPABASE_KEY` (Publishable Key, darf öffentlich sein), `SUPABASE_TABLE`. Formular sendet per `fetch` an `/rest/v1/newsletter_subscribers` mit `Prefer: return=minimal`; HTTP 409 = Adresse schon eingetragen.
- **Niemals** den `service_role`- oder `secret`-Key in den Code oder ins Repo schreiben.
- Supabase verschickt keine Mails. Versand und Double-Opt-in brauchen einen eigenen Dienst (z. B. Brevo) – noch nicht umgesetzt.
- Test ohne echten Eintrag: POST mit zu kurzem Namen muss mit Code `23514` (Check-Constraint) scheitern; GET muss `42501` (permission denied) liefern.

## Texte & Tonalität

- Ich-Form, aktiv, konkret, kurze Sätze. Echte Namen und Zahlen statt Superlative.
- Keine Buzzwords („revolutionieren“, „disruptiv“). Buttons sagen, was passiert („Newsletter abonnieren“, „Adresse kopieren“).
- Formate: Zeitraum „Jul 2024 – heute“, Dauer „1 J. 1 M.“, Kennzahlen unter 10 mit führender Null (03), Meta-Trenner „ · “, deutsche Anführungszeichen „…“.
- Rollentitel bleiben im Original (z. B. „Chief Executive Officer“).

## Arbeitsweise

- Änderungen klein halten, bestehende Klassen und Tokens wiederverwenden, Stil des umgebenden Codes übernehmen.
- Nach Änderungen im Browser prüfen: keine Konsolenfehler, kein horizontales Scrollen bei ~375px Breite.
- Git: auf `main` committen und pushen, wenn der Nutzer es verlangt. Commit-Nachrichten auf Deutsch.

## Offene Punkte

- [ ] Datenschutzerklärung und Impressum fehlen (nötig wegen Newsletter; Supabase als Auftragsverarbeiter nennen; EU-Region des Supabase-Projekts prüfen)
- [ ] Newsletter-Versand + Double-Opt-in (z. B. Brevo) anbinden
- [ ] Footer und Hero-Eyebrow noch englisch („Idea Machine & Problem Solver from the Future“, „Idea Machine · AIOps · AI Consultant“) – auf Wunsch eindeutschen
- [ ] Öffentliche Kontaktadresse prüfen (aktuell private Gmail-Adresse aus dem Profil)
- [ ] Optional: GitHub Pages aktivieren → https://themavel.github.io/KI-Development-Woche/
