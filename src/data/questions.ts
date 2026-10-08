import { game } from '../state';

export interface Question {
  id: string;
  q: string;
  /** Die erste Antwort ist immer die richtige; die Reihenfolge wird im Kampf gemischt. */
  a: [string, string, string, string];
  e: string;
  d: 1 | 2 | 3;
  tool?: string;
}

type Raw = Omit<Question, 'id'>;

const RAW: Raw[] = [
  // ---------- Tool-Fragen ----------
  { tool: 'chatgpt', d: 1, q: 'Welches Unternehmen hat ChatGPT entwickelt?', a: ['OpenAI', 'Google', 'Meta', 'Anthropic'], e: 'ChatGPT stammt von OpenAI und ging im November 2022 online.' },
  { tool: 'chatgpt', d: 2, q: 'Wofür steht „GPT“?', a: ['Generative Pre-trained Transformer', 'General Purpose Technology', 'Global Prompt Tool', 'Graphical Processing Thread'], e: 'Ein Transformer-Modell, vortrainiert auf großen Textmengen, das Text erzeugt.' },
  { tool: 'gemini', d: 1, q: 'Von welchem Unternehmen stammt Gemini?', a: ['Google', 'Amazon', 'OpenAI', 'IBM'], e: 'Gemini wird von Google DeepMind entwickelt.' },
  { tool: 'gemini', d: 1, q: 'Gemini ist „multimodal“. Was heißt das?', a: ['Es verarbeitet verschiedene Datenarten wie Text, Bild und Audio', 'Es läuft auf mehreren Servern', 'Es hat mehrere Benutzerkonten', 'Es kennt mehrere Betriebssysteme'], e: 'Multimodal heißt: mehrere Eingabe- und Ausgabearten, nicht nur Text.' },
  { tool: 'perplexity', d: 1, q: 'Was unterscheidet Perplexity von einem reinen Chatbot?', a: ['Es durchsucht das Web und nennt Quellen', 'Es erzeugt nur Bilder', 'Es funktioniert nur offline', 'Es ist eine Programmiersprache'], e: 'Perplexity kombiniert Websuche mit einem Sprachmodell und verlinkt die Quellen.' },
  { tool: 'deepl', d: 2, q: 'In welcher Stadt hat DeepL seinen Sitz?', a: ['Köln', 'San Francisco', 'Paris', 'London'], e: 'DeepL ist ein KI-Unternehmen aus Köln.' },
  { tool: 'deepl', d: 1, q: 'Wofür nutzt man DeepL vor allem?', a: ['Texte übersetzen und umformulieren', 'Bilder erzeugen', 'Code ausführen', 'Videos schneiden'], e: 'DeepL übersetzt Texte und hilft mit DeepL Write beim Umformulieren.' },
  { tool: 'lechat', d: 2, q: 'Aus welchem Land kommt Mistral AI, der Anbieter von Le Chat?', a: ['Frankreich', 'Deutschland', 'Kanada', 'Japan'], e: 'Mistral AI wurde 2023 in Paris gegründet.' },
  { tool: 'claude', d: 1, q: 'Wer entwickelt Claude?', a: ['Anthropic', 'OpenAI', 'Mistral AI', 'Microsoft'], e: 'Claude ist die Modellfamilie von Anthropic.' },
  { tool: 'claude', d: 3, q: 'Was ist MCP (Model Context Protocol)?', a: ['Ein offener Standard, um KI-Anwendungen mit Tools und Datenquellen zu verbinden', 'Ein Dateiformat für Modellgewichte', 'Ein Grafikchip für KI-Training', 'Ein Bildgenerator'], e: 'Anthropic hat MCP im November 2024 als offenen Standard veröffentlicht.' },
  { tool: 'midjourney', d: 1, q: 'Was erzeugt Midjourney?', a: ['Bilder aus Text-Prompts', 'Tabellen aus PDFs', 'Musiknoten', 'Datenbanken'], e: 'Midjourney ist ein Text-zu-Bild-Generator.' },
  { tool: 'stablediffusion', d: 2, q: 'Wie entsteht ein Bild in einem Diffusionsmodell wie Stable Diffusion?', a: ['Es wird Schritt für Schritt aus Rauschen herausgerechnet', 'Es wird aus einer Bilddatenbank kopiert', 'Es wird Pixel für Pixel von Hand gezeichnet', 'Es wird aus einem Video ausgeschnitten'], e: 'Diffusionsmodelle lernen, Rauschen schrittweise zu entfernen, bis ein Bild entsteht.' },
  { tool: 'runway', d: 1, q: 'Worauf ist Runway spezialisiert?', a: ['KI-Videos erzeugen und bearbeiten', 'Flugpläne berechnen', 'Tabellen auswerten', 'Passwörter verwalten'], e: 'Runway erzeugt Videos aus Text oder Bildern und bearbeitet vorhandenes Material.' },
  { tool: 'suno', d: 1, q: 'Was erzeugt Suno aus einem Text-Prompt?', a: ['Ganze Songs mit Gesang und Instrumenten', 'Präsentationen', 'Datenbanken', '3D-Modelle'], e: 'Suno komponiert komplette Songs inklusive Gesang.' },
  { tool: 'whisper', d: 1, q: 'Wofür setzt man Whisper ein?', a: ['Gesprochene Sprache in Text umwandeln', 'Bilder retuschieren', 'Server überwachen', 'E-Mails verschlüsseln'], e: 'Whisper ist ein Modell für Transkription und Übersetzung von Audio.' },
  { tool: 'elevenlabs', d: 1, q: 'Worauf ist ElevenLabs spezialisiert?', a: ['Künstliche Stimmen (Text-to-Speech)', 'Tabellenkalkulation', 'Gesichtserkennung', 'Code-Review'], e: 'ElevenLabs macht aus Text gesprochene Sprache.' },
  { tool: 'n8n', d: 1, q: 'Was baut man mit n8n?', a: ['Automatisierte Workflows aus verbundenen Knoten', '3D-Modelle', 'Videoschnitte', 'Eigene Sprachmodelle von Grund auf'], e: 'In n8n verbindest du Knoten (Nodes) zu Workflows.' },
  { tool: 'n8n', d: 2, q: 'Was startet einen n8n-Workflow?', a: ['Ein Trigger, z. B. ein Webhook oder ein Zeitplan', 'Ein Neustart des Rechners', 'Ein Druckauftrag', 'Eine Grafikkarte'], e: 'Jeder Workflow beginnt mit einem Trigger-Knoten.' },
  { tool: 'zapier', d: 2, q: 'Wie heißt eine Automation in Zapier?', a: ['Zap', 'Flow', 'Szenario', 'Pipeline'], e: 'Bei Zapier heißen Automationen „Zaps“.' },
  { tool: 'make', d: 3, q: 'Wie hieß die Automatisierungsplattform Make früher?', a: ['Integromat', 'Automatica', 'Flowmaster', 'Zapier Pro'], e: 'Make hieß bis 2022 Integromat.' },
  { tool: 'langchain', d: 2, q: 'Was ist LangChain?', a: ['Ein Framework zum Bauen von Anwendungen mit Sprachmodellen', 'Eine Blockchain', 'Ein Grafikprozessor', 'Ein Messenger'], e: 'LangChain liefert Bausteine für Prompts, Tools, Agenten und Retrieval.' },
  { tool: 'cursor', d: 1, q: 'Was ist Cursor?', a: ['Ein Code-Editor mit eingebauter KI', 'Ein Mauszeiger-Treiber', 'Ein Bildformat', 'Ein Cloud-Speicher'], e: 'Cursor ist ein KI-Code-Editor auf Basis von VS Code.' },
  { tool: 'copilot', d: 1, q: 'Wo hilft GitHub Copilot vor allem?', a: ['Direkt im Code-Editor mit Code-Vorschlägen', 'Beim Buchen von Flügen', 'Beim Schneiden von Videos', 'In der Buchhaltung'], e: 'Copilot ergänzt und erklärt Code im Editor.' },
  { tool: 'huggingface', d: 1, q: 'Was findest du auf Hugging Face?', a: ['Offene Modelle, Datensätze und Demos', 'Nur Emojis', 'Streaming-Filme', 'Online-Banking'], e: 'Hugging Face hostet hunderttausende Modelle und Datensätze.' },
  { tool: 'huggingface', d: 3, q: 'Was ist ein „Space“ auf Hugging Face?', a: ['Eine gehostete Demo-App für ein Modell', 'Ein Speicherplatz für Fotos', 'Ein Chatraum', 'Eine Grafikkarte'], e: 'In Spaces kann jede:r Modelle direkt im Browser ausprobieren.' },
  { tool: 'llama', d: 2, q: 'Was ist an Metas Llama-Modellen besonders?', a: ['Die Modellgewichte sind herunterladbar', 'Sie laufen nur auf Smartphones', 'Sie können nur Bilder erzeugen', 'Sie verstehen nur Deutsch'], e: 'Mit offenen Gewichten kannst du ein Modell selbst betreiben und anpassen.' },
  { tool: 'ollama', d: 2, q: 'Wofür nutzt man Ollama?', a: ['Offene Sprachmodelle lokal auf dem eigenen Rechner ausführen', 'Videos streamen', 'Rechnungen schreiben', 'Webseiten hosten'], e: 'Ollama lädt und startet Modelle lokal, ganz ohne Cloud.' },

  // ---------- Grundlagen ----------
  { d: 1, q: 'Wofür steht „LLM“?', a: ['Large Language Model', 'Linear Logic Machine', 'Long Learning Memory', 'Low Latency Mode'], e: 'Ein LLM ist ein großes Sprachmodell.' },
  { d: 1, q: 'Was ist ein „Prompt“?', a: ['Die Eingabe oder Anweisung an das Modell', 'Die Antwort des Modells', 'Ein Hardware-Bauteil', 'Ein Fehlercode'], e: 'Der Prompt ist das, was du dem Modell schreibst.' },
  { d: 1, q: 'Was meint man mit „Halluzination“ bei KI?', a: ['Das Modell erfindet plausibel klingende, aber falsche Inhalte', 'Das Modell stürzt ab', 'Das Modell erzeugt Bilder', 'Das Modell wird langsamer'], e: 'Darum gilt: Fakten immer prüfen.' },
  { d: 1, q: 'Was ist ein „Token“ bei Sprachmodellen?', a: ['Ein Textbaustein, z. B. ein Wort oder Wortteil', 'Ein Passwort', 'Eine Kryptowährung', 'Ein Bildpixel'], e: 'Modelle zerlegen Text in Tokens und rechnen damit.' },
  { d: 1, q: 'Was tust du mit wichtigen Fakten aus einer KI-Antwort?', a: ['Mit verlässlichen Quellen gegenprüfen', 'Ungeprüft weitergeben', 'Ignorieren', 'Ausdrucken'], e: 'KI kann sich irren. Bei wichtigen Infos immer gegenchecken.' },
  { d: 1, q: 'Was gehört nicht in einen öffentlichen KI-Chat?', a: ['Passwörter und vertrauliche Firmendaten', 'Eine Rezeptidee', 'Eine Frage zur Grammatik', 'Ein Gedicht über Katzen'], e: 'Vertrauliches nur in Tools, deren Datenverarbeitung geklärt ist.' },
  { d: 1, q: 'Was bedeutet „generative KI“?', a: ['KI, die neue Inhalte wie Texte, Bilder oder Musik erzeugt', 'KI, die nur Zahlen sortiert', 'KI für Stromgeneratoren', 'KI, die nur Fragen stellt'], e: 'Generative KI erzeugt Neues, statt nur zu klassifizieren.' },
  { d: 1, q: 'Was ist Machine Learning?', a: ['Systeme lernen Muster aus Daten statt aus festen Regeln', 'Maschinen bauen andere Maschinen', 'Programmieren in Maschinensprache', 'Lernen mit Karteikarten'], e: 'Statt jede Regel zu programmieren, lernt das System aus Beispielen.' },
  { d: 1, q: 'Was ist ein Deepfake?', a: ['Täuschend echte, KI-erzeugte Bilder, Videos oder Stimmen realer Personen', 'Ein besonders großer Datensatz', 'Ein gefälschter Geldschein', 'Ein Fehler im Code'], e: 'Deepfakes sind ein Grund, warum Kennzeichnungspflichten diskutiert werden.' },
  { d: 1, q: 'Was macht einen Prompt meist besser?', a: ['Ziel, Kontext und gewünschtes Format klar nennen', 'Möglichst wenige Wörter', 'Nur Großbuchstaben', 'Viele Ausrufezeichen'], e: 'Je klarer die Aufgabe, desto brauchbarer die Antwort.' },
  { d: 1, q: 'Welche Hardware wird für KI-Training meist genutzt?', a: ['GPUs (Grafikprozessoren)', 'Disketten', 'Drucker', 'Soundkarten'], e: 'GPUs rechnen viele Operationen parallel.' },
  { d: 1, q: 'Welches dieser Tools ist ein Bildgenerator?', a: ['Midjourney', 'Excel', 'Zoom', 'Slack'], e: 'Midjourney erzeugt Bilder aus Text.' },
  { d: 1, q: 'Was ist Spracherkennung?', a: ['Gesprochene Sprache wird in Text umgewandelt', 'Text wird übersetzt', 'Ein Sprachkurs', 'Die Rechtschreibprüfung'], e: 'Ein Beispiel dafür ist Whisper.' },
  { d: 1, q: 'Wobei hilft ein KI-Assistent im Büro typischerweise?', a: ['Texte entwerfen, zusammenfassen und umformulieren', 'Kaffee kochen', 'Verträge rechtsgültig unterschreiben', 'Strom sparen'], e: 'Entwürfe, Zusammenfassungen, Ideen: Das Prüfen bleibt bei dir.' },
  { d: 1, q: 'Woraus lernt ein Sprachmodell beim Training?', a: ['Aus sehr großen Mengen an Text', 'Aus Wetterdaten', 'Nur aus Wörterbüchern', 'Aus Musiknoten'], e: 'Es lernt statistische Muster der Sprache.' },

  // ---------- Fortgeschritten ----------
  { d: 2, q: 'Wofür steht RAG?', a: ['Retrieval-Augmented Generation', 'Random Access Graph', 'Rapid AI Growth', 'Rule-Based Agent'], e: 'RAG holt passende Dokumente und gibt sie dem Modell als Kontext mit.' },
  { d: 2, q: 'Was beschreibt das „Kontextfenster“?', a: ['Wie viele Tokens ein Modell auf einmal verarbeiten kann', 'Die Größe des Chatfensters', 'Die Bildschirmauflösung', 'Die Anzahl der Nutzer'], e: 'Was nicht ins Kontextfenster passt, sieht das Modell nicht.' },
  { d: 2, q: 'Was regelt die „Temperatur“ bei Sprachmodellen?', a: ['Wie zufällig bzw. kreativ die Antworten ausfallen', 'Die Kühlung der Server', 'Die Antwortlänge', 'Die Sprache der Antwort'], e: 'Niedrige Temperatur = vorhersehbarer, hohe = variabler.' },
  { d: 2, q: 'Was ist „Fine-Tuning“?', a: ['Ein vortrainiertes Modell mit eigenen Daten weitertrainieren', 'Den Prompt kürzen', 'Den Bildschirm kalibrieren', 'Ein Modell löschen'], e: 'Fine-Tuning passt ein Modell an eine bestimmte Aufgabe an.' },
  { d: 2, q: 'Was ist „Few-Shot-Prompting“?', a: ['Dem Modell ein paar Beispiele im Prompt mitgeben', 'Nur sehr kurze Prompts schreiben', 'Das Modell wenige Male aufrufen', 'Bilder mit wenig Licht erzeugen'], e: 'Beispiele zeigen dem Modell das gewünschte Format.' },
  { d: 2, q: 'Wozu dient ein System-Prompt?', a: ['Er legt Rolle und Grundverhalten des Modells fest', 'Er startet das Betriebssystem', 'Er löscht den Verlauf', 'Er misst die Antwortzeit'], e: 'Der System-Prompt gilt für das ganze Gespräch.' },
  { d: 2, q: 'Was ist ein KI-Agent?', a: ['Ein System, das Schritte plant und selbstständig Tools nutzt', 'Ein Antivirenprogramm', 'Ein menschlicher Support-Mitarbeiter', 'Ein Browser-Plugin für Werbung'], e: 'Agenten kombinieren ein Modell mit Tools und einer Schleife aus Planen und Handeln.' },
  { d: 2, q: 'Was ist ein „Embedding“?', a: ['Ein Zahlenvektor, der die Bedeutung von Text abbildet', 'Ein eingebettetes Video', 'Ein Dateianhang', 'Eine Schriftart'], e: 'Ähnliche Bedeutung ergibt ähnliche Vektoren. Grundlage für semantische Suche.' },
  { d: 2, q: 'Was bedeutet „Open Weights“ bei einem Modell?', a: ['Die Modellgewichte sind öffentlich herunterladbar', 'Das Modell ist besonders leicht', 'Das Modell ist kostenlos per Chat nutzbar', 'Der Quellcode der Website ist offen'], e: 'Mit offenen Gewichten kannst du ein Modell selbst betreiben.' },
  { d: 2, q: 'Nach welchem Prinzip ordnet der EU AI Act KI-Systeme ein?', a: ['Nach Risikostufen', 'Nach Herstellerland', 'Nach Preis', 'Nach Anzahl der Nutzer'], e: 'Je höher das Risiko, desto strengere Pflichten.' },
  { d: 2, q: 'Was prüfst du, bevor du Kundendaten in ein KI-Tool eingibst?', a: ['Ob die Verarbeitung datenschutzkonform geregelt ist, z. B. per AV-Vertrag', 'Ob das Tool einen Dark Mode hat', 'Ob das Logo modern ist', 'Nichts, KI-Tools sind immer sicher'], e: 'Personenbezogene Daten fallen unter die DSGVO.' },
  { d: 2, q: 'Was bedeutet „Chain-of-Thought“-Prompting?', a: ['Das Modell löst eine Aufgabe in nachvollziehbaren Zwischenschritten', 'Mehrere Chats werden verkettet', 'Prompts werden per Kettenbrief verschickt', 'Das Modell wird neu gestartet'], e: 'Zwischenschritte verbessern oft Ergebnisse bei Logik- und Rechenaufgaben.' },
  { d: 2, q: 'Was ist ein Webhook?', a: ['Eine URL, die bei einem Ereignis automatisch Daten empfängt', 'Ein Angelhaken für Daten', 'Ein Browser-Lesezeichen', 'Ein Passwort-Manager'], e: 'Webhooks sind ein typischer Trigger in n8n, Make oder Zapier.' },
  { d: 2, q: 'Was ist eine API?', a: ['Eine Schnittstelle, über die Programme miteinander kommunizieren', 'Ein KI-Modell', 'Ein Dateityp für Bilder', 'Ein Virenscanner'], e: 'Über APIs binden Automationen KI-Modelle ein.' },
  { d: 2, q: 'Was ist JSON?', a: ['Ein Textformat für strukturierte Daten', 'Ein Bildformat', 'Eine Programmiersprache für KI', 'Ein Videocodec'], e: 'JSON ist das Standardformat für Daten zwischen APIs.' },
  { d: 2, q: 'Wofür nutzt man eine Vektordatenbank?', a: ['Um Embeddings zu speichern und ähnliche Inhalte zu finden', 'Um Bilder zu drehen', 'Um Passwörter zu speichern', 'Um Tabellen zu drucken'], e: 'Vektordatenbanken sind ein Kernbaustein vieler RAG-Systeme.' },
  { d: 2, q: 'Was ist der „Knowledge Cutoff“ eines Modells?', a: ['Der Zeitpunkt, bis zu dem seine Trainingsdaten reichen', 'Die maximale Antwortlänge', 'Die Abschaltung bei Missbrauch', 'Der Preis pro Anfrage'], e: 'Neueres kennt das Modell nur, wenn es z. B. per Suche Zugriff bekommt.' },
  { d: 2, q: 'Was bedeutet „Inferenz“ bei KI?', a: ['Ein trainiertes Modell anwenden, um eine Ausgabe zu erzeugen', 'Ein Modell trainieren', 'Daten löschen', 'Eine Konferenz über KI'], e: 'Training passiert einmal, Inferenz bei jeder Anfrage.' },
  { d: 2, q: 'Was ist „Zero-Shot“-Prompting?', a: ['Eine Aufgabe stellen, ganz ohne Beispiele', 'Einen Prompt nie abschicken', 'Ohne Internet arbeiten', 'Null Tokens verwenden'], e: 'Das Gegenstück ist Few-Shot mit Beispielen.' },
  { d: 2, q: 'Was sind „Guardrails“ bei KI-Systemen?', a: ['Schutzregeln, die Ein- und Ausgaben begrenzen', 'Leitplanken für selbstfahrende Autos', 'Kabelkanäle im Serverraum', 'Werbebanner'], e: 'Guardrails verhindern z. B. unerwünschte oder riskante Antworten.' },

  // ---------- Expertenwissen ----------
  { d: 3, q: 'Welche Architektur steckt hinter den meisten heutigen Sprachmodellen?', a: ['Transformer', 'Von-Neumann-Rechner', 'Entscheidungsbaum', 'Relationale Datenbank'], e: 'Vorgestellt 2017 im Paper „Attention Is All You Need“.' },
  { d: 3, q: 'Was ist „Prompt Injection“?', a: ['Versteckte Anweisungen in Inhalten, die ein Modell manipulieren sollen', 'Ein besonders langer Prompt', 'Eine Impfung für Server', 'Das Kopieren eines Prompts'], e: 'Ein Sicherheitsrisiko, vor allem für Agenten, die Webseiten oder Mails lesen.' },
  { d: 3, q: 'Wer schlug 1950 das „Imitation Game“ vor, heute Turing-Test genannt?', a: ['Alan Turing', 'Ada Lovelace', 'John von Neumann', 'Konrad Zuse'], e: 'Turing fragte: Kann eine Maschine denken?' },
  { d: 3, q: 'Was ist „Deep Learning“?', a: ['Maschinelles Lernen mit neuronalen Netzen aus vielen Schichten', 'Besonders langes Lernen für Prüfungen', 'Eine Datenbank für Unterwasserfotos', 'Ein Verschlüsselungsverfahren'], e: '„Deep“ bezieht sich auf die vielen Schichten.' },
  { d: 3, q: 'Was ist „Attention“ in einem Transformer?', a: ['Ein Mechanismus, der gewichtet, welche Tokens füreinander wichtig sind', 'Ein Warnsignal bei Fehlern', 'Die Aufmerksamkeit der Nutzer', 'Ein Energiesparmodus'], e: 'So kann das Modell Zusammenhänge über lange Texte herstellen.' },
  { d: 3, q: 'Wofür steht RLHF?', a: ['Reinforcement Learning from Human Feedback', 'Rapid Language Handling Format', 'Real Life Human Factor', 'Recursive Logic for High Frequency'], e: 'Menschen bewerten Antworten, das Modell lernt daraus, hilfreicher zu antworten.' },
  { d: 3, q: 'Was bedeutet „Quantisierung“ bei Modellen?', a: ['Gewichte mit geringerer Genauigkeit speichern, um Speicher zu sparen', 'Ein Modell auf Quantencomputern ausführen', 'Die Antworten zählen', 'Die Trainingsdaten verdoppeln'], e: 'So laufen große Modelle auch auf kleinerer Hardware, z. B. mit Ollama.' },
  { d: 3, q: 'Wie arbeitet ein „Mixture of Experts“-Modell?', a: ['Pro Token ist nur ein Teil spezialisierter Teilnetze aktiv', 'Mehrere Menschen prüfen jede Antwort', 'Es fragt immer drei andere Modelle', 'Es läuft nur auf Expertenrechnern'], e: 'Das spart Rechenaufwand bei großer Gesamtgröße.' },
  { d: 3, q: 'Was ist „Overfitting“?', a: ['Ein Modell lernt die Trainingsdaten auswendig und verallgemeinert schlecht', 'Ein Modell ist zu groß für den Server', 'Zu viele Nutzer gleichzeitig', 'Ein zu langer Prompt'], e: 'Gute Modelle funktionieren auch auf Daten, die sie nie gesehen haben.' },
  { d: 3, q: 'Seit wann gelten die Verbote des EU AI Act für KI mit unannehmbarem Risiko?', a: ['Seit Februar 2025', 'Seit Januar 2019', 'Erst ab 2035', 'Sie gelten gar nicht'], e: 'Seit dem 2. Februar 2025 sind z. B. Social Scoring und manipulative KI verboten.' },
  { d: 3, q: 'Was verlangt Artikel 4 des EU AI Act von Unternehmen, die KI einsetzen?', a: ['Ausreichende KI-Kompetenz der Mitarbeitenden', 'Eine eigene KI-Abteilung', 'Einen KI-Beauftragten im Vorstand', 'Den Verzicht auf Cloud-Dienste'], e: 'Die Pflicht zur KI-Kompetenz (AI Literacy) gilt seit Februar 2025.' },
  { d: 3, q: 'Welche Konferenz von 1956 gilt als Geburtsstunde der KI-Forschung?', a: ['Die Dartmouth Conference', 'Der Web Summit', 'Die CES in Las Vegas', 'Die re:publica'], e: 'Organisiert u. a. von John McCarthy, der den Begriff „Artificial Intelligence“ prägte.' },
  { d: 3, q: 'Welcher Computer schlug 1997 Schachweltmeister Garri Kasparow?', a: ['Deep Blue', 'Watson', 'AlphaZero', 'HAL 9000'], e: 'Deep Blue wurde von IBM entwickelt.' },
  { d: 3, q: 'Gegen wen gewann AlphaGo 2016 das berühmte Go-Match?', a: ['Lee Sedol', 'Magnus Carlsen', 'Garri Kasparow', 'Ke Jie'], e: 'AlphaGo von DeepMind gewann 4 zu 1.' },
  { d: 3, q: 'Was ist „Distillation“ bei KI-Modellen?', a: ['Ein kleines Modell lernt von einem großen', 'Daten werden gefiltert', 'Ein Modell wird gelöscht', 'Strom wird gespart'], e: 'So entstehen schnelle, günstige Modelle mit ähnlicher Qualität.' },
];

export const QUESTIONS: Question[] = RAW.map((q, i) => ({ ...q, id: 'q' + i }));

const pickRandom = <T>(list: T[]): T => list[Math.floor(Math.random() * list.length)];

/**
 * Wählt eine Frage. Bei wilden Tools kommt zuerst eine Frage zum Tool selbst,
 * danach Fragen im Schwierigkeitsbereich der Gegend. Kürzlich gestellte Fragen werden gemieden.
 */
export function pickQuestion(range: [number, number], exclude: Set<string>, tool?: string): Question {
  const recent = game.s.asked;
  let q: Question | undefined;

  if (tool) {
    const own = QUESTIONS.filter((x) => x.tool === tool);
    if (own.length && !own.some((x) => exclude.has(x.id))) {
      const fresh = own.filter((x) => !recent.includes(x.id));
      q = pickRandom(fresh.length ? fresh : own);
    }
  }

  if (!q) {
    const [lo, hi] = range;
    const open = QUESTIONS.filter((x) => !exclude.has(x.id));
    const inRange = open.filter((x) => x.d >= lo && x.d <= hi);
    const fresh = inRange.filter((x) => !recent.includes(x.id));
    q = pickRandom(fresh.length ? fresh : inRange.length ? inRange : open.length ? open : QUESTIONS);
  }

  recent.push(q.id);
  if (recent.length > 50) recent.splice(0, recent.length - 50);
  return q;
}
