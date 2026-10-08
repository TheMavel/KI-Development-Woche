import type { Dir } from '../state';

export type Action = 'a' | 'b' | 'menu' | 'dex';

const KEYS: Record<string, Dir | Action> = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  w: 'up', s: 'down', a: 'left', d: 'right',
  ' ': 'a', Enter: 'a', e: 'a', z: 'a',
  x: 'b', Backspace: 'b', Shift: 'b',
  Escape: 'menu', m: 'menu',
  t: 'dex',
};
const DIRS = new Set<string>(['up', 'down', 'left', 'right']);

/** Tastatur und Touch-Steuerung. Richtungen werden gehalten, Aktionen als Ereignis gemeldet. */
export class Input {
  private held: Dir[] = [];
  private bKey = false;
  private bTouch = false;
  private subs: ((a: Action) => void)[] = [];

  constructor() {
    addEventListener('keydown', (e) => this.down(e));
    addEventListener('keyup', (e) => this.up(e));
    addEventListener('blur', () => this.clear());
  }

  get run() {
    return this.bKey || this.bTouch;
  }

  dir(): Dir | undefined {
    return this.held[this.held.length - 1];
  }

  on(fn: (a: Action) => void) {
    this.subs.push(fn);
  }

  emit(a: Action) {
    for (const f of this.subs) f(a);
  }

  clear() {
    this.held.length = 0;
    this.bKey = this.bTouch = false;
  }

  private map(e: KeyboardEvent) {
    return KEYS[e.key.length === 1 ? e.key.toLowerCase() : e.key];
  }

  private down(e: KeyboardEvent) {
    const target = e.target instanceof Element ? e.target : document.body;
    if (target.closest('input, textarea, select')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = this.map(e);
    if (!k) return;
    // Enter/Leertaste auf Buttons lösen den nativen Klick aus
    if (target.closest('button, a') && (e.key === 'Enter' || e.key === ' ')) return;
    e.preventDefault();
    if (DIRS.has(k)) {
      if (!this.held.includes(k as Dir)) this.held.push(k as Dir);
      return;
    }
    if (k === 'b') this.bKey = true;
    if (e.repeat) return;
    this.emit(k as Action);
  }

  private up(e: KeyboardEvent) {
    const k = this.map(e);
    if (!k) return;
    if (k === 'b') this.bKey = false;
    const i = this.held.indexOf(k as Dir);
    if (i > -1) this.held.splice(i, 1);
  }

  bindTouch(root: HTMLElement) {
    root.querySelectorAll<HTMLButtonElement>('button').forEach((b) => {
      const dir = b.dataset.dir as Dir | undefined;
      const act = b.dataset.act as Action | undefined;
      const press = (e: PointerEvent) => {
        e.preventDefault();
        b.setPointerCapture?.(e.pointerId);
        b.classList.add('on');
        if (dir && !this.held.includes(dir)) this.held.push(dir);
        if (act === 'b') this.bTouch = true;
        if (act) this.emit(act);
      };
      const release = () => {
        b.classList.remove('on');
        if (dir) {
          const i = this.held.indexOf(dir);
          if (i > -1) this.held.splice(i, 1);
        }
        if (act === 'b') this.bTouch = false;
      };
      b.addEventListener('pointerdown', press);
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((ev) => b.addEventListener(ev, release));
      b.addEventListener('contextmenu', (e) => e.preventDefault());
    });
  }
}
