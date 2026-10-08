import './style.css';
import { readPalette } from './engine/palette';
import { audio } from './engine/audio';
import { Input, type Action } from './engine/input';
import { ENCOUNTER } from './engine/tiles';
import { World, DIRS, OPPOSITE, type NpcRt } from './world';
import { BADGES, type Trainer } from './data/maps';
import { ITEMS } from './data/items';
import { SKILL_TEXT, TOOLS, toolById } from './data/tools';
import { QUESTIONS } from './data/questions';
import { akkuMax, fresh, game, loadSave, persist, START } from './state';
import { $, activeLayer, wait } from './ui/dom';
import { advance, ask, askName, cancelChoice, dialog, say } from './ui/dialog';
import { banner, fade, flash, hud, toast } from './ui/hud';
import { battleOpen, trainerBattle, wildBattle } from './ui/battle';
import { back, openDex, openEnding, openPause, openShop, sheetOpen } from './ui/menus';
import { showTitle } from './ui/title';

readPalette();
$('titleFoot').textContent = `${TOOLS.length} Tools · ${QUESTIONS.length} Fragen · 3 Plaketten · 1 Endgegner`;

const input = new Input();
input.bindTouch($('touch'));
const world = new World($<HTMLCanvasElement>('world'), input);
let playing = false;

/* ---------- Hilfen ---------- */

/** Führt einen Ablauf aus, während die Welt gesperrt ist. */
async function script(fn: () => Promise<void> | void) {
  world.lock++;
  input.clear();
  try {
    await fn();
  } finally {
    world.lock--;
  }
}

function syncSave() {
  const s = game.s;
  s.map = world.map.id;
  s.x = world.px;
  s.y = world.py;
  s.dir = world.dir;
}

function enterMap(id: string, x: number, y: number, dir: typeof world.dir) {
  world.load(id, x, y, dir);
  syncSave();
  audio.play(world.map.music);
  hud(world.map.name);
}

function nextGoal(): string {
  const s = game.s;
  if (!s.badges.includes('prompt')) return 'Dein nächstes Ziel: Prompt-Paula im Norden der Prompt-Wiese.';
  if (!s.badges.includes('pixel')) return 'Dein nächstes Ziel: Pixel-Pia im Pixel-Park östlich der Stadt.';
  if (!s.badges.includes('workflow')) return 'Dein nächstes Ziel: Workflow-Werner im Automations-Wald südlich der Stadt.';
  if (!s.champion) return 'Mit drei Plaketten kommst du ins Rechenzentrum. Der Buzzword-Baron wartet.';
  const left = TOOLS.length - s.caught.length;
  return left ? `Dir fehlen noch ${left} Tools im Tool-Dex.` : 'Champion und kompletter Tool-Dex. Du bist offiziell KI-Meister:in!';
}

/* ---------- Story ---------- */

async function intro() {
  const s = game.s;
  const prof = 'Prof. Prompt';
  await say(['Ah, da bist du ja! Willkommen im STARTPLATZ AI HUB in Düsseldorf.', 'Ich bin Prof. Prompt. Ich erforsche wilde KI-Tools.'], prof);
  s.name = await askName('Alex');
  await say([
    'Schön, dich kennenzulernen, {name}!',
    `Draußen im hohen Gras leben ${TOOLS.length} KI-Tools. Jedes ist skeptisch, bis du es mit Wissen überzeugst.`,
    'Damit du nicht allein losziehst, schenke ich dir ein erstes Tool.',
  ], prof);
  const starters = ['chatgpt', 'perplexity', 'n8n'];
  const pick = await ask('Welches Tool nimmst du mit?', starters.map((id) => `${toolById(id).name} · ${toolById(id).skillName}`), prof, false);
  const t = toolById(starters[pick]);
  s.caught.push(t.id);
  s.seen.push(t.id);
  s.team.push(t.id);
  s.stats.caught++;
  s.bag.ball += 5;
  audio.jingle('catch');
  hud();
  await say([
    `${t.name}, gute Wahl! Im Kampf kannst du einmal pro Kampf seinen Joker einsetzen: ${SKILL_TEXT[t.skill]}`,
    'Dazu bekommst du 5 Prompt-Bälle.',
    'So funktioniert es: Richtige Antworten senken die Skepsis eines Tools. Dann wirfst du einen Ball. Falsche Antworten kosten Akku.',
    'Wird dein Akku leer, bringt man dich zu mir zurück. Ich lade dich jederzeit auf.',
    'Drei Trainer:innen vergeben Plaketten: Paula im Norden, Pia im Osten, Werner im Süden. Mit allen dreien kommst du ins Rechenzentrum.',
    'Mit Esc öffnest du das Menü. Viel Erfolg!',
  ], prof);
  s.flags.intro = true;
  persist();
}

async function lose() {
  const s = game.s;
  await say(['Dein Akku ist leer …', 'Du schleppst dich zurück zum AI HUB.']);
  await fade(true);
  const lost = Math.floor(s.tokens * 0.1);
  s.tokens -= lost;
  s.akku = akkuMax(s.level);
  enterMap('hub_inside', 3, 4, 'up');
  persist();
  await fade(false);
  await say(['Da bist du ja wieder. Ich habe deinen Akku aufgeladen.', lost ? `Auf dem Rückweg sind ${lost} Tokens verloren gegangen. Kopf hoch!` : 'Kopf hoch, beim nächsten Mal klappt es!'], 'Prof. Prompt');
}

async function trainerFight(n: NpcRt, tr: Trainer, spotted: boolean) {
  const s = game.s;
  if (spotted) {
    n.bubble = performance.now() + 800;
    audio.sfx('spot');
    await wait(800);
    await world.walkToPlayer(n);
  } else {
    world.faceEachOther(n);
  }
  await say(tr.intro, n.def.name);
  await flash();
  const res = await trainerBattle(tr, n.def.name);
  audio.play(world.map.music);
  if (res === 'lost') {
    await lose();
    return;
  }
  s.defeated.push(tr.id);
  persist();
  await say(tr.win, n.def.name);
  if (tr.badge && !s.badges.includes(tr.badge)) {
    s.badges.push(tr.badge);
    persist();
    hud();
    audio.jingle('badge');
    toast(`${BADGES[tr.badge].name} erhalten`);
    await say(`Du erhältst die ${BADGES[tr.badge].name}! (${s.badges.length} von 3)`);
    if (s.badges.length === 3) await say('Alle drei Plaketten! Der Security-Bot im Automations-Wald lässt dich jetzt ins Rechenzentrum.');
  }
  if (tr.boss && !s.champion) {
    s.champion = true;
    persist();
    audio.jingle('victory');
    await openEnding();
  }
}

async function talk(n: NpcRt) {
  const s = game.s;
  const def = n.def;
  if (!def.trainer) n.dir = OPPOSITE[world.dir];
  if (def.trainer) {
    if (s.defeated.includes(def.trainer.id)) {
      world.faceEachOther(n);
      await say(def.trainer.after, def.name);
    } else {
      await trainerFight(n, def.trainer, false);
    }
    return;
  }
  switch (def.action) {
    case 'heal': {
      const c = await ask('Soll ich deinen Akku aufladen?', ['Ja, bitte', 'Nein, danke'], def.name);
      if (c === 0) {
        s.akku = akkuMax(s.level);
        audio.jingle('heal');
        hud();
        persist();
        await say(['Fertig, voll aufgeladen!', nextGoal()], def.name);
      } else {
        await say(nextGoal(), def.name);
      }
      return;
    }
    case 'shop':
      await say('Willkommen am Kiosk! Schau dich um.', def.name);
      await openShop();
      await say('Danke und viel Erfolg da draußen!', def.name);
      return;
    case 'ada':
      if (!s.flags.ada) {
        await say(['Hallo, {name}. Ich heiße Ada, wie Ada Lovelace.', 'Die hat schon 1843 beschrieben, dass Maschinen mehr können als rechnen.', 'Hier, nimm zwei Kaffee mit. Wissen braucht Energie.'], def.name);
        s.bag.kaffee += 2;
        s.flags.ada = true;
        audio.sfx('item');
        toast('+2 Kaffee');
        persist();
      } else {
        await say(['Trink deinen Kaffee, solange er warm ist.', 'Und denk dran: Ein Tool ist nur so gut wie die Frage, die man ihm stellt.'], def.name);
      }
      return;
    case 'kai':
      if (!s.flags.kai) {
        await say(['Hey, ich bin Kai. Ich baue Automationen für den AI HUB.', 'Kleiner Tipp: Im Menü unter Tool-Dex stellst du dein Team zusammen. Jedes Tool im Team bringt einen Joker mit.', 'Und hier, drei Prompt-Bälle für den Start.'], def.name);
        s.bag.ball += 3;
        s.flags.kai = true;
        audio.sfx('item');
        toast('+3 Prompt-Bälle');
        persist();
      } else {
        await say(['n8n, Make und Zapier lassen die nächste richtige Antwort doppelt zählen. Ideal gegen zähe Gegner.'], def.name);
      }
      return;
    case 'bot':
      await say(['Piep. Zutritt zum Rechenzentrum nur mit drei Plaketten.', `Du hast ${s.badges.length} von 3.`], def.name);
      return;
  }
  await say(def.lines ?? ['…'], def.name);
}

async function interact() {
  const [fx, fy] = world.facing();
  let n = world.npcAt(fx, fy);
  if (!n && world.tile(fx, fy) === 'C') {
    const [dx, dy] = DIRS[world.dir];
    n = world.npcAt(fx + dx, fy + dy);
  }
  if (n) return script(() => talk(n));

  const it = world.itemAt(fx, fy);
  if (it) {
    return script(async () => {
      game.s.picked.push(it.id);
      game.s.bag[it.item] += it.n;
      persist();
      audio.sfx('item');
      await say(`Du findest ${it.n} × ${ITEMS[it.item].name}.`);
    });
  }

  const sign = world.map.signs[`${fx},${fy}`];
  if (sign) return script(() => say(sign));

  const ch = world.tile(fx, fy);
  if (ch === 'P') return script(async () => { await say('Die Tool-Box startet …'); await openDex(); });
  if (ch === 'X') {
    return script(() => say(world.map.id === 'rechenzentrum'
      ? 'Ein Server-Rack. Die Lämpchen blinken im Takt der Anfragen.'
      : 'Ein Regal voller Fachbücher: „Deep Learning“, „Prompt Engineering“, „KI im Mittelstand“.'));
  }
  if (ch === '~') return script(() => say('Das Wasser glitzert in der Sonne.'));
}

/* ---------- Ereignisse beim Betreten einer Kachel ---------- */

world.onArrive = () => {
  syncSave();
  const s = game.s;
  const warp = world.warpAt(world.px, world.py);
  if (warp) {
    void script(async () => {
      audio.sfx('door');
      await fade(true);
      const prev = world.map.name;
      enterMap(warp.to, warp.tx, warp.ty, warp.dir);
      persist();
      await fade(false);
      if (world.map.name !== prev) banner(world.map.name);
    });
    return;
  }
  const spotter = world.spotter();
  if (spotter?.def.trainer) {
    const tr = spotter.def.trainer;
    void script(() => trainerFight(spotter, tr, true));
    return;
  }
  const map = world.map;
  if (map.encounters && ENCOUNTER.has(world.tile(world.px, world.py)) && Math.random() < (map.rate ?? 0.1)) {
    void script(async () => {
      const pool = map.encounters!.map(toolById);
      const weight = (id: string, r: number) => ({ 1: 6, 2: 3, 3: 1 })[r as 1 | 2 | 3] * (s.caught.includes(id) ? 1 : 2);
      let roll = Math.random() * pool.reduce((sum, t) => sum + weight(t.id, t.rarity), 0);
      let tool = pool[0];
      for (const t of pool) {
        roll -= weight(t.id, t.rarity);
        if (roll <= 0) { tool = t; break; }
      }
      audio.sfx('encounter');
      await flash();
      const res = await wildBattle(tool, map.d);
      audio.play(map.music);
      if (res === 'lost') await lose();
      else if (res === 'caught' && s.caught.length === TOOLS.length && !s.flags.dexDone) {
        s.flags.dexDone = true;
        persist();
        await say(['Eine Nachricht von Prof. Prompt:', `„Wahnsinn, {name}! Dein Tool-Dex ist komplett: alle ${TOOLS.length} KI-Tools!“`]);
      }
    });
    return;
  }
  persist();
};

/* ---------- Eingabe-Routing ---------- */

input.on((a: Action) => {
  audio.unlock();
  if (sheetOpen()) {
    if (a === 'b' || a === 'menu' || a === 'dex') back();
    else if (a === 'a') clickFocused();
    return;
  }
  if (!playing) return;
  if (dialog.open) {
    if (dialog.choosing) {
      if (a === 'b' || a === 'menu') cancelChoice();
      else if (a === 'a') clickFocused();
    } else if (a === 'a' || a === 'b') {
      advance();
    }
    return;
  }
  if (battleOpen()) {
    if (a === 'a') clickFocused();
    return;
  }
  if (!world.idle()) return;
  if (a === 'a') void interact();
  else if (a === 'menu') void script(() => openPause(toTitle));
  else if (a === 'dex') void script(() => openDex());
});

/** A-Taste per E/Z oder Touch drückt den fokussierten Button der obersten Ebene. */
function clickFocused() {
  const layer = activeLayer();
  const f = document.activeElement as HTMLElement | null;
  if (layer && f && layer.contains(f) && f.matches('button')) f.click();
  else if (layer) layer.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
}

function toTitle() {
  persist();
  location.reload();
}

/* ---------- Ton-Schalter und Audio-Freigabe ---------- */

const soundBtn = $<HTMLButtonElement>('soundToggle');
const syncSound = () => {
  const on = game.settings.music || game.settings.sfx;
  soundBtn.setAttribute('aria-pressed', String(on));
  soundBtn.textContent = on ? 'Ton an' : 'Ton aus';
};
soundBtn.addEventListener('click', () => {
  const on = !(game.settings.music || game.settings.sfx);
  game.settings.music = game.settings.sfx = on;
  try { localStorage.setItem('tooldex-settings-v1', JSON.stringify(game.settings)); } catch { /* Speicher nicht verfügbar */ }
  audio.unlock();
  audio.apply();
  syncSound();
});
syncSound();
['pointerdown', 'keydown'].forEach((ev) => addEventListener(ev, () => audio.unlock(), { once: true }));

/* ---------- Spielschleife ---------- */

let last = performance.now();
function tick(now: number) {
  const dt = Math.min(1, Math.max(0, (now - last) / 1000));
  last = now;
  if (playing) game.s.time += dt;
  world.update(now);
  world.render(now);
}
function frame(now: number) {
  tick(now);
  requestAnimationFrame(frame);
}

// Nur in der Entwicklung: Zugriff für automatisierte Tests
if (import.meta.env.DEV) Object.assign(window, { __tooldex: { world, game, input, tick } });

/* ---------- Start ---------- */

async function boot() {
  world.load('hub', 14, 9, 'down');
  world.attract = true;
  requestAnimationFrame(frame);
  document.body.classList.add('ready');

  const save = loadSave();
  const choice = await showTitle(save);
  audio.unlock();
  game.s = choice === 'continue' && save ? save : fresh('');
  const s = game.s;
  world.attract = false;
  enterMap(s.map, s.x, s.y, s.dir);
  playing = true;
  persist();
  if (!s.flags.intro) {
    s.map = START.map;
    await script(intro);
  } else {
    banner(world.map.name);
  }
}

void boot();
