import type { ItemId } from './data/items';

export type Dir = 'up' | 'down' | 'left' | 'right';
export type Badge = 'prompt' | 'pixel' | 'workflow';

export interface Settings {
  music: boolean;
  sfx: boolean;
  timer: boolean;
}

export interface Save {
  v: 1;
  name: string;
  map: string;
  x: number;
  y: number;
  dir: Dir;
  akku: number;
  level: number;
  xp: number;
  tokens: number;
  bag: Record<ItemId, number>;
  caught: string[];
  seen: string[];
  team: string[];
  badges: Badge[];
  defeated: string[];
  picked: string[];
  flags: Record<string, boolean>;
  asked: string[];
  stats: { correct: number; wrong: number; caught: number; battles: number };
  time: number;
  champion: boolean;
}

const SAVE_KEY = 'tooldex-save-v1';
const SETTINGS_KEY = 'tooldex-settings-v1';

export const START = { map: 'hub_inside', x: 6, y: 6, dir: 'up' as Dir };

export function fresh(name: string): Save {
  return {
    v: 1, name, map: START.map, x: START.x, y: START.y, dir: START.dir,
    akku: 5, level: 1, xp: 0, tokens: 50,
    bag: { ball: 0, superball: 0, kaffee: 1 },
    caught: [], seen: [], team: [], badges: [], defeated: [], picked: [], flags: {}, asked: [],
    stats: { correct: 0, wrong: 0, caught: 0, battles: 0 },
    time: 0, champion: false,
  };
}

function loadSettings(): Settings {
  const base: Settings = { music: true, sfx: true, timer: true };
  try {
    return { ...base, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
  } catch {
    return base;
  }
}

export const game: { s: Save; settings: Settings } = { s: fresh(''), settings: loadSettings() };

export function loadSave(): Save | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (!d || d.v !== 1) return null;
    const base = fresh(d.name || 'Alex');
    return { ...base, ...d, bag: { ...base.bag, ...d.bag }, stats: { ...base.stats, ...d.stats }, flags: { ...d.flags } };
  } catch {
    return null;
  }
}

export function persist() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(game.s)); } catch { /* Speicher nicht verfügbar */ }
}

export function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch { /* Speicher nicht verfügbar */ }
}

export function saveSettings() {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(game.settings)); } catch { /* Speicher nicht verfügbar */ }
}

export const akkuMax = (level: number) => Math.min(10, 4 + level);
export const xpForNext = (level: number) => level * 60;

/** Vergibt XP und gibt die Zahl der Level-ups zurück. */
export function gainXp(n: number): number {
  const s = game.s;
  s.xp += n;
  let ups = 0;
  while (s.xp >= xpForNext(s.level)) {
    s.xp -= xpForNext(s.level);
    s.level++;
    ups++;
    s.akku = Math.min(akkuMax(s.level), s.akku + 1);
  }
  return ups;
}

export const pad2 = (n: number) => String(n).padStart(2, '0');
export const fill = (text: string) => text.split('{name}').join(game.s.name);
