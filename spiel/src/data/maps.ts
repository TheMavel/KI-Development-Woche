import type { Badge, Dir } from '../state';
import type { ItemId } from './items';
import type { Track } from '../engine/audio';

/*
  Kachel-Legende
  .  Boden        =  Pflaster      ,  hohes Gras (Begegnungen)   f  Blumen
  #  Baum         ~  Wasser        F  Zaun    L  Laterne    b  Bank    S  Schild
  R/H/D  AI-HUB-Dach, -Wand, -Tür          r/h/d  Wohnhaus-Dach, -Wand, -Tür
  W  Innenwand    _  Innenboden    X  Regal/Server   P  Rechner   C  Theke   T  Tisch
  M  Fußmatte (Ausgang)            k  Kabelboden (Begegnungen im Rechenzentrum)
*/

export type Look =
  | 'player' | 'prof' | 'clerk' | 'kid' | 'elder' | 'student' | 'hype' | 'trainer' | 'artist' | 'dev' | 'boss' | 'bot';

export interface Warp { x: number; y: number; to: string; tx: number; ty: number; dir: Dir }

export interface Trainer {
  id: string;
  title: string;
  d: 1 | 2 | 3;
  team: { tool: string; hp: number }[];
  reward: number;
  badge?: Badge;
  boss?: boolean;
  sight: number;
  intro: string[];
  win: string[];
  after: string[];
}

export interface Npc {
  id: string;
  name: string;
  look: Look;
  x: number;
  y: number;
  dir: Dir;
  lines?: string[];
  trainer?: Trainer;
  action?: 'heal' | 'shop' | 'ada' | 'kai' | 'bot';
  wander?: boolean;
  hideIfBadges?: number;
}

export interface MapItem { id: string; x: number; y: number; item: ItemId; n: number }

export interface MapDef {
  id: string;
  name: string;
  rows: string[];
  music: Track;
  indoor?: boolean;
  encounters?: string[];
  rate?: number;
  d: [number, number];
  warps: Warp[];
  npcs: Npc[];
  signs: Record<string, string[]>;
  items: MapItem[];
}

export const BADGES: Record<Badge, { name: string; from: string }> = {
  prompt: { name: 'Prompt-Plakette', from: 'Paula · Prompt-Wiese' },
  pixel: { name: 'Pixel-Plakette', from: 'Pia · Pixel-Park' },
  workflow: { name: 'Workflow-Plakette', from: 'Werner · Automations-Wald' },
};

const HOUSE = [
  'WWWWWWWWWW',
  'WXX____XXW',
  'W________W',
  'W__TT____W',
  'W________W',
  'W______T_W',
  'W________W',
  'WWWMMWWWWW',
];

export const MAPS: Record<string, MapDef> = {
  hub: {
    id: 'hub', name: 'Düsseldorf · Medienhafen', music: 'town', d: [1, 1],
    rows: [
      '############==##############',
      '#f.........f==f...........f#',
      '#..rrrr.....==.....RRRRRR..#',
      '#..hhhh.....==.....RRRRRR..#',
      '#..hdhh.....==.....HHHHHH..#',
      '#.S.........==.....HHDHHH..#',
      '#...........==.......=S....#',
      '#.L.........==.......=..L..#',
      '#===========================',
      '#===========================',
      '#.L....ff...==...ff.....L..#',
      '#..rrrr.....==.............#',
      '#..hhhh.....==....bb.......#',
      '#..hhdh.....==.............#',
      '#...........==.....~~~~~~~~#',
      '#.f......f..==.f...~~~~~~~~#',
      '#...........==.....~~~~~~~~#',
      '#FFFFFFFFFFF==FFFF.~~~~~~~~#',
      '#...........==.............#',
      '############==##############',
    ],
    warps: [
      { x: 4, y: 4, to: 'haus_ada', tx: 3, ty: 6, dir: 'up' },
      { x: 5, y: 13, to: 'haus_kai', tx: 3, ty: 6, dir: 'up' },
      { x: 21, y: 5, to: 'hub_inside', tx: 6, ty: 7, dir: 'up' },
      { x: 12, y: 0, to: 'wiese', tx: 12, ty: 20, dir: 'up' },
      { x: 13, y: 0, to: 'wiese', tx: 13, ty: 20, dir: 'up' },
      { x: 27, y: 8, to: 'park', tx: 1, ty: 8, dir: 'right' },
      { x: 27, y: 9, to: 'park', tx: 1, ty: 9, dir: 'right' },
      { x: 12, y: 19, to: 'wald', tx: 12, ty: 1, dir: 'down' },
      { x: 13, y: 19, to: 'wald', tx: 13, ty: 1, dir: 'down' },
    ],
    npcs: [
      { id: 'lina', name: 'Lina', look: 'kid', x: 8, y: 7, dir: 'down', wander: true,
        lines: ['Im Rechenzentrum hinter dem Wald soll ein Baron wohnen, der nur in Buzzwords redet.', 'Mein Papa sagt, der hat noch nie erklärt, was er eigentlich meint.'] },
      { id: 'rolf', name: 'Rolf', look: 'elder', x: 17, y: 15, dir: 'right',
        lines: ['Schöner Blick auf den Rhein, oder?', 'Im hohen Gras außerhalb der Stadt lauern wilde KI-Tools. Ohne Prompt-Bälle würde ich da nicht hingehen.'] },
      { id: 'kemal', name: 'Kemal', look: 'student', x: 16, y: 10, dir: 'left', wander: true,
        lines: ['Der Kiosk im AI HUB verkauft Kaffee. Der lädt deinen Akku sogar mitten im Kampf auf.', 'Bezahlt wird mit Tokens. Die bekommst du für richtige Antworten.'] },
      { id: 'mia', name: 'Mia', look: 'artist', x: 22, y: 12, dir: 'down',
        lines: ['Ich male lieber selbst. Aber im Pixel-Park im Osten gibt es Tools, die in Sekunden Bilder erzeugen.', 'Pixel-Pia hütet dort die Pixel-Plakette.'] },
    ],
    signs: {
      '2,5': ['Haus von Ada.'],
      '22,6': ['STARTPLATZ AI HUB · Düsseldorf.', 'Akku aufladen bei Prof. Prompt, Kaffee und Bälle am Kiosk, Tool-Box am Rechner.'],
    },
    items: [
      { id: 'hub-kaffee', x: 26, y: 1, item: 'kaffee', n: 1 },
      { id: 'hub-ball', x: 1, y: 18, item: 'ball', n: 3 },
    ],
  },

  hub_inside: {
    id: 'hub_inside', name: 'AI HUB', music: 'town', indoor: true, d: [1, 1],
    rows: [
      'WWWWWWWWWWWWWW',
      'WXXXXX_PPXXXXW',
      'W____________W',
      'W_CCCC___TT__W',
      'W____________W',
      'W_____TT_CCC_W',
      'W____________W',
      'W____________W',
      'WWWWWWMMWWWWWW',
    ],
    warps: [
      { x: 6, y: 8, to: 'hub', tx: 21, ty: 6, dir: 'down' },
      { x: 7, y: 8, to: 'hub', tx: 21, ty: 6, dir: 'down' },
    ],
    npcs: [
      { id: 'prof', name: 'Prof. Prompt', look: 'prof', x: 3, y: 2, dir: 'down', action: 'heal' },
      { id: 'kim', name: 'Kim', look: 'clerk', x: 10, y: 4, dir: 'down', action: 'shop' },
      { id: 'lea', name: 'Lea', look: 'student', x: 12, y: 6, dir: 'left', wander: true,
        lines: ['Ich mache gerade den KI-Manager-Kurs hier im AI HUB.', 'Mein Tipp: Gefangene Tools im Team geben dir Joker. Perplexity streicht zum Beispiel zwei falsche Antworten.'] },
    ],
    signs: {},
    items: [],
  },

  haus_ada: {
    id: 'haus_ada', name: 'Haus von Ada', music: 'town', indoor: true, d: [1, 1], rows: HOUSE,
    warps: [
      { x: 3, y: 7, to: 'hub', tx: 4, ty: 5, dir: 'down' },
      { x: 4, y: 7, to: 'hub', tx: 4, ty: 5, dir: 'down' },
    ],
    npcs: [{ id: 'ada', name: 'Ada', look: 'elder', x: 6, y: 3, dir: 'left', action: 'ada' }],
    signs: {},
    items: [],
  },

  haus_kai: {
    id: 'haus_kai', name: 'Haus von Kai', music: 'town', indoor: true, d: [1, 1], rows: HOUSE,
    warps: [
      { x: 3, y: 7, to: 'hub', tx: 5, ty: 14, dir: 'down' },
      { x: 4, y: 7, to: 'hub', tx: 5, ty: 14, dir: 'down' },
    ],
    npcs: [{ id: 'kai', name: 'Kai', look: 'dev', x: 2, y: 5, dir: 'right', action: 'kai' }],
    signs: {},
    items: [],
  },

  wiese: {
    id: 'wiese', name: 'Prompt-Wiese', music: 'route', d: [1, 1], rate: 0.1,
    encounters: ['chatgpt', 'gemini', 'perplexity', 'deepl', 'lechat', 'claude'],
    rows: [
      '##########################',
      '#,,,,,,,#.........#,,,,,,#',
      '#,,,,,,,#...f..f..#,,,,,,#',
      '#,,,,,,,....,,,,.....,,,,#',
      '#,,,,.......,,,,.....,,,,#',
      '###.....##..,,,,..##.....#',
      '#.......##........##..,,,#',
      '#..~~~~.....S.........,,,#',
      '#..~~~~...,,,,,,,.....,,,#',
      '#..~~~~...,,,,,,,.....####',
      '#.........,,,,,,,........#',
      '#####.....,,,,,,,...,,,,,#',
      '#,,,,.....##...##...,,,,,#',
      '#,,,,,,............,,,,,,#',
      '#,,,,,,....,,,,....,,,,,,#',
      '#...##.....,,,,.....##...#',
      '#..........,,,,..........#',
      '#,,,,,,.............,,,,,#',
      '#,,,,,,......S......,,,,,#',
      '#,,,,,,.....f..f....,,,,,#',
      '#...........==...........#',
      '############==############',
    ],
    warps: [
      { x: 12, y: 21, to: 'hub', tx: 12, ty: 1, dir: 'down' },
      { x: 13, y: 21, to: 'hub', tx: 13, ty: 1, dir: 'down' },
    ],
    npcs: [
      { id: 'tim', name: 'Tim', look: 'student', x: 7, y: 13, dir: 'right',
        trainer: { id: 'tr-tim', title: 'Student', d: 1, team: [{ tool: 'chatgpt', hp: 2 }], reward: 30, sight: 4,
          intro: ['Hey! Ich hab gestern meinen ersten Prompt geschrieben. Lass uns quizzen!'],
          win: ['Okay, du kennst dich aus. Ich übe weiter.'],
          after: ['Ich lerne gerade, Prompts mit Ziel, Kontext und Format zu schreiben.'] } },
      { id: 'hannes', name: 'Hannes', look: 'hype', x: 20, y: 6, dir: 'down',
        trainer: { id: 'tr-hannes', title: 'Hype-Fan', d: 1, team: [{ tool: 'gemini', hp: 2 }], reward: 35, sight: 4,
          intro: ['KI wird ALLES disruptieren! Glaubst du nicht? Beweis es mir!'],
          win: ['Hm. Vielleicht sollte ich weniger Buzzwords benutzen.'],
          after: ['Ich sage jetzt „konkret verbessern“ statt „revolutionieren“. Fühlt sich gut an.'] } },
      { id: 'paula', name: 'Paula', look: 'trainer', x: 13, y: 1, dir: 'down',
        trainer: { id: 'tr-paula', title: 'Prompt-Trainerin', d: 1, team: [{ tool: 'perplexity', hp: 2 }, { tool: 'lechat', hp: 3 }], reward: 100, badge: 'prompt', sight: 3,
          intro: ['Ich bin Prompt-Paula. Wer an mir vorbei will, muss die Grundlagen beherrschen.', 'Zeig mir, was du über Prompts und Sprachmodelle weißt!'],
          win: ['Stark! Du hast dir die Prompt-Plakette verdient.'],
          after: ['Mein Tipp: Gib dem Modell immer Ziel, Kontext und Format.', 'Pixel-Pia im Pixel-Park östlich der Stadt ist die Nächste.'] } },
      { id: 'nora', name: 'Nora', look: 'elder', x: 3, y: 10, dir: 'right',
        lines: ['Früher hab ich Briefe diktiert. Heute diktiere ich meinem Handy, und Whisper schreibt mit.', 'Solche Tools wohnen übrigens im Pixel-Park.'] },
    ],
    signs: {
      '12,7': ['Tipp: Ein guter Prompt nennt Ziel, Kontext und Format.'],
      '13,18': ['Prompt-Wiese.', 'Hier leben Sprach-, Such- und Übersetzungs-Tools. Trainerin Paula wartet ganz im Norden.'],
    },
    items: [
      { id: 'w-kaffee', x: 24, y: 1, item: 'kaffee', n: 1 },
      { id: 'w-ball', x: 1, y: 13, item: 'ball', n: 2 },
      { id: 'w-super', x: 24, y: 10, item: 'superball', n: 1 },
    ],
  },

  park: {
    id: 'park', name: 'Pixel-Park', music: 'route', d: [1, 2], rate: 0.1,
    encounters: ['midjourney', 'stablediffusion', 'runway', 'suno', 'whisper', 'elevenlabs'],
    rows: [
      '##############################',
      '#,,,,,,,,......~~~~~...,,,,,,#',
      '#,,,,,,,,..f...~~~~~...,,,,,,#',
      '#,,,,......f...~~~~~......,,,#',
      '#,,,,..##......~~~~~..##..,,,#',
      '#......##..,,,,,,,,,..##.....#',
      '#..........,,,,,,,,,.........#',
      '#..S.......,,,,,,,,,....,,,,,#',
      '=...........................,#',
      '=...........................,#',
      '#......,,,,,,.....S.....,,,,,#',
      '#..##..,,,,,,..........,,,,,,#',
      '#..##..,,,,,,..~~~~~~..,,,,,,#',
      '#......,,,,,,..~~~~~~....##..#',
      '#,,,,,.........~~~~~~....##..#',
      '#,,,,,.....f.............,,,,#',
      '#,,,,,,,..........f......,,,,#',
      '##############################',
    ],
    warps: [
      { x: 0, y: 8, to: 'hub', tx: 26, ty: 8, dir: 'left' },
      { x: 0, y: 9, to: 'hub', tx: 26, ty: 9, dir: 'left' },
    ],
    npcs: [
      { id: 'fee', name: 'Fee', look: 'artist', x: 10, y: 6, dir: 'right',
        trainer: { id: 'tr-fee', title: 'Fotografin', d: 1, team: [{ tool: 'stablediffusion', hp: 2 }], reward: 40, sight: 5,
          intro: ['Ich fotografiere nur noch Motive, die es gar nicht gibt. Quiz gefällig?'],
          win: ['Respekt. Mein Diffusionsmodell braucht jetzt eine Pause.'],
          after: ['Bildgeneratoren rechnen ein Bild Schritt für Schritt aus Rauschen heraus.'] } },
      { id: 'delta', name: 'Delta', look: 'dev', x: 22, y: 14, dir: 'up',
        trainer: { id: 'tr-delta', title: 'DJ', d: 2, team: [{ tool: 'suno', hp: 2 }, { tool: 'elevenlabs', hp: 2 }], reward: 60, sight: 4,
          intro: ['Mein neuer Track? Komplett von einer KI komponiert. Lust auf ein Duell?'],
          win: ['Du triffst jeden Ton. Ich meine: jede Antwort.'],
          after: ['Für Stimmen nehme ich ElevenLabs, für ganze Songs Suno.'] } },
      { id: 'pia', name: 'Pia', look: 'trainer', x: 26, y: 9, dir: 'left',
        trainer: { id: 'tr-pia', title: 'Pixel-Trainerin', d: 2, team: [{ tool: 'midjourney', hp: 2 }, { tool: 'runway', hp: 2 }, { tool: 'whisper', hp: 2 }], reward: 150, badge: 'pixel', sight: 5,
          intro: ['Ich bin Pixel-Pia. Bilder, Videos, Stimmen: Hier im Park entsteht alles mit KI.', 'Mal sehen, ob du mehr weißt, als ein schönes Bild zeigt!'],
          win: ['Bildschön gespielt! Hier ist die Pixel-Plakette.'],
          after: ['Der Automations-Wald liegt südlich der Stadt. Workflow-Werner wartet dort.'] } },
      { id: 'ole', name: 'Ole', look: 'kid', x: 5, y: 9, dir: 'down', wander: true,
        lines: ['Ich hab ein Bild von einem Hund im Astronautenanzug generiert!', 'Midjourney zeigt sich hier aber nur selten.'] },
    ],
    signs: {
      '3,7': ['Pixel-Park.', 'Hier leben Bild-, Video-, Musik- und Audio-Tools.'],
      '18,10': ['Fun Fact: Diffusionsmodelle entfernen Schritt für Schritt Rauschen, bis ein Bild entsteht.'],
    },
    items: [
      { id: 'p-kaffee', x: 28, y: 16, item: 'kaffee', n: 2 },
      { id: 'p-ball', x: 1, y: 1, item: 'ball', n: 3 },
      { id: 'p-super', x: 28, y: 13, item: 'superball', n: 1 },
    ],
  },

  wald: {
    id: 'wald', name: 'Automations-Wald', music: 'forest', d: [2, 2], rate: 0.11,
    encounters: ['n8n', 'zapier', 'make', 'langchain', 'cursor', 'copilot', 'huggingface'],
    rows: [
      '############==############',
      '#,,,,,,,,,,,==,,,,,,,,,,,#',
      '#,,#,,,#,,,,..,,,,#,,,#,,#',
      '#,,#,,,#,,,,..,,,,#,,,#,,#',
      '#,,####,,,,,..,,,,#####,,#',
      '#,,,,,,,,,,,..,,,,,,,,,,,#',
      '####,,,,,####..####,,,,###',
      '#...,,,,,#.......S#,,,,..#',
      '#...,,,,,#........#,,,,..#',
      '#,,,,,,,,#........#,,,,,,#',
      '#,,,######...ff...######,#',
      '#,,,,,,,,..........,,,,,,#',
      '#,,,,,,,,..........,,,,,,#',
      '###,,,,####......####,,###',
      '#,,,,,,#............#,,,,#',
      '#,,,,,,#....RRRRR...#,,,,#',
      '#,,,,,,#....RRRRR...#,,,,#',
      '#,,,,,,,....HHDHH...,,,,,#',
      '#,,,,,,,......=.....,,,,,#',
      '#,,#,,,,......=.....,,#,,#',
      '#,,#,,,,,,,,,,,,,,,,,,#,,#',
      '#,,,,,,,,,,,,,,,,,,,,,,,,#',
      '#,,,,,,,,,,,,,,,,,,,,,,,,#',
      '##########################',
    ],
    warps: [
      { x: 12, y: 0, to: 'hub', tx: 12, ty: 18, dir: 'up' },
      { x: 13, y: 0, to: 'hub', tx: 13, ty: 18, dir: 'up' },
      { x: 14, y: 17, to: 'rechenzentrum', tx: 9, ty: 12, dir: 'up' },
    ],
    npcs: [
      { id: 'cleo', name: 'Cleo', look: 'dev', x: 4, y: 7, dir: 'right',
        trainer: { id: 'tr-cleo', title: 'Entwicklerin', d: 2, team: [{ tool: 'cursor', hp: 2 }, { tool: 'copilot', hp: 2 }], reward: 70, sight: 4,
          intro: ['Ich schreibe Code nur noch mit KI-Assistenz. Verstehen muss ich ihn trotzdem!'],
          win: ['Sauber. Kein einziger Bug in deinen Antworten.'],
          after: ['Ein KI-Code-Vorschlag ist ein Vorschlag. Das Review bleibt Pflicht.'] } },
      { id: 'sam', name: 'Sam', look: 'student', x: 21, y: 11, dir: 'left',
        trainer: { id: 'tr-sam', title: 'Automatisierer', d: 2, team: [{ tool: 'make', hp: 2 }, { tool: 'zapier', hp: 2 }], reward: 70, sight: 3,
          intro: ['Ich automatisiere alles. Sogar meine Quiz-Antworten. Fast.'],
          win: ['Hätte ich das mal automatisiert …'],
          after: ['Bei Zapier heißen Automationen „Zaps“, bei Make „Szenarien“.'] } },
      { id: 'werner', name: 'Werner', look: 'trainer', x: 13, y: 7, dir: 'down',
        trainer: { id: 'tr-werner', title: 'Workflow-Trainer', d: 2, team: [{ tool: 'n8n', hp: 2 }, { tool: 'langchain', hp: 2 }, { tool: 'huggingface', hp: 2 }], reward: 200, badge: 'workflow', sight: 4,
          intro: ['Ich bin Workflow-Werner. Trigger, Knoten, Agenten: Das ist mein Wald.', 'Mal sehen, ob dein Wissen sauber durchläuft!'],
          win: ['Läuft! Die Workflow-Plakette gehört dir.'],
          after: ['Mit drei Plaketten lässt dich der Security-Bot ins Rechenzentrum.', 'Dort wartet der Buzzword-Baron. Nimm genug Kaffee mit.'] } },
      { id: 'bot', name: 'Security-Bot', look: 'bot', x: 14, y: 18, dir: 'down', action: 'bot', hideIfBadges: 3 },
    ],
    signs: {
      '17,7': ['Automations-Wald.', 'Im Süden liegt das Rechenzentrum. Zutritt nur mit drei Plaketten.'],
    },
    items: [
      { id: 'f-kaffee', x: 1, y: 21, item: 'kaffee', n: 2 },
      { id: 'f-super', x: 24, y: 1, item: 'superball', n: 2 },
      { id: 'f-ball', x: 10, y: 8, item: 'ball', n: 3 },
    ],
  },

  rechenzentrum: {
    id: 'rechenzentrum', name: 'Rechenzentrum', music: 'cave', indoor: true, d: [3, 3], rate: 0.1,
    encounters: ['ollama', 'llama', 'huggingface'],
    rows: [
      'WWWWWWWWWWWWWWWWWWWW',
      'WXXXXXXX____XXXXXXXW',
      'W_kkkk_________kkkkW',
      'W_kkkk_XX__XX__kkkkW',
      'W______XX__XX______W',
      'WXXXX__________XXXXW',
      'W_kkk__XX__XX__kkk_W',
      'W_kkk__XX__XX__kkk_W',
      'W__________________W',
      'WXX_XXXX____XXXX_XXW',
      'W_kkkkk______kkkkk_W',
      'W_kkkkk______kkkkk_W',
      'W__________________W',
      'WWWWWWWWWMMWWWWWWWWW',
    ],
    warps: [
      { x: 9, y: 13, to: 'wald', tx: 14, ty: 18, dir: 'down' },
      { x: 10, y: 13, to: 'wald', tx: 14, ty: 18, dir: 'down' },
    ],
    npcs: [
      { id: 'baron', name: 'Buzzword-Baron', look: 'boss', x: 9, y: 2, dir: 'down',
        trainer: { id: 'tr-baron', title: 'Endgegner', d: 3, boss: true, team: [{ tool: 'llama', hp: 3 }, { tool: 'gemini', hp: 3 }, { tool: 'claude', hp: 3 }], reward: 500, sight: 6,
          intro: ['Willkommen in meinem Rechenzentrum, {name}!', 'Ich bin der Buzzword-Baron. Ich sage „disruptiv“, „synergetisch“ und „game-changing“, aber nie, was ich konkret meine.', 'Mal sehen, ob echtes Wissen gegen heiße Luft gewinnt!'],
          win: ['Unmöglich … konkretes Wissen schlägt Buzzwords?', 'Na gut. Ab heute sage ich nur noch, was ich auch erklären kann.'],
          after: ['Ich übe jetzt Sätze ohne „disruptiv“. Schwerer als gedacht.'] } },
      { id: 'ari', name: 'Ari', look: 'dev', x: 16, y: 12, dir: 'left',
        lines: ['Die Kabel hier summen voller Daten. Manchmal springen seltene Tools heraus: Llama und Ollama.', 'Der Baron ganz hinten stellt nur schwere Fragen. Nimm genug Kaffee mit.'] },
    ],
    signs: {},
    items: [{ id: 'r-kaffee', x: 18, y: 8, item: 'kaffee', n: 2 }],
  },
};
