import { C } from './palette';

export const T = 16;
export const BLOCKED = new Set('#~RHrhSFLbWXPCT'.split(''));
export const ENCOUNTER = new Set([',', 'k']);

const hash = (x: number, y: number) => ((x * 73856093) ^ (y * 19349663)) >>> 0;

type At = (x: number, y: number) => string;

/** Zeichnet eine Kachel in Pixelgrafik. Nur Farben aus den Design-Tokens. */
export function drawTile(g: CanvasRenderingContext2D, at: At, x: number, y: number, X: number, Y: number, t: number, still: boolean) {
  const c = at(x, y);
  const h = hash(x, y);
  const r = (dx: number, dy: number, w: number, hh: number, col: string) => {
    g.fillStyle = col;
    g.fillRect(X + dx, Y + dy, w, hh);
  };
  const ground = () => {
    r(0, 0, T, T, C.c1);
    if (h % 3 === 0) r((h % 13) + 1, ((h >> 4) % 13) + 1, 1, 1, C.c2);
    if (h % 5 === 0) r(((h >> 2) % 13) + 1, ((h >> 6) % 13) + 1, 1, 1, C.c2);
  };
  const floor = () => {
    r(0, 0, T, T, C.paper);
    r(0, 15, T, 1, C.c1);
    r(15, 0, 1, T, C.c1);
  };

  switch (c) {
    case '#':
      r(0, 0, T, T, C.c2);
      r(2, 1, 12, 11, C.c4);
      r(1, 3, 14, 7, C.c4);
      r(4, 3, 3, 2, C.c3);
      r(3, 5, 2, 2, C.c3);
      r(7, 12, 2, 3, C.ink);
      break;
    case ',': {
      r(0, 0, T, T, C.c2);
      const sway = still ? 0 : Math.round(Math.sin(t / 520 + x * 0.7 + y * 0.3));
      for (let i = 0; i < 4; i++) {
        const bx = 1 + ((h >> (i * 3)) % 12);
        const by = 2 + i * 3;
        r(bx + sway, by, 1, 3, C.c3);
        r(bx + 2, by + 1, 1, 2, C.c3);
      }
      break;
    }
    case 'f':
      ground();
      for (let i = 0; i < 3; i++) {
        const fx = 2 + ((h >> (i * 4)) % 10);
        const fy = 3 + i * 4;
        r(fx, fy, 3, 1, C.c3);
        r(fx + 1, fy - 1, 1, 3, C.c3);
        r(fx + 1, fy, 1, 1, i === 0 && h % 4 === 0 ? C.glow : C.paper);
      }
      break;
    case '~': {
      r(0, 0, T, T, C.night);
      const o = still ? 0 : Math.floor(t / 320) % 6;
      r((h + o) % 11, 4, 5, 1, C.sage);
      r((h * 3 + o) % 12, 11, 4, 1, C.c3);
      break;
    }
    case '=':
      r(0, 0, T, T, C.c1);
      r(0, 7, T, 1, C.c2);
      r(y % 2 ? 4 : 12, 0, 1, 7, C.c2);
      r(y % 2 ? 12 : 4, 8, 1, 8, C.c2);
      break;
    case 'R':
      r(0, 0, T, T, C.c4);
      if (at(x, y - 1) !== 'R') r(0, 0, T, 2, C.sage);
      r(0, 8, T, 1, C.mute);
      if (at(x, y + 1) !== 'R') r(0, 14, T, 2, C.ink);
      break;
    case 'H':
      r(0, 0, T, T, C.night);
      r(3, 4, 4, 5, (x + y) % 3 ? C.glow : C.sage);
      r(9, 4, 4, 5, C.sage);
      r(0, 15, T, 1, C.ink);
      break;
    case 'D':
      r(0, 0, T, T, C.night);
      r(3, 3, 10, 13, C.c4);
      r(3, 3, 10, 1, C.paper);
      r(7, 0, 2, 2, C.glow);
      break;
    case 'r':
      r(0, 0, T, T, C.mute);
      r(0, 4, T, 1, C.c3);
      r(0, 10, T, 1, C.c3);
      if (at(x, y + 1) !== 'r') r(0, 14, T, 2, C.ink);
      break;
    case 'h':
      r(0, 0, T, T, C.c2);
      r(0, 0, 1, T, C.c3);
      if (h % 2) {
        r(4, 4, 8, 6, C.ink);
        r(5, 5, 6, 4, C.c1);
        r(8, 5, 1, 4, C.ink);
      }
      break;
    case 'd':
      r(0, 0, T, T, C.c2);
      r(4, 3, 8, 13, C.c4);
      r(10, 9, 1, 1, C.glow);
      break;
    case 'S':
      ground();
      r(7, 8, 2, 7, C.ink);
      r(2, 3, 12, 7, C.ink);
      r(3, 4, 10, 5, C.c2);
      r(4, 5, 6, 1, C.mute);
      r(4, 7, 4, 1, C.mute);
      break;
    case 'F':
      ground();
      r(0, 6, T, 2, C.c4);
      r(0, 11, T, 2, C.c4);
      r(2, 4, 2, 11, C.ink);
      r(12, 4, 2, 11, C.ink);
      break;
    case 'L':
      ground();
      r(7, 4, 2, 11, C.ink);
      r(5, 1, 6, 3, C.ink);
      r(6, 2, 4, 1, C.glow);
      r(5, 14, 6, 2, C.c4);
      break;
    case 'b':
      ground();
      r(1, 6, 14, 3, C.c4);
      r(1, 10, 14, 2, C.c4);
      r(2, 12, 2, 3, C.ink);
      r(12, 12, 2, 3, C.ink);
      break;
    case 'W':
      r(0, 0, T, T, C.c4);
      r(0, 5, T, 1, C.mute);
      r(0, 13, T, 3, C.mute);
      break;
    case '_':
      floor();
      break;
    case 'X': {
      r(0, 0, T, T, C.night);
      r(1, 1, 14, 14, C.c4);
      for (let i = 0; i < 4; i++) r(3, 3 + i * 3, 9, 1, C.ink);
      const blink = still ? 0 : Math.floor(t / 400 + h) % 4;
      r(12, 3 + blink * 3, 1, 1, C.glow);
      r(12, 3 + ((blink + 2) % 4) * 3, 1, 1, C.sage);
      break;
    }
    case 'P':
      floor();
      r(2, 2, 12, 9, C.ink);
      r(3, 3, 10, 7, C.sage);
      r(4, 4, 4, 1, C.paper);
      r(4, 6, 6, 1, C.c1);
      r(11, 8, 1, 1, C.glow);
      r(7, 11, 2, 2, C.ink);
      r(4, 13, 8, 2, C.c4);
      break;
    case 'C':
      r(0, 0, T, T, C.c3);
      r(0, 0, T, 3, C.c2);
      r(0, 15, T, 1, C.ink);
      break;
    case 'T':
      floor();
      r(1, 3, 14, 9, C.c2);
      r(1, 3, 14, 1, C.c1);
      r(2, 12, 2, 3, C.mute);
      r(12, 12, 2, 3, C.mute);
      break;
    case 'M':
      floor();
      r(2, 3, 12, 10, C.c3);
      r(3, 4, 10, 8, C.mute);
      break;
    case 'k':
      floor();
      r(0, 4, T, 1, C.mute);
      r(0, 10, T, 1, C.ink);
      r(((h >> 3) % 12) + 2, 4, 1, 7, C.mute);
      break;
    default:
      ground();
  }
}
