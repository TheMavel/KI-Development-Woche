import { C } from './palette';
import type { Tool } from '../data/tools';
import type { Look } from '../data/maps';
import type { Dir } from '../state';

/* ---------- KI-Tools: symmetrische Pixel-Wesen, deterministisch aus der ID ---------- */

// Halbe Schablonen (6 × 12): 0 leer · 1 zufällig · 2 immer Körper
const TEMPLATES: number[][][] = [
  [[0,0,0,0,0,0],[0,0,0,0,1,1],[0,0,0,1,1,2],[0,0,1,1,2,2],[0,0,1,2,2,2],[0,1,1,2,2,2],
   [0,1,2,2,2,2],[1,1,2,2,2,2],[0,1,1,2,2,2],[0,0,1,1,2,2],[0,0,1,0,1,1],[0,0,1,0,0,0]],
  [[0,0,0,0,1,1],[0,0,0,1,2,2],[0,0,1,2,2,2],[0,0,1,2,2,2],[0,0,1,2,2,2],[0,1,1,2,2,2],
   [0,1,2,2,2,2],[0,1,2,2,2,2],[0,1,2,2,2,2],[0,1,1,2,2,2],[0,1,0,1,0,1],[0,0,0,0,0,0]],
  [[0,0,0,0,0,0],[1,0,0,0,0,0],[1,1,0,0,0,0],[0,1,1,1,2,2],[0,1,2,2,2,2],[1,1,2,2,2,2],
   [1,2,2,2,2,2],[1,2,2,2,2,2],[0,1,2,2,2,2],[0,1,1,2,2,1],[0,1,1,0,1,1],[0,1,0,0,0,0]],
];

const BODY: Record<string, keyof typeof C> = {
  Sprache: 'c3', Suche: 'sage', 'Übersetzung': 'c2', Bild: 'c2', Video: 'mute', Musik: 'sage', Audio: 'mute',
  Automation: 'c4', Framework: 'sage', Code: 'c4', Hub: 'c3', 'Open Weights': 'c3', Lokal: 'mute',
};

function seeded(str: string) {
  let h = 2166136261;
  for (const ch of str) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 10000) / 10000;
  };
}

const grids = new Map<string, number[][]>();

function grid(tool: Tool): number[][] {
  const cached = grids.get(tool.id);
  if (cached) return cached;
  const rnd = seeded(tool.id);
  const tpl = TEMPLATES[Math.floor(rnd() * TEMPLATES.length)];
  const g: number[][] = tpl.map((row) => {
    const half: number[] = row.map((v) => (v === 2 ? 1 : v === 1 ? (rnd() < 0.55 ? 1 : 0) : 0));
    return half.concat(half.slice().reverse());
  });
  // Eingeschlossene Lücken füllen, damit der Körper geschlossen wirkt
  const out = g.map((r) => r.map(() => false));
  const stack: [number, number][] = [];
  for (let i = 0; i < 12; i++) stack.push([i, 0], [i, 11], [0, i], [11, i]);
  while (stack.length) {
    const [x, y] = stack.pop()!;
    if (x < 0 || y < 0 || x > 11 || y > 11 || out[y][x] || g[y][x]) continue;
    out[y][x] = true;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  g.forEach((r, y) => r.forEach((v, x) => { if (!v && !out[y][x]) r[x] = 1; }));
  const ey = 4 + Math.floor(rnd() * 2);
  const ex = 3 + Math.floor(rnd() * 2);
  g[ey][ex] = 2;
  g[ey][11 - ex] = 2;
  grids.set(tool.id, g);
  return g;
}

const canvases = new Map<string, HTMLCanvasElement>();

/** 16 × 16 Canvas eines Tools; `silhouette` für gesichtete, aber nicht gefangene Tools. */
export function toolCanvas(tool: Tool, silhouette: boolean): HTMLCanvasElement {
  const key = tool.id + (silhouette ? ':s' : '');
  const cached = canvases.get(key);
  if (cached) return cached;
  const cv = document.createElement('canvas');
  cv.width = cv.height = 16;
  const c = cv.getContext('2d')!;
  const g = grid(tool);
  const body = C[BODY[tool.type] ?? 'c3'];
  const filled = (x: number, y: number) => y >= 0 && y < 12 && x >= 0 && x < 12 && g[y][x] > 0;
  const px = (x: number, y: number, col: string) => {
    c.fillStyle = col;
    c.fillRect(x + 2, y + 3, 1, 1);
  };
  for (let y = -1; y <= 12; y++) {
    for (let x = -1; x <= 12; x++) {
      if (filled(x, y)) px(x, y, silhouette ? C.c3 : g[y][x] === 2 ? C.glow : body);
      else if (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1)) px(x, y, silhouette ? C.c3 : C.ink);
    }
  }
  if (!silhouette && (body === C.c4 || body === C.mute)) {
    // Glanzlicht, damit dunkle Tools nicht im Umriss verschwinden
    for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) if (g[y][x] === 1 && !filled(x, y - 1)) px(x, y, C.c2);
  }
  if (tool.rarity === 3 && !silhouette) {
    // Seltene Tools tragen eine Krone
    c.fillStyle = C.ink;
    c.fillRect(5, 0, 6, 3);
    c.fillStyle = C.paper;
    c.fillRect(6, 1, 1, 1);
    c.fillRect(9, 1, 1, 1);
    c.fillRect(6, 2, 4, 1);
  }
  canvases.set(key, cv);
  return cv;
}

/** Neues Canvas mit der Tool-Grafik (für DOM-Listen, da ein Canvas nur einmal eingehängt werden kann). */
export function toolArt(tool: Tool, silhouette = false): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 16;
  cv.getContext('2d')!.drawImage(toolCanvas(tool, silhouette), 0, 0);
  return cv;
}

/* ---------- Figuren auf der Karte ---------- */

interface Outfit { hair: string; body: string; legs: string; accent?: string; cap?: boolean }

const outfit = (look: Look): Outfit => {
  switch (look) {
    case 'player': return { hair: C.ink, body: C.c4, legs: C.ink, accent: C.glow, cap: true };
    case 'prof': return { hair: C.c2, body: C.paper, legs: C.mute };
    case 'clerk': return { hair: C.mute, body: C.sage, legs: C.ink, cap: true };
    case 'kid': return { hair: C.mute, body: C.c2, legs: C.c4 };
    case 'elder': return { hair: C.paper, body: C.mute, legs: C.c4 };
    case 'student': return { hair: C.c4, body: C.c3, legs: C.ink, cap: true };
    case 'hype': return { hair: C.ink, body: C.paper, legs: C.ink, accent: C.glow };
    case 'trainer': return { hair: C.c4, body: C.sage, legs: C.ink, accent: C.paper, cap: true };
    case 'artist': return { hair: C.ink, body: C.c2, legs: C.mute, cap: true };
    case 'dev': return { hair: C.c4, body: C.ink, legs: C.c4 };
    case 'boss': return { hair: C.ink, body: C.ink, legs: C.ink, accent: C.glow, cap: true };
    default: return { hair: C.c4, body: C.c3, legs: C.ink };
  }
};

export function drawChar(g: CanvasRenderingContext2D, X: number, Y: number, look: Look, dir: Dir, walking: boolean) {
  const r = (x: number, y: number, w: number, h: number, col: string) => {
    g.fillStyle = col;
    g.fillRect(X + x, Y + y, w, h);
  };
  const lift = walking ? -1 : 0;
  r(3, 15, 10, 1, C.c3);

  if (look === 'bot') {
    r(7, -2 + lift, 2, 3, C.ink);
    r(7, -3 + lift, 2, 1, C.glow);
    r(4, 1 + lift, 8, 1, C.ink);
    r(3, 2 + lift, 1, 7, C.ink);
    r(12, 2 + lift, 1, 7, C.ink);
    r(4, 2 + lift, 8, 7, C.c2);
    if (dir !== 'up') r(dir === 'left' ? 5 : dir === 'right' ? 8 : 6, 5 + lift, 3, 2, C.glow);
    r(4, 9 + lift, 8, 1, C.ink);
    r(5, 10 + lift, 6, 3, C.c3);
    r(4, 13, 8, 2, C.ink);
    return;
  }

  const o = outfit(look);
  r(4, 0 + lift, 8, 1, C.ink);
  r(3, 1 + lift, 1, 8, C.ink);
  r(12, 1 + lift, 1, 8, C.ink);
  r(4, 1 + lift, 8, 3, o.hair);
  r(4, 4 + lift, 8, 5, C.paper);
  if (dir === 'up') {
    r(4, 4 + lift, 8, 3, o.hair);
  } else {
    const ox = dir === 'left' ? -1 : dir === 'right' ? 1 : 0;
    r(6 + ox, 6 + lift, 1, 2, C.ink);
    r(9 + ox, 6 + lift, 1, 2, C.ink);
  }
  if (o.cap && dir !== 'up') r(dir === 'left' ? 2 : dir === 'right' ? 8 : 4, 3 + lift, 6, 1, o.hair);
  if (o.accent) r(dir === 'left' ? 4 : dir === 'right' ? 10 : 7, 1 + lift, 2, 1, o.accent);
  r(4, 9 + lift, 8, 1, C.ink);
  r(4, 10 + lift, 8, 3, o.body);
  r(3, 10 + lift, 1, 3, C.ink);
  r(12, 10 + lift, 1, 3, C.ink);
  const step = walking ? 1 : 0;
  r(5, 13, 2, 2 + step, o.legs);
  r(9, 13, 2, 3 - step, o.legs);
}

/** Prompt-Ball, der auf dem Boden liegt. */
export function drawItemBall(g: CanvasRenderingContext2D, X: number, Y: number) {
  const r = (x: number, y: number, w: number, h: number, col: string) => {
    g.fillStyle = col;
    g.fillRect(X + x, Y + y, w, h);
  };
  r(6, 4, 4, 1, C.ink);
  r(5, 5, 6, 6, C.ink);
  r(6, 11, 4, 1, C.ink);
  r(6, 5, 4, 3, C.c4);
  r(6, 8, 4, 3, C.paper);
  r(7, 7, 2, 2, C.glow);
  r(4, 13, 8, 1, C.c3);
}

/** Ausrufezeichen über einer Figur, wenn ein Trainer dich entdeckt. */
export function drawBubble(g: CanvasRenderingContext2D, X: number, Y: number) {
  const r = (x: number, y: number, w: number, h: number, col: string) => {
    g.fillStyle = col;
    g.fillRect(X + x, Y + y, w, h);
  };
  r(4, -13, 8, 11, C.ink);
  r(5, -12, 6, 9, C.paper);
  r(7, -11, 2, 5, C.glow);
  r(7, -5, 2, 1, C.glow);
}
