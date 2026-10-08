import { audio } from '../engine/audio';
import { TOOLS } from '../data/tools';
import { pad2, type Save } from '../state';
import { $, el, focusFirst } from './dom';
import { formatTime, helpView, openSheet, settingsView } from './menus';

const root = $('title');
const menu = $('titleMenu');

export function showTitle(save: Save | null): Promise<'continue' | 'new'> {
  root.hidden = false;
  audio.play('title');
  return new Promise((resolve) => {
    const done = (r: 'continue' | 'new') => {
      audio.sfx('select');
      root.hidden = true;
      resolve(r);
    };
    const item = (label: string, meta: string, solid: boolean, fn: () => void) => {
      const b = el('button', 'title-btn' + (solid ? ' title-btn--solid' : ''));
      b.type = 'button';
      b.append(el('span', '', label));
      if (meta) b.append(el('small', '', meta));
      b.addEventListener('click', fn);
      menu.append(b);
    };
    const sub = async (view: Parameters<typeof openSheet>[0]) => {
      audio.sfx('select');
      await openSheet(view);
      focusFirst(menu);
    };

    menu.replaceChildren();
    if (save) {
      item('Fortsetzen', `${save.name} · Lv ${pad2(save.level)} · ${pad2(save.caught.length)} / ${TOOLS.length} Tools · ${formatTime(save.time)}`, true, () => done('continue'));
    }
    item('Neues Spiel', save ? 'Überschreibt den Spielstand' : 'Dein Abenteuer beginnt im AI HUB', !save, () => {
      if (save && !confirm('Neues Spiel starten? Dein bisheriger Spielstand wird überschrieben.')) return;
      done('new');
    });
    item('Einstellungen', '', false, () => void sub(settingsView(false)));
    item('Steuerung', '', false, () => void sub(helpView()));
    focusFirst(menu);
  });
}
