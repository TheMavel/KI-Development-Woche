export const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}

export function button(label: string, cls: string, onClick: () => void): HTMLButtonElement {
  const b = el('button', cls, label);
  b.type = 'button';
  b.addEventListener('click', onClick);
  return b;
}

export function cells(target: HTMLElement, on: number, total: number, low = false) {
  target.replaceChildren(...Array.from({ length: total }, (_, i) => el('i', i < on ? 'on' : '')));
  target.classList.toggle('low', low);
}

export const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function shuffle<T>(list: T[]): T[] {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function restart(node: HTMLElement, cls: string) {
  node.classList.remove(cls);
  void node.offsetWidth;
  node.classList.add(cls);
}

/** Oberste sichtbare Ebene mit Buttons – dort navigieren die Pfeiltasten. */
export function activeLayer(): HTMLElement | null {
  for (const id of ['choices', 'sheet', 'battle', 'title']) {
    const node = document.getElementById(id);
    if (node && !node.hidden && node.offsetParent !== null) return node;
  }
  return null;
}

function focusables(layer: HTMLElement) {
  return [...layer.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]')].filter((b) => b.offsetParent !== null);
}

export function focusFirst(layer: HTMLElement) {
  focusables(layer)[0]?.focus({ preventScroll: true });
}

addEventListener('keydown', (e) => {
  if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
  if (e.target instanceof Element && e.target.closest('input')) return;
  const layer = activeLayer();
  if (!layer) return;
  const items = focusables(layer);
  if (!items.length) return;
  e.preventDefault();
  const fwd = e.key === 'ArrowDown' || e.key === 'ArrowRight';
  let i = items.indexOf(document.activeElement as HTMLElement);
  i = i < 0 ? 0 : (i + (fwd ? 1 : -1) + items.length) % items.length;
  items[i].focus();
  items[i].scrollIntoView({ block: 'nearest' });
});
