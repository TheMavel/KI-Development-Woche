import { audio } from '../engine/audio';
import { fill } from '../state';
import { $, el, reducedMotion } from './dom';

const box = $('dialog');
const whoEl = $('dlgWho');
const textEl = $('dlgText');
const choicesEl = $('choices');
const form = $<HTMLFormElement>('nameForm');
const nameInput = $<HTMLInputElement>('nameInput');

let open = false;
let typing = false;
let full = '';
let timer = 0;
let next: (() => void) | null = null;
let cancel: (() => void) | null = null;

export const dialog = {
  get open() { return open; },
  get choosing() { return !choicesEl.hidden || !form.hidden; },
};

function show(who: string) {
  open = true;
  box.hidden = false;
  whoEl.textContent = who;
  whoEl.hidden = !who;
}

function hide() {
  open = false;
  clearInterval(timer);
  box.hidden = true;
  choicesEl.hidden = true;
  form.hidden = true;
  next = cancel = null;
}

function type(text: string): Promise<void> {
  return new Promise((resolve) => {
    clearInterval(timer);
    full = text;
    next = resolve;
    box.classList.remove('done');
    if (reducedMotion()) {
      textEl.textContent = text;
      typing = false;
      box.classList.add('done');
      return;
    }
    typing = true;
    let i = 0;
    textEl.textContent = '';
    timer = window.setInterval(() => {
      i += 2;
      textEl.textContent = text.slice(0, i);
      if (i % 8 === 0) audio.sfx('blip');
      if (i >= text.length) {
        clearInterval(timer);
        typing = false;
        box.classList.add('done');
      }
    }, 22);
  });
}

/** Text fertig tippen oder zur nächsten Zeile springen. */
export function advance() {
  if (!open || dialog.choosing) return;
  if (typing) {
    clearInterval(timer);
    textEl.textContent = full;
    typing = false;
    box.classList.add('done');
    return;
  }
  const r = next;
  next = null;
  r?.();
}

// Das Namensformular darf die Seite nie neu laden
form.addEventListener('submit', (e) => e.preventDefault());

box.addEventListener('click', (e) => {
  if (e.target instanceof Element && e.target.closest('button, input, form')) return;
  advance();
});

export async function say(lines: string | string[], who = '') {
  show(who);
  for (const line of Array.isArray(lines) ? lines : [lines]) await type(fill(line));
  hide();
}

/** Frage mit Auswahl. Bei `cancelable` wählt B/Esc die letzte Option. */
export function ask(text: string, options: string[], who = '', cancelable = true): Promise<number> {
  show(who);
  clearInterval(timer);
  typing = false;
  textEl.textContent = fill(text);
  box.classList.remove('done');
  choicesEl.replaceChildren();
  choicesEl.hidden = false;
  return new Promise((resolve) => {
    const done = (i: number) => {
      audio.sfx(cancelable && i === options.length - 1 ? 'back' : 'select');
      hide();
      resolve(i);
    };
    options.forEach((o, i) => {
      const b = el('button', 'choice', o);
      b.type = 'button';
      b.addEventListener('click', () => done(i));
      choicesEl.append(b);
    });
    cancel = cancelable ? () => done(options.length - 1) : null;
    (choicesEl.firstElementChild as HTMLElement).focus({ preventScroll: true });
  });
}

export function cancelChoice() {
  cancel?.();
}

export function askName(fallback: string): Promise<string> {
  show('Prof. Prompt');
  clearInterval(timer);
  typing = false;
  textEl.textContent = 'Wie heißt du?';
  form.hidden = false;
  nameInput.value = '';
  nameInput.placeholder = fallback;
  nameInput.focus();
  return new Promise((resolve) => {
    form.onsubmit = (e) => {
      e.preventDefault();
      const v = nameInput.value.trim().replace(/\s+/g, ' ').slice(0, 14) || fallback;
      audio.sfx('select');
      nameInput.blur();
      hide();
      resolve(v);
    };
  });
}
