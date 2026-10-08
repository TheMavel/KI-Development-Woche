import { audio } from '../engine/audio';
import { toolArt, toolCanvas } from '../engine/sprites';
import { RARITY, SKILL_TEXT, TOOLS, ZONE_NAMES, toolById, type Tool } from '../data/tools';
import { pickQuestion, type Question } from '../data/questions';
import type { Trainer } from '../data/maps';
import { akkuMax, game, gainXp, pad2, persist } from '../state';
import { $, cells, el, esc, focusFirst, reducedMotion, restart, shuffle, wait } from './dom';
import { hud, toast } from './hud';

const root = $('battle');
const foeBox = $('foe');
const foeArt = $<HTMLCanvasElement>('foeArt');
const foeEyebrow = $('foeEyebrow');
const foeName = $('foeName');
const foePills = $('foePills');
const foeHp = $('foeHp');
const trainerEl = $('trainerStrip');
const msgEl = $('bMsg');
const quizEl = $('bQuiz');
const questionEl = $('bQuestion');
const answersEl = $('bAnswers');
const timerEl = $('bTimer');
const timerBar = $('bTimerBar');
const jokersEl = $('bJokers');
const actionsEl = $('bActions');
const footAkku = $('bAkku');
const footBalls = $('bBalls');
const footTokens = $('bTokens');

const QUESTION_TIME = 30;

let active = false;
export const battleOpen = () => active;

interface Ctx { used: Set<string>; shield: boolean; double: boolean }
interface Opt { id: string; label: string; solid?: boolean; disabled?: boolean }
type Result = { correct: boolean; timeout: boolean };

const newCtx = (): Ctx => ({ used: new Set(), shield: false, double: false });

function open() {
  active = true;
  root.hidden = false;
  root.scrollTop = 0;
  quizEl.hidden = true;
  foot();
}

function close() {
  active = false;
  root.hidden = true;
  (document.activeElement as HTMLElement | null)?.blur();
  hud();
}

function foot() {
  const s = game.s;
  cells(footAkku, s.akku, akkuMax(s.level), s.akku <= 1);
  footBalls.textContent = `${pad2(s.bag.ball)} · ${pad2(s.bag.superball)}`;
  footTokens.textContent = String(s.tokens);
}

function showFoe(tool: Tool, eyebrow: string) {
  foeEyebrow.textContent = eyebrow;
  foeName.textContent = tool.name;
  const pills = [tool.type, tool.maker, RARITY[tool.rarity]];
  if (game.s.caught.includes(tool.id)) pills.push('Schon gefangen');
  foePills.replaceChildren(...pills.map((p) => el('span', 'pill', p)));
  const c = foeArt.getContext('2d')!;
  c.clearRect(0, 0, 16, 16);
  c.drawImage(toolCanvas(tool, false), 0, 0);
  restart(foeBox, 'enter');
}

const setHp = (hp: number, max: number) => cells(foeHp, hp, max);

function msg(html: string, note?: string) {
  msgEl.innerHTML = html + (note ? `<span class="note">${note}</span>` : '');
}

function choose(opts: Opt[]): Promise<string> {
  actionsEl.replaceChildren();
  return new Promise((resolve) => {
    for (const o of opts) {
      const b = el('button', 'btn' + (o.solid ? ' btn--solid' : ''), o.label);
      b.type = 'button';
      b.disabled = !!o.disabled;
      b.addEventListener('click', () => {
        audio.sfx('select');
        actionsEl.replaceChildren();
        resolve(o.id);
      });
      actionsEl.append(b);
    }
    focusFirst(actionsEl);
  });
}

const ok = (label = 'Weiter') => choose([{ id: 'ok', label, solid: true }]);

function reward(q: Question): string {
  const s = game.s;
  const xp = 10 * q.d;
  const tk = 5 * q.d;
  s.tokens += tk;
  const ups = gainXp(xp);
  foot();
  hud();
  let text = `+${xp} XP · +${tk} Tokens`;
  if (ups) {
    audio.jingle('level');
    text += ` · Level ${pad2(s.level)}! Akku-Maximum jetzt ${akkuMax(s.level)}.`;
    toast(`Level ${pad2(s.level)} erreicht`);
  }
  return text;
}

function penalty(ctx: Ctx): string {
  const s = game.s;
  if (ctx.shield) {
    ctx.shield = false;
    return 'Dein Joker schützt dich: kein Akku verloren.';
  }
  s.akku = Math.max(0, s.akku - 1);
  foot();
  hud();
  return 'Das kostet dich einen Akku-Punkt.';
}

function drink() {
  const s = game.s;
  s.bag.kaffee--;
  s.akku = Math.min(akkuMax(s.level), s.akku + 3);
  audio.sfx('item');
  foot();
  hud();
  persist();
}

function kaffeeOpt(): Opt[] {
  const s = game.s;
  return s.bag.kaffee ? [{ id: 'kaffee', label: `Kaffee · ${pad2(s.bag.kaffee)}`, disabled: s.akku >= akkuMax(s.level) }] : [];
}

/** Stellt eine Frage mit Timer und Jokern aus dem Team. */
function runQuiz(q: Question, ctx: Ctx, asker: string): Promise<Result> {
  return new Promise((resolve) => {
    const s = game.s;
    const timed = game.settings.timer;
    let left = QUESTION_TIME;
    let done = false;
    let iv = 0;

    quizEl.hidden = false;
    actionsEl.replaceChildren();
    msg(`<b>${esc(asker)}</b> fragt:`);
    questionEl.textContent = q.q;

    const opts = shuffle(q.a.map((text, i) => ({ text, right: i === 0 })));
    const btns = opts.map((o, i) => {
      const b = el('button', 'answer');
      b.type = 'button';
      b.append(el('small', '', String(i + 1)), el('span', '', o.text));
      b.addEventListener('click', () => finish(i));
      return b;
    });
    answersEl.replaceChildren(...btns);

    const strike = (n: number) => {
      const wrong = btns.filter((b, i) => !opts[i].right && !b.disabled);
      shuffle(wrong).slice(0, n).forEach((b) => { b.disabled = true; b.classList.add('gone'); });
    };

    const team = s.team.map(toolById);
    jokersEl.hidden = !team.length;
    jokersEl.replaceChildren(el('span', 'eyebrow', 'Joker'));
    for (const t of team) {
      const b = el('button', 'joker');
      b.type = 'button';
      b.title = SKILL_TEXT[t.skill];
      b.append(toolArt(t), el('span', '', t.skillName));
      b.disabled = ctx.used.has(t.id) || (t.skill === 'heal' && s.akku >= akkuMax(s.level));
      b.addEventListener('click', () => {
        if (done) return;
        ctx.used.add(t.id);
        b.disabled = true;
        audio.sfx('joker');
        switch (t.skill) {
          case 'fifty': strike(2); break;
          case 'reveal': strike(1); break;
          case 'insight': strike(2); ctx.shield = true; break;
          case 'shield': ctx.shield = true; break;
          case 'double': ctx.double = true; break;
          case 'time': if (timed) left += 15; else strike(1); break;
          case 'heal': s.akku = Math.min(akkuMax(s.level), s.akku + 2); foot(); hud(); break;
        }
        msg(`<b>${esc(asker)}</b> fragt:`, `Joker ${t.name}: ${SKILL_TEXT[t.skill]}`);
        focusFirst(answersEl);
      });
      jokersEl.append(b);
    }

    timerEl.hidden = !timed;
    if (timed) {
      const tick = () => {
        left -= 0.1;
        timerBar.style.width = `${Math.max(0, Math.min(100, (left / QUESTION_TIME) * 100))}%`;
        timerEl.classList.toggle('low', left <= 8);
        if (left <= 0) finish(-1);
      };
      timerBar.style.width = '100%';
      timerEl.classList.remove('low');
      iv = window.setInterval(tick, 100);
    }

    const keys = (e: KeyboardEvent) => {
      const i = '1234'.indexOf(e.key);
      if (i > -1 && !btns[i].disabled) {
        e.preventDefault();
        btns[i].click();
      }
    };
    addEventListener('keydown', keys);
    focusFirst(answersEl);

    function finish(i: number) {
      if (done) return;
      done = true;
      clearInterval(iv);
      removeEventListener('keydown', keys);
      btns.forEach((b, j) => {
        b.disabled = true;
        if (opts[j].right) b.classList.add('right');
        else if (j === i) b.classList.add('wrong');
      });
      jokersEl.querySelectorAll('button').forEach((b) => { b.disabled = true; });
      const correct = i >= 0 && opts[i].right;
      audio.sfx(correct ? 'correct' : 'wrong');
      s.stats[correct ? 'correct' : 'wrong']++;
      resolve({ correct, timeout: i < 0 });
    }
  });
}

async function throwBall(tool: Tool, hp: number, max: number, superBall: boolean): Promise<'caught' | 'broke' | 'fled'> {
  const s = game.s;
  if (superBall) s.bag.superball--;
  else s.bag.ball--;
  foot();
  let chance = hp === 0 ? 1 : Math.max(0.05, (1 - hp / max) * 0.6 + 0.12 - (tool.rarity - 1) * 0.06);
  if (superBall && hp > 0) chance = Math.min(0.95, chance + 0.3);
  const success = Math.random() < chance;

  quizEl.hidden = true;
  msg(`Du wirfst einen ${superBall ? 'Super-Prompt-Ball' : 'Prompt-Ball'} …`);
  audio.sfx('throw');
  foeArt.hidden = true;
  const ball = el('span', 'ball' + (superBall ? ' ball--super' : ''));
  foeBox.append(ball);
  const shakes = success ? 3 : 1 + Math.floor(Math.random() * 3);
  const beat = reducedMotion() ? 200 : 600;
  for (let i = 0; i < shakes; i++) {
    await wait(beat);
    restart(ball, 'shake');
    audio.sfx('wobble');
  }
  await wait(beat);
  ball.remove();
  foeArt.hidden = false;
  if (success) return 'caught';
  restart(foeBox, 'enter');
  return Math.random() < 0.15 ? 'fled' : 'broke';
}

export type WildResult = 'caught' | 'fled' | 'ran' | 'lost';

export async function wildBattle(tool: Tool, range: [number, number]): Promise<WildResult> {
  const s = game.s;
  if (!s.seen.includes(tool.id)) s.seen.push(tool.id);
  s.stats.battles++;
  const max = tool.rarity + 1;
  let hp = max;
  const ctx = newCtx();
  const asked = new Set<string>();

  open();
  audio.play('battle');
  trainerEl.hidden = true;
  showFoe(tool, `Wildes Tool · Nr. ${pad2(TOOLS.indexOf(tool) + 1)} · ${ZONE_NAMES[tool.zone]}`);
  setHp(hp, max);
  msg(`Ein wildes <b>${tool.name}</b> erscheint!`, 'Beantworte seine Fragen, um die Skepsis zu senken. Dann wirf einen Prompt-Ball.');

  for (;;) {
    quizEl.hidden = true;
    const opts: Opt[] = [
      { id: 'quiz', label: 'Quizfrage', solid: true },
      { id: 'ball', label: `Prompt-Ball · ${pad2(s.bag.ball)}`, disabled: !s.bag.ball },
    ];
    if (s.bag.superball) opts.push({ id: 'super', label: `Super-Ball · ${pad2(s.bag.superball)}` });
    opts.push(...kaffeeOpt(), { id: 'run', label: 'Fliehen' });
    const c = await choose(opts);

    if (c === 'run') {
      audio.sfx('flee');
      msg('Du ziehst dich ins Gras zurück.');
      await wait(650);
      close();
      return 'ran';
    }
    if (c === 'kaffee') {
      drink();
      msg('Du trinkst einen Kaffee. <b>+3 Akku.</b>');
      continue;
    }
    if (c === 'ball' || c === 'super') {
      const r = await throwBall(tool, hp, max, c === 'super');
      if (r === 'caught') {
        const first = !s.caught.includes(tool.id);
        let note = '';
        if (first) {
          s.caught.push(tool.id);
          s.stats.caught++;
          s.tokens += 10;
          if (s.team.length < 3) {
            s.team.push(tool.id);
            note = ' Es ist jetzt in deinem Team.';
          }
        }
        audio.jingle('catch');
        foot();
        hud();
        persist();
        msg(first
          ? `<b>Gefangen!</b> ${tool.name} steht jetzt in deinem Tool-Dex. +10 Tokens.${note}`
          : `<b>Gefangen!</b> ${tool.name} hattest du schon. Du lässt es wieder frei.`, first ? tool.dex : undefined);
        await ok();
        close();
        return 'caught';
      }
      persist();
      if (r === 'fled') {
        msg(`${tool.name} hat sich befreit und ist geflohen.`, 'Tipp: Erst Fragen richtig beantworten, dann werfen.');
        await ok();
        close();
        return 'fled';
      }
      msg(`${tool.name} hat sich befreit!`, hp > 0 ? 'Je weniger Skepsis, desto besser die Chance.' : undefined);
      continue;
    }

    const q = pickQuestion(range, asked, tool.id);
    asked.add(q.id);
    const r = await runQuiz(q, ctx, tool.name);
    if (r.correct) {
      const dmg = ctx.double ? 2 : 1;
      ctx.double = false;
      hp = Math.max(0, hp - dmg);
      setHp(hp, max);
      restart(foeBox, 'hit');
      audio.sfx('hit');
      const rw = reward(q);
      msg(hp === 0
        ? `<b>Richtig!</b> ${tool.name} ist überzeugt. Jetzt fängt es jeder Prompt-Ball.`
        : `<b>Richtig!</b> ${tool.name} wird nachdenklich.${dmg > 1 ? ' Doppelter Treffer!' : ''}`, `${q.e} ${rw}`);
    } else {
      const pen = penalty(ctx);
      msg(`<b>${r.timeout ? 'Zeit abgelaufen.' : 'Leider falsch.'}</b> ${pen}`, `Richtig ist: ${q.a[0]}. ${q.e}`);
      persist();
      if (s.akku === 0) {
        await ok();
        close();
        return 'lost';
      }
      if (Math.random() < 0.15) {
        await ok();
        quizEl.hidden = true;
        msg(`${tool.name} verliert das Interesse und verschwindet im Gras.`);
        await ok();
        close();
        return 'fled';
      }
    }
    persist();
    await ok();
  }
}

export async function trainerBattle(tr: Trainer, who: string): Promise<'won' | 'lost'> {
  const s = game.s;
  s.stats.battles++;
  const team = tr.team.map((t) => ({ tool: toolById(t.tool), hp: t.hp, max: t.hp }));
  const ctx = newCtx();
  const asked = new Set<string>();
  let i = 0;

  open();
  audio.play(tr.boss ? 'boss' : 'battle');
  trainerEl.hidden = false;
  const strip = () => {
    const dots = el('span', 'dots');
    team.forEach((_, j) => dots.append(el('i', j < i ? 'done' : j === i ? 'on' : '')));
    trainerEl.replaceChildren(el('span', 'eyebrow', `${tr.title} · ${who}`), dots);
  };
  const enter = () => {
    const t = team[i];
    if (!s.seen.includes(t.tool.id)) s.seen.push(t.tool.id);
    strip();
    showFoe(t.tool, `Tool ${i + 1} von ${team.length}`);
    setHp(t.hp, t.max);
  };
  enter();
  msg(`${esc(who)} schickt <b>${team[0].tool.name}</b> ins Rennen!`, `Überzeuge ${team.length === 1 ? 'das Tool' : `alle ${pad2(team.length)} Tools`}, bevor dein Akku leer ist.`);

  for (;;) {
    quizEl.hidden = true;
    const c = await choose([{ id: 'quiz', label: 'Frage beantworten', solid: true }, ...kaffeeOpt()]);
    if (c === 'kaffee') {
      drink();
      msg('Du trinkst einen Kaffee. <b>+3 Akku.</b>');
      continue;
    }
    const cur = team[i];
    const q = pickQuestion([tr.d, tr.d], asked);
    asked.add(q.id);
    const r = await runQuiz(q, ctx, cur.tool.name);

    if (r.correct) {
      const dmg = ctx.double ? 2 : 1;
      ctx.double = false;
      cur.hp = Math.max(0, cur.hp - dmg);
      setHp(cur.hp, cur.max);
      restart(foeBox, 'hit');
      audio.sfx('hit');
      const rw = reward(q);
      persist();
      if (cur.hp > 0) {
        msg(`<b>Richtig!</b> ${cur.tool.name} wird nachdenklich.${dmg > 1 ? ' Doppelter Treffer!' : ''}`, `${q.e} ${rw}`);
        await ok();
        continue;
      }
      msg(`<b>Richtig!</b> ${cur.tool.name} ist überzeugt.`, `${q.e} ${rw}`);
      await ok();
      i++;
      if (i >= team.length) {
        s.tokens += tr.reward;
        strip();
        foot();
        hud();
        persist();
        audio.jingle('victory');
        quizEl.hidden = true;
        msg(`<b>Gewonnen!</b> Du hast ${esc(who)} überzeugt. +${tr.reward} Tokens.`);
        await ok();
        close();
        return 'won';
      }
      enter();
      quizEl.hidden = true;
      msg(`${esc(who)} schickt <b>${team[i].tool.name}</b> ins Rennen!`);
      continue;
    }

    const pen = penalty(ctx);
    msg(`<b>${r.timeout ? 'Zeit abgelaufen.' : 'Leider falsch.'}</b> ${pen}`, `Richtig ist: ${q.a[0]}. ${q.e}`);
    persist();
    if (s.akku === 0) {
      await ok();
      close();
      return 'lost';
    }
    await ok();
  }
}
