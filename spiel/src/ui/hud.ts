import { game, akkuMax, pad2 } from '../state';
import { TOOLS } from '../data/tools';
import { $, cells, el, reducedMotion, restart, wait } from './dom';

export function hud(mapName?: string) {
  const s = game.s;
  if (mapName !== undefined) $('hudMap').textContent = mapName;
  $('hudLv').textContent = 'Lv ' + pad2(s.level);
  cells($('hudAkku'), s.akku, akkuMax(s.level), s.akku <= 1);
  $('hudTokens').textContent = String(s.tokens);
  $('hudDex').textContent = `${pad2(s.caught.length)} / ${TOOLS.length}`;
  $('hudBadges').textContent = `${s.badges.length} / 3`;
}

let bannerTimer = 0;
export function banner(text: string) {
  const b = $('banner');
  b.textContent = text;
  b.hidden = false;
  restart(b, 'in');
  clearTimeout(bannerTimer);
  bannerTimer = window.setTimeout(() => { b.hidden = true; }, 2400);
}

export function toast(text: string) {
  const t = el('div', 'toast', text);
  $('toasts').append(t);
  setTimeout(() => t.remove(), 3400);
}

export async function fade(on: boolean) {
  $('fade').classList.toggle('on', on);
  await wait(reducedMotion() ? 0 : 280);
}

export async function flash() {
  if (reducedMotion()) return;
  const f = $('flash');
  restart(f, 'go');
  await wait(700);
  f.classList.remove('go');
}
