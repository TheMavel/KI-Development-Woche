import { akkuMax, clearSave, game, pad2, persist, saveSettings, xpForNext } from '../state';
import { RARITY, SKILL_TEXT, TOOLS, ZONE_NAMES, type Tool } from '../data/tools';
import { ITEMS, ITEM_ORDER } from '../data/items';
import { BADGES } from '../data/maps';
import { QUESTIONS } from '../data/questions';
import type { Badge } from '../state';
import { toolArt } from '../engine/sprites';
import { audio } from '../engine/audio';
import { $, button, cells, el } from './dom';
import { hud, toast } from './hud';

const root = $('sheet');
const titleEl = $('sheetTitle');
const metaEl = $('sheetMeta');
const body = $('sheetBody');
const backBtn = $('sheetBack');

interface View { title: string; render: (b: HTMLElement) => void }

const stack: View[] = [];
let resolver: (() => void) | null = null;

export const sheetOpen = () => !root.hidden;

backBtn.addEventListener('click', () => back());

export function openSheet(v: View): Promise<void> {
  stack.length = 0;
  stack.push(v);
  root.hidden = false;
  draw();
  return new Promise((r) => { resolver = r; });
}

function push(v: View) {
  audio.sfx('select');
  stack.push(v);
  draw();
}

export function back() {
  audio.sfx('back');
  stack.pop();
  if (stack.length) {
    draw();
    return;
  }
  root.hidden = true;
  (document.activeElement as HTMLElement | null)?.blur();
  hud();
  const r = resolver;
  resolver = null;
  r?.();
}

function draw(keepFocus = false) {
  const v = stack[stack.length - 1];
  const buttons = () => [...body.querySelectorAll<HTMLElement>('button')];
  const focusIndex = keepFocus ? buttons().indexOf(document.activeElement as HTMLElement) : -1;
  titleEl.textContent = v.title;
  backBtn.textContent = stack.length > 1 ? '← Zurück' : 'Schließen';
  metaEl.textContent = `${game.s.tokens} Tokens`;
  body.replaceChildren();
  v.render(body);
  if (!keepFocus) root.scrollTop = 0;
  const list = buttons();
  const target = (focusIndex > -1 ? list[focusIndex] : null) ?? list.find((b) => !(b as HTMLButtonElement).disabled) ?? backBtn;
  target.focus({ preventScroll: keepFocus });
}

const redraw = () => draw(true);

/* ---------- Bausteine ---------- */

function artBox(tool: Tool, mode: 'full' | 'sil' | 'none', big = false) {
  const box = el('div', 'art' + (big ? ' art--big' : ''));
  if (mode !== 'none') box.append(toolArt(tool, mode === 'sil'));
  else box.append(el('span', '', '?'));
  return box;
}

function stat(label: string, value: string | HTMLElement) {
  const d = el('div', 'stat');
  d.append(el('span', 'eyebrow', label));
  if (typeof value === 'string') d.append(el('strong', '', value));
  else d.append(value);
  return d;
}

export const formatTime = (sec: number) => {
  const m = Math.floor(sec / 60);
  const h = Math.floor(m / 60);
  return h ? `${h} Std. ${m % 60} Min.` : `${m} Min.`;
};

/* ---------- Ansichten ---------- */

export function openPause(toTitle: () => void) {
  return openSheet({
    title: 'Menü',
    render(b) {
      const s = game.s;
      const list = el('div', 'menu-list');
      const item = (label: string, meta: string, fn: () => void) => {
        const x = el('button', 'menu-item');
        x.type = 'button';
        x.append(el('span', 'menu-label', label), el('span', 'menu-meta', meta));
        x.addEventListener('click', fn);
        list.append(x);
      };
      const items = ITEM_ORDER.reduce((n, id) => n + s.bag[id], 0);
      item('Weiter spielen', 'Esc', () => back());
      item('Tool-Dex', `${pad2(s.caught.length)} / ${TOOLS.length} gefangen`, () => push(dexView()));
      item('Tasche', `${pad2(items)} Items`, () => push(bagView()));
      item('Trainerpass', `Lv ${pad2(s.level)} · ${s.badges.length} / 3 Plaketten`, () => push(passView()));
      item('Einstellungen', 'Ton, Musik, Timer', () => push(settingsView(true)));
      item('Steuerung', 'Tasten und Tipps', () => push(helpView()));
      item('Zum Titelbildschirm', 'Spielstand wird gespeichert', () => { persist(); toTitle(); });
      b.append(list);
    },
  });
}

export function openDex() {
  return openSheet(dexView());
}

function dexView(): View {
  return {
    title: 'Tool-Dex',
    render(b) {
      const s = game.s;
      const team = el('section', 'team');
      team.append(el('p', 'eyebrow', 'Dein Team · liefert Joker im Kampf'));
      const slots = el('div', 'team-slots');
      for (let i = 0; i < 3; i++) {
        const id = s.team[i];
        const slot = el('div', 'team-slot');
        const t = id ? TOOLS.find((x) => x.id === id) : undefined;
        if (t) slot.append(artBox(t, 'full'), el('strong', '', t.name), el('span', '', t.skillName));
        else slot.append(el('span', 'muted', 'Freier Platz'));
        slots.append(slot);
      }
      team.append(slots);
      b.append(team);

      const grid = el('ul', 'dex-grid');
      TOOLS.forEach((t, i) => {
        const caught = s.caught.includes(t.id);
        const seen = caught || s.seen.includes(t.id);
        const card = el('button', 'dex-card' + (caught ? '' : ' is-locked'));
        card.type = 'button';
        card.append(
          artBox(t, caught ? 'full' : seen ? 'sil' : 'none'),
          el('p', 'eyebrow', `Nr. ${pad2(i + 1)} · ${caught ? t.type : seen ? 'Gesichtet' : ZONE_NAMES[t.zone]}`),
          el('h3', '', seen ? t.name : '???'),
        );
        if (s.team.includes(t.id)) card.append(el('span', 'pill', 'Im Team'));
        card.addEventListener('click', () => push(toolView(t)));
        const li = el('li');
        li.append(card);
        grid.append(li);
      });
      b.append(grid);
    },
  };
}

function toolView(t: Tool): View {
  return {
    title: `Tool-Dex · Nr. ${pad2(TOOLS.indexOf(t) + 1)}`,
    render(b) {
      const s = game.s;
      const caught = s.caught.includes(t.id);
      const seen = caught || s.seen.includes(t.id);
      const wrap = el('article', 'tool-detail');
      wrap.append(artBox(t, caught ? 'full' : seen ? 'sil' : 'none', true));
      const info = el('div', 'tool-info');
      info.append(el('p', 'eyebrow', caught ? `${t.type} · ${t.maker}` : seen ? 'Gesichtet' : 'Unbekannt'));
      info.append(el('h2', 'display', seen ? t.name : '???'));
      if (caught) {
        const pills = el('div', 'pills');
        [t.type, t.maker, RARITY[t.rarity], ZONE_NAMES[t.zone]].forEach((p) => pills.append(el('span', 'pill', p)));
        info.append(pills, el('p', 'lead', t.dex));
        const joker = el('div', 'joker-box');
        joker.append(el('span', 'eyebrow', 'Joker'), el('strong', '', t.skillName), el('p', '', SKILL_TEXT[t.skill]));
        info.append(joker);
        const inTeam = s.team.includes(t.id);
        const full = s.team.length >= 3;
        const tb = button(inTeam ? 'Aus dem Team nehmen' : full ? 'Team ist voll (3 / 3)' : 'Ins Team holen', 'btn btn--solid', () => {
          if (inTeam) s.team = s.team.filter((x) => x !== t.id);
          else if (!full) s.team.push(t.id);
          persist();
          audio.sfx('select');
          redraw();
        });
        tb.disabled = !inTeam && full;
        info.append(tb);
      } else {
        info.append(el('p', 'lead', seen
          ? `Noch nicht gefangen. Lebt in: ${ZONE_NAMES[t.zone]}.`
          : `Noch nicht entdeckt. Tipp: Schau dich in der Gegend „${ZONE_NAMES[t.zone]}“ um.`));
      }
      wrap.append(info);
      b.append(wrap);
    },
  };
}

function bagView(): View {
  return {
    title: 'Tasche',
    render(b) {
      const s = game.s;
      const list = el('ul', 'rows');
      for (const id of ITEM_ORDER) {
        const it = ITEMS[id];
        const li = el('li', 'row');
        const text = el('div');
        text.append(el('strong', '', it.name), el('p', 'muted', it.desc));
        li.append(text, el('span', 'count', `× ${pad2(s.bag[id])}`));
        if (id === 'kaffee') {
          const full = s.akku >= akkuMax(s.level);
          const x = button(full ? 'Akku ist voll' : 'Trinken', 'btn', () => {
            s.bag.kaffee--;
            s.akku = Math.min(akkuMax(s.level), s.akku + 3);
            audio.sfx('item');
            persist();
            hud();
            toast('+3 Akku');
            redraw();
          });
          x.disabled = full || !s.bag.kaffee;
          li.append(x);
        }
        list.append(li);
      }
      b.append(list);
    },
  };
}

function passView(): View {
  return {
    title: 'Trainerpass',
    render(b) {
      const s = game.s;
      const head = el('div', 'pass-head');
      head.append(el('p', 'eyebrow', s.champion ? 'Champion des Rechenzentrums' : 'KI-Tool-Trainer:in'), el('h2', 'display', s.name));
      b.append(head);

      const xp = el('div', 'bar');
      const fillBar = el('i');
      fillBar.style.width = `${Math.round((s.xp / xpForNext(s.level)) * 100)}%`;
      xp.append(fillBar);
      const akku = el('span', 'cells');
      cells(akku, s.akku, akkuMax(s.level), s.akku <= 1);
      const total = s.stats.correct + s.stats.wrong;

      const grid = el('div', 'stats');
      grid.append(
        stat('Level', pad2(s.level)),
        stat(`XP · ${s.xp} / ${xpForNext(s.level)}`, xp),
        stat('Akku', akku),
        stat('Tokens', String(s.tokens)),
        stat('Tool-Dex', `${pad2(s.caught.length)} / ${TOOLS.length}`),
        stat('Richtige Antworten', String(s.stats.correct)),
        stat('Trefferquote', total ? `${Math.round((s.stats.correct / total) * 100)} %` : '–'),
        stat('Spielzeit', formatTime(s.time)),
      );
      b.append(grid);

      const badges = el('div', 'badges');
      (Object.keys(BADGES) as Badge[]).forEach((k) => {
        const has = s.badges.includes(k);
        const card = el('div', 'badge' + (has ? ' is-on' : ''));
        card.append(el('i', 'badge-mark'), el('strong', '', BADGES[k].name), el('span', 'muted', has ? BADGES[k].from : 'Noch offen'));
        badges.append(card);
      });
      b.append(el('p', 'eyebrow section-label', 'Plaketten'), badges);
    },
  };
}

export function settingsView(inGame: boolean): View {
  return {
    title: 'Einstellungen',
    render(b) {
      const list = el('div', 'menu-list');
      const toggle = (key: 'music' | 'sfx' | 'timer', label: string, hint: string) => {
        const on = game.settings[key];
        const x = el('button', 'menu-item toggle');
        x.type = 'button';
        x.setAttribute('aria-pressed', String(on));
        x.append(el('span', 'menu-label', label), el('span', 'menu-meta', `${hint} · ${on ? 'An' : 'Aus'}`));
        x.addEventListener('click', () => {
          game.settings[key] = !on;
          saveSettings();
          audio.apply();
          audio.sfx('select');
          redraw();
        });
        list.append(x);
      };
      toggle('music', 'Musik', 'Chiptune-Soundtrack');
      toggle('sfx', 'Soundeffekte', 'Klicks, Treffer, Jingles');
      toggle('timer', 'Frage-Timer', '30 Sekunden pro Frage');
      b.append(list);
      if (inGame) {
        const danger = button('Spielstand löschen', 'btn btn--danger', () => {
          if (!confirm('Spielstand wirklich löschen? Das lässt sich nicht rückgängig machen.')) return;
          clearSave();
          location.reload();
        });
        b.append(el('p', 'eyebrow section-label', 'Spielstand'), danger);
      }
    },
  };
}

export function helpView(): View {
  return {
    title: 'Steuerung',
    render(b) {
      const rows: [string, string][] = [
        ['Laufen', 'Pfeiltasten oder WASD · auf dem Handy das Steuerkreuz'],
        ['Rennen', 'B-Taste halten (X, Shift oder Backspace)'],
        ['Sprechen, lesen, aufheben', 'A-Taste (Leertaste, Enter, E oder Z)'],
        ['Menü', 'Esc oder M'],
        ['Tool-Dex', 'T'],
        ['Antworten im Quiz', 'Zahlen 1 bis 4, Pfeiltasten oder Klick'],
      ];
      const list = el('ul', 'rows');
      for (const [k, v] of rows) {
        const li = el('li', 'row');
        li.append(el('strong', '', k), el('span', 'muted', v));
        list.append(li);
      }
      b.append(list);
      const tips = el('ul', 'tips');
      [
        'Im hohen Gras begegnen dir wilde KI-Tools. Jede richtige Antwort senkt ihre Skepsis.',
        'Bei null Skepsis fängt jeder Prompt-Ball sicher. Vorher entscheidet das Glück.',
        'Gefangene Tools im Team liefern pro Kampf je einen Joker.',
        'Trainer:innen sehen dich, wenn du in ihre Blickrichtung läufst.',
        'Prof. Prompt im AI HUB lädt deinen Akku kostenlos auf.',
        `Im Spiel stecken ${QUESTIONS.length} Fragen in drei Schwierigkeitsstufen.`,
      ].forEach((t) => tips.append(el('li', '', t)));
      b.append(el('p', 'eyebrow section-label', 'Tipps'), tips);
    },
  };
}

export function openShop() {
  return openSheet({
    title: 'Kiosk im AI HUB',
    render(b) {
      const s = game.s;
      b.append(el('p', 'lead', 'Kim verkauft alles, was du für die Jagd brauchst. Bezahlt wird mit Tokens aus richtigen Antworten.'));
      const list = el('ul', 'rows');
      for (const id of ITEM_ORDER) {
        const it = ITEMS[id];
        const li = el('li', 'row');
        const text = el('div');
        text.append(el('strong', '', it.name), el('p', 'muted', it.desc));
        li.append(text, el('span', 'count', `${it.price} Tokens · im Besitz ${pad2(s.bag[id])}`));
        const x = button('Kaufen', 'btn btn--solid', () => {
          s.tokens -= it.price;
          s.bag[id]++;
          audio.sfx('item');
          persist();
          hud();
          redraw();
        });
        x.disabled = s.tokens < it.price;
        li.append(x);
        list.append(li);
      }
      b.append(list);
    },
  });
}

export function openEnding() {
  return openSheet({
    title: 'Abspann',
    render(b) {
      const s = game.s;
      const hero = el('div', 'ending');
      hero.append(
        el('p', 'eyebrow', 'Rechenzentrum · Düsseldorf'),
        el('h2', 'display display--xl', 'Champion'),
        el('p', 'lead', `${s.name}, du hast den Buzzword-Baron mit echtem Wissen überzeugt. Ab heute wird im Rechenzentrum wieder konkret geredet.`),
      );
      b.append(hero);
      const grid = el('div', 'stats');
      const total = s.stats.correct + s.stats.wrong;
      grid.append(
        stat('Level', pad2(s.level)),
        stat('Tool-Dex', `${pad2(s.caught.length)} / ${TOOLS.length}`),
        stat('Richtige Antworten', String(s.stats.correct)),
        stat('Trefferquote', total ? `${Math.round((s.stats.correct / total) * 100)} %` : '–'),
        stat('Spielzeit', formatTime(s.time)),
      );
      b.append(grid);
      const credits = el('ul', 'tips');
      [
        'Ein Quiz-Abenteuer aus dem STARTPLATZ AI HUB in Düsseldorf.',
        s.caught.length < TOOLS.length ? `Noch ${TOOLS.length - s.caught.length} Tools fehlen in deinem Tool-Dex. Die Jagd geht weiter.` : 'Dein Tool-Dex ist komplett. Respekt.',
      ].forEach((t) => credits.append(el('li', '', t)));
      b.append(credits, button('Weiter spielen', 'btn btn--solid', () => back()));
    },
  });
}
