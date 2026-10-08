import { MAPS, type MapDef, type MapItem, type Npc, type Warp } from './data/maps';
import { BLOCKED, T, drawTile } from './engine/tiles';
import { drawBubble, drawChar, drawItemBall } from './engine/sprites';
import { C } from './engine/palette';
import { audio } from './engine/audio';
import type { Input } from './engine/input';
import { game, type Dir } from './state';

export const VIEW_W = 20;
export const VIEW_H = 12;
export const DIRS: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
export const OPPOSITE: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' };

interface Tween { fx: number; fy: number; t0: number; dur: number; done?: () => void }

export interface NpcRt {
  def: Npc;
  x: number;
  y: number;
  dir: Dir;
  home: { x: number; y: number };
  move: Tween | null;
  next: number;
  bubble: number;
}

/** Karte, Figuren, Bewegung und Darstellung. Spiellogik hängt sich über `onArrive` an. */
export class World {
  map!: MapDef;
  px = 0;
  py = 0;
  dir: Dir = 'down';
  move: Tween | null = null;
  npcs: NpcRt[] = [];
  /** > 0, solange ein Dialog, Kampf oder Menü läuft. */
  lock = 0;
  attract = false;
  onArrive: () => void = () => {};

  private g: CanvasRenderingContext2D;
  private lastBump = 0;
  private still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  constructor(canvas: HTMLCanvasElement, private input: Input) {
    this.g = canvas.getContext('2d')!;
    this.g.imageSmoothingEnabled = false;
  }

  load(id: string, x: number, y: number, dir: Dir) {
    this.map = MAPS[id] ?? MAPS.hub;
    this.px = x;
    this.py = y;
    this.dir = dir;
    this.move = null;
    const now = performance.now();
    this.npcs = this.map.npcs.map((def) => ({
      def, x: def.x, y: def.y, dir: def.dir, home: { x: def.x, y: def.y }, move: null, next: now + 800 + Math.random() * 2000, bubble: 0,
    }));
  }

  get w() { return this.map.rows[0].length; }
  get h() { return this.map.rows.length; }

  tile(x: number, y: number) {
    return this.map.rows[y]?.[x] ?? '#';
  }

  visible(n: NpcRt) {
    const b = n.def.hideIfBadges;
    return !(b && game.s.badges.length >= b);
  }

  npcAt(x: number, y: number) {
    return this.npcs.find((n) => this.visible(n) && n.x === x && n.y === y);
  }

  itemAt(x: number, y: number): MapItem | undefined {
    return this.map.items.find((i) => i.x === x && i.y === y && !game.s.picked.includes(i.id));
  }

  warpAt(x: number, y: number): Warp | undefined {
    return this.map.warps.find((w) => w.x === x && w.y === y);
  }

  solid(x: number, y: number) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return true;
    return BLOCKED.has(this.tile(x, y)) || !!this.npcAt(x, y) || !!this.itemAt(x, y);
  }

  facing(): [number, number] {
    const [dx, dy] = DIRS[this.dir];
    return [this.px + dx, this.py + dy];
  }

  idle() {
    return !this.move && !this.lock;
  }

  update(now: number) {
    if (this.move && now - this.move.t0 >= this.move.dur) {
      this.move = null;
      this.onArrive();
    }
    for (const n of this.npcs) {
      if (n.move && now - n.move.t0 >= n.move.dur) {
        const done = n.move.done;
        n.move = null;
        done?.();
      }
    }
    if (this.attract || this.lock) return;
    this.wander(now);
    if (!this.move) {
      const d = this.input.dir();
      if (d) this.step(d, now);
    }
  }

  private step(d: Dir, now: number) {
    this.dir = d;
    const [dx, dy] = DIRS[d];
    const tx = this.px + dx;
    const ty = this.py + dy;
    if (this.solid(tx, ty)) {
      if (now - this.lastBump > 380) {
        audio.sfx('bump');
        this.lastBump = now;
      }
      return;
    }
    this.move = { fx: this.px, fy: this.py, t0: now, dur: this.input.run ? 100 : 175 };
    this.px = tx;
    this.py = ty;
  }

  private wander(now: number) {
    for (const n of this.npcs) {
      if (!n.def.wander || n.move || now < n.next || !this.visible(n)) continue;
      n.next = now + 1400 + Math.random() * 2600;
      const dirs: Dir[] = ['up', 'down', 'left', 'right'];
      const d = dirs[Math.floor(Math.random() * 4)];
      n.dir = d;
      if (Math.random() < 0.45) continue;
      const [dx, dy] = DIRS[d];
      const tx = n.x + dx;
      const ty = n.y + dy;
      if (Math.abs(tx - n.home.x) > 2 || Math.abs(ty - n.home.y) > 2) continue;
      if (this.solid(tx, ty) || (tx === this.px && ty === this.py) || this.warpAt(tx, ty)) continue;
      n.move = { fx: n.x, fy: n.y, t0: now, dur: 280 };
      n.x = tx;
      n.y = ty;
    }
  }

  npcStep(n: NpcRt, d: Dir): Promise<void> {
    return new Promise((done) => {
      const [dx, dy] = DIRS[d];
      n.dir = d;
      n.move = { fx: n.x, fy: n.y, t0: performance.now(), dur: 200, done };
      n.x += dx;
      n.y += dy;
    });
  }

  /** Trainer läuft geradeaus bis vor die Spielfigur, dann schauen sich beide an. */
  async walkToPlayer(n: NpcRt) {
    while (Math.abs(n.x - this.px) + Math.abs(n.y - this.py) > 1) {
      const d: Dir = n.x < this.px ? 'right' : n.x > this.px ? 'left' : n.y < this.py ? 'down' : 'up';
      await this.npcStep(n, d);
    }
    this.faceEachOther(n);
  }

  faceEachOther(n: NpcRt) {
    const d: Dir = n.x < this.px ? 'right' : n.x > this.px ? 'left' : n.y < this.py ? 'down' : 'up';
    n.dir = d;
    this.dir = OPPOSITE[d];
  }

  /** Trainer, der die Spielfigur in seiner Blickrichtung sieht. */
  spotter(): NpcRt | undefined {
    for (const n of this.npcs) {
      const tr = n.def.trainer;
      if (!tr || !this.visible(n) || game.s.defeated.includes(tr.id) || n.move) continue;
      const [dx, dy] = DIRS[n.dir];
      for (let i = 1; i <= tr.sight; i++) {
        const x = n.x + dx * i;
        const y = n.y + dy * i;
        if (x === this.px && y === this.py) return n;
        if (BLOCKED.has(this.tile(x, y)) || this.npcAt(x, y) || this.itemAt(x, y)) break;
      }
    }
    return undefined;
  }

  render(now: number) {
    const g = this.g;
    g.fillStyle = C.night;
    g.fillRect(0, 0, VIEW_W * T, VIEW_H * T);
    if (!this.map) return;

    const p = this.lerp(this.px, this.py, this.move, now);
    let cx: number;
    let cy: number;
    if (this.attract) {
      const k = now / 9000;
      cx = (Math.sin(k) * 0.5 + 0.5) * Math.max(0, this.w - VIEW_W);
      cy = (Math.cos(k * 0.7) * 0.5 + 0.5) * Math.max(0, this.h - VIEW_H);
    } else {
      cx = this.cam(p.x + 0.5 - VIEW_W / 2, this.w, VIEW_W);
      cy = this.cam(p.y + 0.5 - VIEW_H / 2, this.h, VIEW_H);
    }
    const ox = Math.round(-cx * T);
    const oy = Math.round(-cy * T);
    const at = (x: number, y: number) => this.tile(x, y);
    const x0 = Math.max(0, Math.floor(cx));
    const y0 = Math.max(0, Math.floor(cy));
    const x1 = Math.min(this.w - 1, Math.ceil(cx + VIEW_W));
    const y1 = Math.min(this.h - 1, Math.ceil(cy + VIEW_H));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) drawTile(g, at, x, y, ox + x * T, oy + y * T, now, this.still);

    for (const it of this.map.items) {
      if (!game.s.picked.includes(it.id)) drawItemBall(g, ox + it.x * T, oy + it.y * T);
    }

    const ents: { y: number; draw: () => void }[] = [];
    for (const n of this.npcs) {
      if (!this.visible(n)) continue;
      const q = this.lerp(n.x, n.y, n.move, now);
      const X = ox + Math.round(q.x * T);
      const Y = oy + Math.round(q.y * T);
      ents.push({ y: q.y, draw: () => {
        drawChar(g, X, Y, n.def.look, n.dir, q.walking);
        if (!n.move) this.grassOver(n.x, n.y, X, Y);
        if (n.bubble > now) drawBubble(g, X, Y);
      } });
    }
    if (!this.attract) {
      const X = ox + Math.round(p.x * T);
      const Y = oy + Math.round(p.y * T);
      ents.push({ y: p.y, draw: () => {
        drawChar(g, X, Y, 'player', this.dir, p.walking);
        if (!this.move) this.grassOver(this.px, this.py, X, Y);
      } });
    }
    ents.sort((a, b) => a.y - b.y).forEach((e) => e.draw());
  }

  /** Gras vor den Füßen, damit Figuren „im“ Gras stehen. */
  private grassOver(tx: number, ty: number, X: number, Y: number) {
    if (this.tile(tx, ty) !== ',') return;
    const g = this.g;
    g.fillStyle = C.c3;
    for (let i = 0; i < 5; i++) g.fillRect(X + 2 + i * 3, Y + 12 + (i % 2), 1, 4 - (i % 2));
  }

  private cam(c: number, size: number, view: number) {
    if (size <= view) return -(view - size) / 2;
    return Math.max(0, Math.min(size - view, c));
  }

  private lerp(x: number, y: number, mv: Tween | null, now: number) {
    if (!mv) return { x, y, walking: false };
    const k = Math.min(1, (now - mv.t0) / mv.dur);
    return { x: mv.fx + (x - mv.fx) * k, y: mv.fy + (y - mv.fy) * k, walking: k > 0.2 && k < 0.8 };
  }
}
