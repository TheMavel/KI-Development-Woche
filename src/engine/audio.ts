import { game } from '../state';

export type Track = 'title' | 'town' | 'route' | 'forest' | 'cave' | 'battle' | 'boss';
export type Sfx =
  | 'blip' | 'select' | 'back' | 'bump' | 'correct' | 'wrong' | 'encounter' | 'throw'
  | 'wobble' | 'flee' | 'door' | 'item' | 'joker' | 'spot' | 'hit';
type Jingle = 'catch' | 'heal' | 'victory' | 'level' | 'badge';

interface Song { bpm: number; lead: number[]; bass: number[]; hat?: boolean }

// Kleine Chiptune-Schleifen in Achteln (MIDI-Noten, 0 = Pause)
const SONGS: Record<Track, Song> = {
  title: { bpm: 92,
    lead: [64,0,67,0,72,0,71,0,69,0,67,0,64,0,0,0, 65,0,69,0,72,0,74,0,72,0,71,0,67,0,0,0],
    bass: [48,0,0,0,52,0,0,0,45,0,0,0,52,0,0,0, 41,0,0,0,45,0,0,0,43,0,0,0,47,0,0,0] },
  town: { bpm: 112,
    lead: [76,0,79,0,81,79,76,0, 74,0,76,79,76,0,72,0, 74,0,76,0,77,76,74,0, 72,0,74,76,72,0,0,0],
    bass: [48,0,55,0,52,0,55,0, 50,0,57,0,53,0,57,0, 43,0,50,0,47,0,50,0, 48,0,55,0,48,0,43,0] },
  route: { bpm: 128, hat: true,
    lead: [72,74,76,0,79,0,76,74, 72,0,69,0,72,0,0,0, 74,76,77,0,81,0,79,77, 76,0,74,0,72,0,0,0],
    bass: [48,0,48,55,45,0,45,52, 41,0,41,48,43,0,43,50, 41,0,41,48,45,0,45,52, 43,0,43,50,48,0,43,0] },
  forest: { bpm: 104, hat: true,
    lead: [69,0,72,0,76,0,74,72, 71,0,67,0,69,0,0,0, 69,0,72,0,77,0,76,74, 72,0,71,0,69,0,0,0],
    bass: [45,0,52,0,45,0,52,0, 43,0,50,0,43,0,50,0, 41,0,48,0,41,0,48,0, 40,0,47,0,45,0,40,0] },
  cave: { bpm: 96,
    lead: [69,0,0,72,0,0,71,0, 69,0,0,64,0,0,0,0, 69,0,0,72,0,0,76,0, 74,0,0,71,0,0,0,0],
    bass: [45,0,0,0,45,0,0,0, 41,0,0,0,41,0,0,0, 43,0,0,0,43,0,0,0, 40,0,0,0,40,0,0,0] },
  battle: { bpm: 152, hat: true,
    lead: [69,0,72,76,74,72,69,0, 67,0,71,74,72,71,67,0, 65,0,69,72,71,69,65,0, 64,0,68,71,76,0,74,71],
    bass: [45,45,57,45,45,45,57,45, 43,43,55,43,43,43,55,43, 41,41,53,41,41,41,53,41, 40,40,52,40,40,40,52,40] },
  boss: { bpm: 164, hat: true,
    lead: [69,70,69,0,76,0,75,76, 72,0,69,0,70,0,0,0, 69,70,69,0,77,0,76,74, 76,0,0,0,64,0,68,0],
    bass: [33,33,45,33,33,33,45,33, 34,34,46,34,34,34,46,34, 33,33,45,33,33,33,45,33, 32,32,44,32,32,32,44,32] },
};

const JINGLES: Record<Jingle, [number, number][]> = {
  catch: [[72, 1], [76, 1], [79, 1], [84, 3]],
  heal: [[72, 1], [76, 1], [79, 1], [76, 1], [84, 3]],
  victory: [[67, 1], [72, 1], [76, 1], [79, 2], [76, 1], [79, 4]],
  level: [[72, 1], [79, 1], [84, 2]],
  badge: [[72, 1], [72, 1], [79, 1], [79, 1], [84, 4]],
};

const hz = (n: number) => 440 * 2 ** ((n - 69) / 12);

class Sound {
  private ctx: AudioContext | null = null;
  private music!: GainNode;
  private fx!: GainNode;
  private noiseBuf!: AudioBuffer;
  private track: Track | null = null;
  private step = 0;
  private next = 0;
  private timer = 0;
  private hold = 0;

  /** Browser erlauben Audio erst nach einer Nutzeraktion. */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    this.ctx = ctx;
    const master = ctx.createGain();
    master.gain.value = 0.8;
    master.connect(ctx.destination);
    this.music = ctx.createGain();
    this.fx = ctx.createGain();
    this.music.connect(master);
    this.fx.connect(master);
    this.noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
    const data = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    this.apply();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) void ctx.suspend();
      else void ctx.resume();
    });
    if (this.track) this.start();
  }

  apply() {
    if (!this.ctx) return;
    this.music.gain.value = game.settings.music ? 0.45 : 0;
    this.fx.gain.value = game.settings.sfx ? 0.7 : 0;
  }

  play(t: Track) {
    if (this.track === t) return;
    this.track = t;
    this.step = 0;
    if (this.ctx) this.start();
  }

  private start() {
    clearInterval(this.timer);
    this.next = this.ctx!.currentTime + 0.08;
    this.timer = window.setInterval(() => this.schedule(), 30);
  }

  private schedule() {
    const ctx = this.ctx;
    if (!ctx || !this.track) return;
    const song = SONGS[this.track];
    const dur = 60 / song.bpm / 2;
    if (this.next < ctx.currentTime - 0.5) this.next = ctx.currentTime + 0.05;
    while (this.next < ctx.currentTime + 0.15) {
      if (this.next >= this.hold) {
        const i = this.step % song.lead.length;
        const l = song.lead[i];
        const b = song.bass[i % song.bass.length];
        if (l) this.tone(this.music, 'square', hz(l), hz(l), this.next, dur * 0.85, 0.045);
        if (b) this.tone(this.music, 'triangle', hz(b), hz(b), this.next, dur * 0.95, 0.12);
        if (song.hat && i % 2 === 1) this.noise(this.music, this.next, 0.03, 0.02);
      }
      this.step++;
      this.next += dur;
    }
  }

  private tone(dest: AudioNode, type: OscillatorType, f1: number, f2: number, t: number, d: number, vol: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f1, t);
    if (f2 !== f1) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + d + 0.03);
  }

  private noise(dest: AudioNode, t: number, d: number, vol: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    const g = ctx.createGain();
    src.buffer = this.noiseBuf;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    src.connect(g).connect(dest);
    src.start(t);
    src.stop(t + d + 0.02);
  }

  sfx(name: Sfx) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + 0.01;
    const fx = this.fx;
    const seq = (notes: number[], len: number, type: OscillatorType = 'square', vol = 0.06) =>
      notes.forEach((n, i) => this.tone(fx, type, hz(n), hz(n), t + i * len, len * 0.95, vol));
    switch (name) {
      case 'blip': this.tone(fx, 'square', 1200, 1200, t, 0.025, 0.02); break;
      case 'select': seq([79, 84], 0.05); break;
      case 'back': seq([72, 67], 0.05); break;
      case 'bump': this.tone(fx, 'triangle', 110, 80, t, 0.09, 0.25); break;
      case 'correct': seq([76, 81, 88], 0.07); break;
      case 'wrong': this.tone(fx, 'sawtooth', 220, 110, t, 0.3, 0.06); break;
      case 'encounter': seq([88, 84, 79, 76, 72, 67], 0.05); break;
      case 'throw': this.tone(fx, 'square', 400, 1200, t, 0.22, 0.05); break;
      case 'wobble': this.tone(fx, 'triangle', 300, 240, t, 0.1, 0.2); break;
      case 'flee': this.tone(fx, 'square', 700, 180, t, 0.3, 0.04); break;
      case 'door': this.noise(fx, t, 0.12, 0.08); this.tone(fx, 'triangle', 180, 120, t, 0.12, 0.2); break;
      case 'item': seq([79, 84, 91], 0.06); break;
      case 'joker': seq([84, 88, 91, 96], 0.04); break;
      case 'spot': seq([96, 96], 0.08); break;
      case 'hit': this.noise(fx, t, 0.1, 0.15); break;
    }
  }

  jingle(name: Jingle) {
    if (!this.ctx) return;
    const unit = 0.12;
    let t = this.ctx.currentTime + 0.02;
    for (const [n, len] of JINGLES[name]) {
      this.tone(this.fx, 'square', hz(n), hz(n), t, unit * len * 0.95, 0.06);
      this.tone(this.fx, 'triangle', hz(n - 12), hz(n - 12), t, unit * len * 0.95, 0.12);
      t += unit * len;
    }
    this.hold = t + 0.1;
  }
}

export const audio = new Sound();
