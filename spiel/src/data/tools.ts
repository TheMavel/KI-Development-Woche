export type Zone = 'wiese' | 'park' | 'wald' | 'rechenzentrum';
export type Skill = 'fifty' | 'insight' | 'shield' | 'double' | 'reveal' | 'time' | 'heal';

export interface Tool {
  id: string;
  name: string;
  type: string;
  maker: string;
  zone: Zone;
  rarity: 1 | 2 | 3;
  skill: Skill;
  skillName: string;
  dex: string;
}

export const ZONE_NAMES: Record<Zone, string> = {
  wiese: 'Prompt-Wiese',
  park: 'Pixel-Park',
  wald: 'Automations-Wald',
  rechenzentrum: 'Rechenzentrum',
};

export const RARITY: Record<1 | 2 | 3, string> = { 1: 'Häufig', 2: 'Selten', 3: 'Sehr selten' };

export const SKILL_TEXT: Record<Skill, string> = {
  fifty: 'Streicht zwei falsche Antworten.',
  insight: 'Streicht zwei falsche Antworten und schützt vor dem nächsten Fehler.',
  shield: 'Die nächste falsche Antwort kostet keinen Akku.',
  double: 'Die nächste richtige Antwort zählt doppelt.',
  reveal: 'Streicht eine falsche Antwort.',
  time: 'Gibt 15 Sekunden mehr Zeit. Ohne Timer: streicht eine falsche Antwort.',
  heal: 'Lädt 2 Akku-Punkte auf.',
};

export const TOOLS: Tool[] = [
  // Prompt-Wiese: Sprache, Suche, Übersetzung
  { id: 'chatgpt', name: 'ChatGPT', type: 'Sprache', maker: 'OpenAI', zone: 'wiese', rarity: 1, skill: 'shield', skillName: 'Zweite Meinung',
    dex: 'Chat-Assistent von OpenAI. Seit November 2022 öffentlich und der Grund, warum plötzlich alle über KI reden.' },
  { id: 'gemini', name: 'Gemini', type: 'Sprache', maker: 'Google', zone: 'wiese', rarity: 2, skill: 'fifty', skillName: 'Multimodaler Blick',
    dex: 'Multimodales Modell von Google DeepMind. Steckt in Workspace, Android und der Google-Suche.' },
  { id: 'perplexity', name: 'Perplexity', type: 'Suche', maker: 'Perplexity AI', zone: 'wiese', rarity: 1, skill: 'fifty', skillName: 'Quellen prüfen',
    dex: 'KI-Suchmaschine. Antwortet mit Quellenangaben, damit du nachprüfen kannst, woher die Info stammt.' },
  { id: 'deepl', name: 'DeepL', type: 'Übersetzung', maker: 'DeepL SE', zone: 'wiese', rarity: 1, skill: 'reveal', skillName: 'Übersetzen',
    dex: 'Übersetzer aus Köln. Bekannt für natürlich klingende Übersetzungen, besonders in europäischen Sprachen.' },
  { id: 'lechat', name: 'Le Chat', type: 'Sprache', maker: 'Mistral AI', zone: 'wiese', rarity: 2, skill: 'shield', skillName: 'Zweiter Blick',
    dex: 'Assistent von Mistral AI aus Paris. Europas bekanntester Herausforderer der großen US-Modelle.' },
  { id: 'claude', name: 'Claude', type: 'Sprache', maker: 'Anthropic', zone: 'wiese', rarity: 3, skill: 'insight', skillName: 'Gründlich nachdenken',
    dex: 'Sprachmodell von Anthropic. Stark beim Schreiben, Analysieren und Programmieren. Verbindet sich über MCP mit Tools.' },

  // Pixel-Park: Bild, Video, Musik, Audio
  { id: 'midjourney', name: 'Midjourney', type: 'Bild', maker: 'Midjourney', zone: 'park', rarity: 2, skill: 'reveal', skillName: 'Visualisieren',
    dex: 'Erzeugt Bilder aus Text-Prompts. Bekannt für einen eigenen, künstlerischen Stil.' },
  { id: 'stablediffusion', name: 'Stable Diffusion', type: 'Bild', maker: 'Stability AI', zone: 'park', rarity: 1, skill: 'reveal', skillName: 'Entrauschen',
    dex: 'Bildmodell von Stability AI mit offen verfügbaren Gewichten. Läuft auch lokal auf dem eigenen Rechner.' },
  { id: 'runway', name: 'Runway', type: 'Video', maker: 'Runway', zone: 'park', rarity: 2, skill: 'time', skillName: 'Zeitlupe',
    dex: 'Erzeugt und bearbeitet Videos mit KI. Aus Text, Bildern oder vorhandenem Material.' },
  { id: 'suno', name: 'Suno', type: 'Musik', maker: 'Suno', zone: 'park', rarity: 2, skill: 'time', skillName: 'Ohrwurm',
    dex: 'Komponiert ganze Songs mit Gesang und Instrumenten aus einem kurzen Text-Prompt.' },
  { id: 'whisper', name: 'Whisper', type: 'Audio', maker: 'OpenAI', zone: 'park', rarity: 1, skill: 'time', skillName: 'Mitschreiben',
    dex: 'Spracherkennung von OpenAI. Macht aus Audio Text, in vielen Sprachen. Als offenes Modell verfügbar.' },
  { id: 'elevenlabs', name: 'ElevenLabs', type: 'Audio', maker: 'ElevenLabs', zone: 'park', rarity: 2, skill: 'shield', skillName: 'Gut zureden',
    dex: 'Erzeugt natürlich klingende Stimmen aus Text und vertont Inhalte in vielen Sprachen.' },

  // Automations-Wald: Automation, Code, Plattformen
  { id: 'n8n', name: 'n8n', type: 'Automation', maker: 'n8n GmbH', zone: 'wald', rarity: 2, skill: 'double', skillName: 'Automatisieren',
    dex: 'Workflow-Automatisierung aus Berlin. Verbindet Apps, Daten und KI-Modelle über Knoten. Auch selbst hostbar.' },
  { id: 'zapier', name: 'Zapier', type: 'Automation', maker: 'Zapier', zone: 'wald', rarity: 1, skill: 'double', skillName: 'Zap auslösen',
    dex: 'Verbindet tausende Web-Apps miteinander. Eine Automation heißt hier „Zap“.' },
  { id: 'make', name: 'Make', type: 'Automation', maker: 'Make', zone: 'wald', rarity: 1, skill: 'double', skillName: 'Szenario starten',
    dex: 'Visuelle Automatisierung, früher bekannt als Integromat. Abläufe heißen hier „Szenarien“.' },
  { id: 'langchain', name: 'LangChain', type: 'Framework', maker: 'LangChain', zone: 'wald', rarity: 2, skill: 'double', skillName: 'Verketten',
    dex: 'Framework für LLM-Anwendungen in Python und JavaScript: Ketten, Agenten, RAG.' },
  { id: 'cursor', name: 'Cursor', type: 'Code', maker: 'Anysphere', zone: 'wald', rarity: 1, skill: 'reveal', skillName: 'Autocomplete',
    dex: 'Code-Editor mit eingebauter KI. Basiert auf VS Code und kann ganze Änderungen vorschlagen.' },
  { id: 'copilot', name: 'GitHub Copilot', type: 'Code', maker: 'GitHub', zone: 'wald', rarity: 1, skill: 'reveal', skillName: 'Pair Programming',
    dex: 'KI-Pair-Programmer von GitHub. Schlägt Code direkt im Editor vor.' },
  { id: 'huggingface', name: 'Hugging Face', type: 'Hub', maker: 'Hugging Face', zone: 'wald', rarity: 3, skill: 'heal', skillName: 'Community-Power',
    dex: 'Die große Plattform für offene Modelle, Datensätze und Demos. Das GitHub der KI-Welt.' },

  // Rechenzentrum: offene und lokale Modelle
  { id: 'ollama', name: 'Ollama', type: 'Lokal', maker: 'Ollama', zone: 'rechenzentrum', rarity: 2, skill: 'heal', skillName: 'Lokal laden',
    dex: 'Holt offene Sprachmodelle mit einem Befehl auf den eigenen Rechner. Keine Cloud nötig.' },
  { id: 'llama', name: 'Llama', type: 'Open Weights', maker: 'Meta', zone: 'rechenzentrum', rarity: 3, skill: 'insight', skillName: 'Offene Gewichte',
    dex: 'Modellfamilie von Meta mit herunterladbaren Gewichten. Basis für unzählige eigene Modelle.' },
];

const BY_ID = new Map(TOOLS.map((t) => [t.id, t]));
export const toolById = (id: string): Tool => {
  const t = BY_ID.get(id);
  if (!t) throw new Error(`Unbekanntes Tool: ${id}`);
  return t;
};
