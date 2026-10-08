// Dieselben Tokens wie im Portfolio. Die Werte hier sind nur Fallback, bis das CSS gelesen ist.
const TOKENS = {
  night: ['night', '#0e1513'],
  paper: ['paper', '#f2f2f0'],
  ink: ['ink', '#17181a'],
  mute: ['mute', '#566060'],
  sage: ['sage', '#7f8a88'],
  glow: ['glow', '#ff8a3d'],
  c1: ['card-1', '#e3e7e6'],
  c2: ['card-2', '#aab4b2'],
  c3: ['card-3', '#7d8886'],
  c4: ['card-4', '#2c3735'],
} as const;

type Key = keyof typeof TOKENS;

export const C = Object.fromEntries(Object.entries(TOKENS).map(([k, [, v]]) => [k, v])) as Record<Key, string>;

export function readPalette() {
  const css = getComputedStyle(document.documentElement);
  for (const k of Object.keys(TOKENS) as Key[]) {
    const v = css.getPropertyValue('--' + TOKENS[k][0]).trim();
    if (v) C[k] = v;
  }
}
