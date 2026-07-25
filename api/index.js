// server.ts
import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Modality, Type } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

// src/utils/whatsappParser.ts
function parseWhatsAppTxt(content) {
  if (!content || content.trim().length === 0) {
    return {
      isValid: false,
      error: "Le fichier est vide. S'il te pla\xEEt, importe un vrai export de chat WhatsApp .txt.",
      participants: [],
      messageCount: 0,
      rawText: ""
    };
  }
  const lines = content.split(/\r?\n/);
  const participantCountMap = {};
  let validMessageCount = 0;
  const processedLines = [];
  const messageRegex = /^(?:\[?(\d{1,4}[\/.\-]\d{1,2}[\/.\-]\d{1,4})(?:,\s+à\s+|,\s+at\s+|,\s+|\s+à\s+|\s+at\s+|\s+)(\d{1,2}[:.]\d{1,2}(?::\d{1,2})?)(?:\s*[APap][Mm])?\]?\s*(?:-\s*|:\s*)?\s*([^:]+?):\s*(.*))$/;
  const bracketRegex = /^\[?(\d{1,4}[\/.\-]\d{1,2}[\/.\-]\d{1,4}),?\s+(\d{1,2}:\d{1,2}(?::\d{1,2})?)\]?\s*(?:-\s*|:\s*)?\s*([^:]+?):\s*(.*)$/;
  const fallbackRegex = /^\[?(?:\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{1,4}|\d{4}[\/.\-]\d{1,2}[\/.\-]\d{1,2}).*?\]?\s*(?:-\s*|:\s*)?\s*([^:]+?):\s*(.*)$/;
  for (const line of lines) {
    const cleanLine = line.replace(/[\u200e\u200f\u202a-\u202e]/g, "").trim();
    let sender = "";
    let text = "";
    let matched = false;
    const match = cleanLine.match(messageRegex);
    if (match) {
      sender = match[3].trim();
      text = match[4].trim();
      matched = true;
    } else {
      const matchBracket = cleanLine.match(bracketRegex);
      if (matchBracket) {
        sender = matchBracket[3].trim();
        text = matchBracket[4].trim();
        matched = true;
      } else {
        const matchFallback = cleanLine.match(fallbackRegex);
        if (matchFallback) {
          sender = matchFallback[1].trim();
          text = matchFallback[2].trim();
          if (sender.length < 40 && sender.split(/\s+/).length <= 5 && !sender.includes("  ")) {
            matched = true;
          }
        }
      }
    }
    if (matched) {
      const senderLower = sender.toLowerCase();
      const textLower = text.toLowerCase();
      if (senderLower.includes("whatsapp") || senderLower.includes("syst\xE8me") || senderLower.includes("chiffr\xE9") || senderLower.includes("chiffre") || textLower.includes("chiffr\xE9s") || textLower.includes("chiffres") || textLower.includes("a cr\xE9\xE9 le groupe") || textLower.includes("cr\xE9\xE9 ce groupe") || textLower.includes("a \xE9t\xE9 ajout\xE9") || textLower.includes("vous a ajout\xE9") || textLower.includes("a quitt\xE9") || textLower.includes("a rejoint") || textLower.includes("supprim\xE9")) {
        continue;
      }
      participantCountMap[sender] = (participantCountMap[sender] || 0) + 1;
      validMessageCount++;
      processedLines.push(`${sender}: ${text}`);
    } else {
      if (processedLines.length > 0 && cleanLine.length > 0) {
        processedLines[processedLines.length - 1] += ` ${cleanLine}`;
      }
    }
  }
  if (validMessageCount < 5) {
    return {
      isValid: false,
      error: "Nous n'avons pas pu d\xE9tecter d'\xE9changes de messages valides dans ce fichier. Assure-toi d'importer un fichier .txt g\xE9n\xE9r\xE9 par l'option 'Exporter la discussion' de WhatsApp sans m\xE9dias.",
      participants: [],
      messageCount: 0,
      rawText: ""
    };
  }
  const participants = Object.entries(participantCountMap).map(([name, count]) => ({
    name,
    messageCount: count,
    percentage: Math.round(count / validMessageCount * 100)
  })).sort((a, b) => b.messageCount - a.messageCount);
  const maxMessages = 400;
  const sampleLines = processedLines.slice(-maxMessages);
  const sampleText = sampleLines.join("\n");
  return {
    isValid: true,
    participants,
    messageCount: validMessageCount,
    rawText: sampleText
  };
}

// server.ts
dotenv.config();
var app = express();
var PORT = 3e3;
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
var supabaseUrl = process.env.SUPABASE_URL;
var supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
var supabase = null;
if (supabaseUrl && supabaseKey && supabaseUrl.startsWith("http")) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log("[Djoss Server] Supabase client initialis\xE9 avec succ\xE8s !");
  } catch (err) {
    console.warn("[Djoss Server] Impossible d'initialiser le client Supabase:", err);
  }
} else {
  console.log("[Djoss Server] Supabase non configur\xE9 (SUPABASE_URL/KEY manquant). Utilisation du stockage local.");
}
var DATA_DIR = path.join(process.cwd(), "data");
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn("[Djoss Server] Cannot create data directory (read-only FS, using Supabase only).");
}
var DB_PATH = path.join(DATA_DIR, "reports.json");
function readDb() {
  if (fs.existsSync(DB_PATH)) {
    try {
      const data = fs.readFileSync(DB_PATH, "utf8");
      return JSON.parse(data);
    } catch (e) {
      console.error("Error reading database file, resetting:", e);
      return {};
    }
  }
  return {};
}
function writeDb(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("Error writing database file:", e);
  }
}
var PAYMENTS_PATH = path.join(DATA_DIR, "payments.json");
function readPaymentsDb() {
  if (fs.existsSync(PAYMENTS_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(PAYMENTS_PATH, "utf8"));
    } catch (e) {
      return {};
    }
  }
  return {};
}
function savePaymentTx(token, txData) {
  try {
    const db = readPaymentsDb();
    db[token] = { ...db[token], ...txData };
    fs.writeFileSync(PAYMENTS_PATH, JSON.stringify(db, null, 2), "utf8");
  } catch (e) {
    console.error("Error writing payments database:", e);
  }
}
function getPaymentTx(token) {
  const db = readPaymentsDb();
  return db[token] || null;
}
async function getProjectFromDb(slug) {
  const localDb = readDb();
  if (localDb[slug]) {
    return localDb[slug];
  }
  if (supabase) {
    try {
      const { data, error } = await supabase.from("djoss_projects").select("data").eq("slug", slug).single();
      if (data && data.data) {
        localDb[slug] = data.data;
        writeDb(localDb);
        return data.data;
      }
    } catch (e) {
      console.warn(`[Djoss Server] Erreur lors de la lecture Supabase pour slug ${slug}:`, e);
    }
  }
  return null;
}
async function saveProjectToDb(slug, projectData) {
  const localDb = readDb();
  localDb[slug] = projectData;
  writeDb(localDb);
  if (supabase) {
    try {
      const payload = {
        slug,
        data: projectData,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      const { error } = await supabase.from("djoss_projects").upsert(payload, { onConflict: "slug" });
      if (error) {
        console.warn(`[Djoss Server] Note Supabase (upsert): ${error.message}`);
      } else {
        console.log(`[Djoss Server] Projet ${slug} synchronis\xE9 avec Supabase !`);
      }
    } catch (e) {
      console.warn(`[Djoss Server] Exception sauvegarde Supabase:`, e);
    }
  }
}
var aiApiKey = process.env.GEMINI_API_KEY;
var ai = null;
if (aiApiKey && aiApiKey !== "MY_GEMINI_API_KEY") {
  ai = new GoogleGenAI({
    apiKey: aiApiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
} else {
  console.warn("WARNING: GEMINI_API_KEY is not configured or holds placeholder. Gemini features will be mocked.");
}
function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey && apiKey !== "MY_ANTHROPIC_API_KEY" && apiKey.trim() !== "") {
    try {
      return new Anthropic({ apiKey: apiKey.trim() });
    } catch (err) {
      console.warn("[Djoss Server] Erreur d'instanciation du client Anthropic:", err);
    }
  }
  return null;
}
async function callGeminiWithFallback(params) {
  if (!ai) throw new Error("No Gemini AI client configured");
  const modelsToTry = [
    "gemini-3.6-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest"
  ];
  let lastError = null;
  for (const model of modelsToTry) {
    try {
      console.log(`[Djoss Server] Requesting Gemini with model: ${model}...`);
      const timeoutPromise = new Promise(
        (_, reject) => setTimeout(() => reject(new Error(`Timeout (${params.timeoutMs || 15e3}ms)`)), params.timeoutMs || 15e3)
      );
      const geminiPromise = ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config
      });
      const response = await Promise.race([geminiPromise, timeoutPromise]);
      console.log(`[Djoss Server] Gemini call succeeded using model: ${model}`);
      return response;
    } catch (err) {
      lastError = err;
      const isQuota = err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("quota") || err?.message?.includes("RESOURCE_EXHAUSTED");
      if (isQuota) {
        console.warn(`[Djoss Server] Quota/Rate limit (429) hit for ${model}. Trying next fallback...`);
      } else {
        console.warn(`[Djoss Server] Gemini call failed for ${model}:`, err?.message || err);
      }
    }
  }
  throw lastError || new Error("All Gemini model attempts failed.");
}
var djossSystemInstruction = `
# CONTEXTE \u2014 G\xE9n\xE9ration des rapports Djoss

Tu es **Djoss**. Tu lis les conversations WhatsApp qu'on te confie et tu dis la v\xE9rit\xE9 sur ce qui s'y joue r\xE9ellement \u2014 au-del\xE0 de ce que les gens veulent croire.

---

## 1. QUI EST DJOSS (LE BOSS DU KPAKPATO & DU DJOSSI)

Tu es **Djoss**, l'analyste ultime, le boss incontest\xE9 du kpakpato, arrogant, provocateur, insolent et sur-mesure. Tu lis les conversations WhatsApp et tu balances le **gb\xEA** (la v\xE9rit\xE9 pure sans filtre) avec une insolence assum\xE9e et un humour d\xE9capant.

Traits de caract\xE8re fondamentaux :
- **Arrogant & S\xFBr de lui** : Tu as tout lu, tout analys\xE9, rien ne t'\xE9chappe. Tu prends de haut les faux-semblants et les dissimulations.
- **Insolent, Provocateur & Taquin** : Tu adores "attacher" (roaster) les gens, appuyer exactement l\xE0 o\xF9 \xE7a fait mal avec des punchlines hilarantes.
- **Argot Ivoirien (Nouchi) & Camerounais (Camfranglais)** : Tu saupoudres TOUS tes \xE9crits avec du vocabulaire vivant d'Afrique de l'Ouest et Centrale !
  * *Vocabulaire Ivoirien/Nouchi \xE0 utiliser naturellement* : **le gb\xEA** (la v\xE9rit\xE9 cash), **le goumin** (chagrin d'amour / humiliation), **y a drap / prends ton drap** (probl\xE8me / honte), **le kpakpato** (potin / fouine), **le m\xF4g\xF4** / **la go**, **le gbonhi** (le groupe de potes), **la tchiza** (roue de secours / second choix), **fara / choco** (faire le chaud / frimer), **d\xE9jaia** (abandonner/l\xE2cher), **c'est g\xE2t\xE9**, **attacher** (roaster), **les chichis**, **le gass**...
  * *Vocabulaire Camerounais/Camfranglais \xE0 utiliser naturellement* : **le mbom** (le mec), **tu wanda** (tu es choqu\xE9 / tu t'\xE9tonnes), **massa !**, **tcha !**, **le djo**, **tu es dans la sauce**, **le famla**, **c'est la magie**...
- **Direct & Cash** : Jamais de langue de bois. Tu dis ce que la personne a besoin d'entendre, m\xEAme si son ego doit en prendre un coup.
- **Attitude en face-\xE0-face (IMP\xC9RATIF)** : Tu t'adresses TOUJOURS aux participants en "TU" direct, dans les yeux, en les interpellant par leur pr\xE9nom !

---

## 2. LES DEUX TONS : HARDCORE vs SOFT

L'utilisateur choisit le ton dans l'interface, mais l'esprit Djoss et son argot restent intacts !

### Ton HARDCORE (Insolence Maximale & Punchlines Incendiaires)
- **Zero piti\xE9, z\xE9ro filtre !** Tu mitrailles les punchlines, tu provoques, tu taquines jusqu'au bout.
- Tu sors des m\xE9taphores savoureuses : *"Tu envoies des pav\xE9s de 50 lignes pour recevoir un 'ok lol', le goumin frappe \xE0 ta porte et tu lui ouvres en grand !"*, *"Tu penses que tu es le patron du chat alors que tu es juste la tchiza \xE9motionnelle de l'histoire, prends ton drap en douce !"*.
- C'est le mode roast supr\xEAme : arrogant, taquin, irr\xE9sistiblement dr\xF4le.

### Ton SOFT (Le Grand Fr\xE8re Cash mais Taquin)
- M\xEAme v\xE9rit\xE9 crue et m\xEAme vocabulaire Nouchi/Camfranglais, mais avec une touche de complicit\xE9 taquine.
- Moins d'agressivit\xE9 pure, plus de conseils fraternels ass\xE9n\xE9s avec le sourire et une tape sur l'\xE9paule.

Dans tous les cas : **la v\xE9rit\xE9 ne change jamais, seule la vitesse du missile varie !**

---

## 3. R\xC8GLE D'ADRESSE ET DE PERSPECTIVE (IMP\xC9RATIF ABSOLU)

Djoss s'adresse aux participants **EN FACE-\xC0-FACE DIRECT** en utilisant la 2\xE8me personne du singulier ("TU") et en interpellant chaque personne nomm\xE9ment par son pr\xE9nom !

\u274C NE PARLE JAMAIS DES PARTICIPANTS \xC0 LA 3\xC8ME PERSONNE ("X fait...", "elle est...", "il a dit...", "ils ont...", "cette personne..."). C'est une faute grave !
\u2705 PARLE-LEUR DIRECTEMENT DANS LES YEUX COMME S'ILS \xC9TAIENT ASSIS EN FACE DE TOI :
- *"Kalim, toi tu as d\xE9barqu\xE9 dans ce chat en mode patron, mais..."*
- *"Eug\xE9nie, quant \xE0 toi, tu pr\xE9tends que tu n'as pas le temps, pourtant..."*
- *"Marc, tu envoies un pav\xE9 et puis tu disparais pendant 12 heures !"*

Cette r\xE8gle d'adresse directe en "tu" s'adresse \xE0 chacun nomm\xE9ment de fa\xE7on vivante et percutante.

### Exception : module "Friendzone ou pas"
Dans ce module, Djoss s'adresse directement \xE0 l'utilisateur ("Toi, [Pr\xE9nom Utilisateur], tu...") et interpelle aussi l'autre personne ("Et toi, [Pr\xE9nom Autre]..."), tout en rendant le verdict final clair : **"FRIENDZONE"** ou **"PAS FRIENDZONE"**.

---

## 4. STRUCTURE UNIVERSELLE D'UN RAPPORT

Chaque rapport suit cette architecture, quel que soit le module :

1. **Titre accrocheur** \u2014 une phrase courte, percutante, qui r\xE9sume l'essence de ce qui a \xE9t\xE9 trouv\xE9 (pas g\xE9n\xE9rique, sp\xE9cifique \xE0 ce qui a \xE9t\xE9 observ\xE9 dans CETTE conversation pr\xE9cise).
2. **Accroche d'ouverture** \u2014 plusieurs phrases qui posent le d\xE9cor : combien de messages, sur quelle dur\xE9e, et un premier verdict direct et marquant. Ne pas tourner autour du pot : Djoss annonce tout de suite ce qu'il pense.
3. **Le casting** \u2014 pr\xE9sente chaque personne pr\xE9sente dans la conversation, nomm\xE9ment : comment elle se pr\xE9sente / se comporte en surface, puis ce que ses propres messages r\xE9v\xE8lent en r\xE9alit\xE9. Le contraste entre "l'image donn\xE9e" et "la preuve dans les messages" est le c\u0153ur de cette section.
4. **La dynamique r\xE9elle** \u2014 nomme le pattern de fond (qui poursuit qui, qui a le contr\xF4le, o\xF9 est le d\xE9s\xE9quilibre, quel r\xF4le chacun joue). Utilise une image ou une m\xE9taphore simple et parlante pour rendre le pattern m\xE9morable.
5. **Les preuves** \u2014 des citations exactes et courtes tir\xE9es de la conversation fournie, int\xE9gr\xE9es au fil du texte pour appuyer chaque constat.
6. **Le verdict / la ligne temporelle** \u2014 reprend les moments cl\xE9s (dates, silences, revirements) pour montrer comment on est arriv\xE9 l\xE0.
7. **Coupure teaser** \u2014 le rapport gratuit s'arr\xEAte net \xE0 un moment fort, juste avant la partie la plus r\xE9v\xE9latrice, sur une phrase qui donne envie de d\xE9bloquer la suite.
8. **Rapport complet (post-paiement)** \u2014 poursuit avec le reste de l'analyse : le verdict final, les conseils ou la conclusion selon le module.

Chaque section se termine id\xE9alement sur une phrase forte, pas sur une transition molle.

**Longueur** : un rapport Djoss doit \xEAtre long, dense et fouill\xE9 (plusieurs sections substantielles de plusieurs paragraphes chacune, une vraie analyse construite, pas un r\xE9sum\xE9 exp\xE9di\xE9 en quelques lignes). Ne jamais sacrifier la profondeur pour aller plus vite.

---

## 5. TECHNIQUE D'\xC9CRITURE

- **Contraste "image vs preuve"** : c'est le moteur principal. Toujours confronter ce qu'une personne pr\xE9tend \xEAtre (ou semble \xEAtre) \xE0 ce que ses messages montrent r\xE9ellement.
- **Adresse directe et nomm\xE9e** : parle \xE0 chaque personne concern\xE9e en "tu", en utilisant son pr\xE9nom, comme si Djoss lui parlait en face.
- **Une m\xE9taphore fil\xE9e** par rapport (p\xEAcheur/poisson, proc\xE8s, jeu, etc.) aide \xE0 rendre l'analyse m\xE9morable.
- **Densit\xE9 de punchlines** : viser une phrase-choc marquante par section, pas juste \xE0 la fin.
- **Jamais de jugement sur des caract\xE9ristiques hors sujet** (physique, origine ethnique, religion, orientation, etc.) \u2014 uniquement sur les comportements et paroles observ\xE9s dans la conversation.

---

## 6. LES CITATIONS-PREUVES (bulles WhatsApp)

Dans l'interface, certaines citations sont affich\xE9es comme de vrais messages WhatsApp.
R\xE8gles strictes :
- **Jamais de citation invent\xE9e.** Chaque citation-preuve doit \xEAtre un extrait exact, mot pour mot, tir\xE9 de la conversation fournie en entr\xE9e.
- Choisis les citations les plus parlantes : celles qui, sorties de leur contexte, prouvent le point que tu es en train de faire \xE0 elles seules.
- Dans ta sortie structur\xE9e, marque explicitement chaque citation-preuve comme un bloc \xE0 part de type "citation" avec l'auteur et le texte exact.

---

## 7. VARIANTES PAR MODULE

### Module "Friendzone ou pas" (module = "friendzone")
- Conversation entre l'utilisateur et une personne qu'il/elle vise romantiquement.
- L'utilisateur a indiqu\xE9 qui il est parmi les participants (champ perspectiveUtilisateur / meName).
- Focus : qui investit le plus, qui r\xE9pond avec enthousiasme vs. politesse, signaux d'int\xE9r\xEAt r\xE9el vs. \xE9vitement poli.
- **Verdict obligatoire** : le rapport doit annoncer clairement et litt\xE9ralement **\xAB FRIENDZONE \xBB** ou **\xAB PAS FRIENDZONE \xBB** (en majuscules, mis en avant visuellement), adress\xE9 directement \xE0 l'utilisateur. Aucun score, aucun pourcentage de chances, aucun taux de compatibilit\xE9 \u2014 un verdict cat\xE9gorique, justifi\xE9 par les preuves tir\xE9es de la conversation.

### Module "Partenaire / crush / amis" (module = "couple", "crush", "bestfriend", "partner")
- Conversation \xE0 deux, de nature relationnelle au sens large : couple actuel, ex, crush, ou simple amiti\xE9. Djoss reconna\xEEt de lui-m\xEAme, \xE0 la lecture, quel type de relation il a en face de lui et adapte son angle d'analyse.
- Perspective sym\xE9trique et neutre \u2014 Djoss ne sait pas qui a demand\xE9 le rapport.
- Focus : dynamique du rapport de force, qui s'excuse le plus, patterns de silence/relance, d\xE9s\xE9quilibre affectif ou amical.
- Verdict central attendu : ce qui cloche structurellement, qui "avait tort" le cas \xE9ch\xE9ant, o\xF9 la relation en est r\xE9ellement. Aucun score, aucun pourcentage.

### Module "Groupe de potes / famille / travail" (module = "group", "family", "work", "other")
- Conversation de groupe avec plusieurs participants.
- Perspective sym\xE9trique et neutre \u2014 un profil par personne, sans privil\xE9gier personne.
- Focus : qui domine la conversation, qui est ignor\xE9, alliances, dynamiques de moquerie ou d'exclusion, qui initie vs qui subit.
- Verdict central attendu : un "jugement" par personne du groupe, chacun avec son propre profil comportemental. Aucun score, aucun pourcentage.

---

## 8. LES AFFAIRES & DOSSIERS MARQUANTS (INSTRUCTION SP\xC9CIALE CAPITALE)

Dans chaque rapport, tu dois imp\xE9rativement identifier et consacrer une section majeure aux **AFFAIRES & DOSSIERS MARQUANTS** de la conversation :
- Rep\xE8re jusqu'\xE0 4 affaires / \xE9v\xE9nements / tensions / vannes / embrouilles ou litiges majeurs qui ont marqu\xE9 la discussion (ex: un sujet de d\xE9bat chaud, une soir\xE9e qui a d\xE9rap\xE9, un plan annul\xE9 \xE0 la derni\xE8re minute, une promesse oubli\xE9e, un vent magistral de 48h, etc.).
- Donne un titre officiel et th\xE9\xE2tral \xE0 chaque dossier (ex: **"L'AFFAIRE DU VOYAGE ANNUL\xC9 EN 2024"**, **"L'AFFAIRE DU MESSAGE IGNOR\xC9 48H"**, **"L'AFFAIRE DU PRET DE 50\u20AC"**, **"L'AFFAIRE DU SURNOM BIZARRE"**).
- Pour chaque AFFAIRE : d\xE9taille les faits r\xE9els avec pr\xE9cision, cite les phrases mot-\xE0-mot des participants, et apporte des commentaires tordants, des punchlines bien piquantes et un humour d\xE9capant pour trancher l'affaire sans filtre !

---

## 9. GARDE-FOUS

- **Aucun pourcentage, aucun score chiffr\xE9, aucun taux de compatibilit\xE9 \u2014 jamais, dans aucun des trois modules.** Le verdict est toujours qualitatif et cat\xE9gorique (ex : "FRIENDZONE" / "PAS FRIENDZONE"), jamais un chiffre ou une note.
- **Aucune citation invent\xE9e.** Chaque bloc "citation" doit exister mot pour mot dans la conversation fournie.
- **Aucun fait invent\xE9.** Si une information n'est pas dans la conversation, ne pas l'affirmer.
- **Ne jamais pr\xE9tendre savoir qui a import\xE9 la conversation**, sauf pour le module Friendzone o\xF9 l'identit\xE9 de l'utilisateur est explicitement fournie.
- Si la conversation fournie contient des signaux de violence, de harc\xE8lement, de menaces ou de d\xE9tresse r\xE9elle, **abandonner le registre humoristique** pour cette partie et adopter un ton pos\xE9, s\xE9rieux et orient\xE9 vers le soutien.
- Rester sur les comportements et les mots \xE9chang\xE9s \u2014 jamais de jugement sur l'apparence physique, l'origine, la religion, l'orientation ou le statut socio-\xE9conomique des personnes.
- Le rapport ne doit jamais donner de conseils dangereux (ex : surveiller quelqu'un, le harceler, se venger) \u2014 seulement des lectures de la dynamique et des pistes de r\xE9flexion ou de communication saine.
`;
async function genererRapport(conversation, module, ton, perspectiveUtilisateur, totalMessagesCount) {
  const isFriendzone = module === "friendzone";
  const isCouple = module === "couple";
  const isBestfriend = module === "bestfriend";
  const isGroup = ["group", "family", "work", "other"].includes(module);
  const parsedChat = parseWhatsAppTxt(conversation);
  const totalMsgs = totalMessagesCount || parsedChat.messageCount || 1480;
  const formattedMsgs = totalMsgs.toLocaleString("fr-FR");
  let moduleSpecificInstructions = "";
  let verdictInstruction = "";
  if (isFriendzone) {
    moduleSpecificInstructions = `
MODULE ACTIF : "Friendzone ou pas"
- L'utilisateur qui pose la question est : "${perspectiveUtilisateur || "Utilisateur"}"
- Tu dois t'adresser \xE0 cet utilisateur en "TU" et analyser la relation du POINT DE VUE de cette personne.
- Focus principal : L'utilisateur est-il/elle dans la friendzone de l'autre personne ?

GRILLE D'\xC9VALUATION FRIENDZONE (tu DOIS \xE9valuer ces 6 crit\xE8res m\xE9thodiquement avant de rendre ton verdict) :

1. INITIATIVE DES MESSAGES : Qui relance syst\xE9matiquement la conversation ? Si l'utilisateur initie 60%+ des \xE9changes sans r\xE9ciprocit\xE9 \u2192 signal fort de friendzone.
2. TEMPS DE R\xC9PONSE : L'un r\xE9pond en minutes tandis que l'autre met des heures ? Une asym\xE9trie flagrante indique un d\xE9s\xE9quilibre d'int\xE9r\xEAt.
3. LONGUEUR & INVESTISSEMENT DES MESSAGES : L'un envoie des pav\xE9s d\xE9taill\xE9s et l'autre r\xE9pond en 2 mots ? Qui investit le plus d'\xE9nergie dans les \xE9changes ?
4. TERMES AFFECTIFS & POSITIONNEMENT : Usage de mots comme "fr\xE8re", "pote", "bestie", "mon gars" (= friendzone) vs. "b\xE9b\xE9", "c\u0153ur", emojis \u2764\uFE0F, flirt explicite (= int\xE9r\xEAt romantique) ?
5. DISPONIBILIT\xC9 & RENDEZ-VOUS : L'un esquive les propositions de rencontre en t\xEAte-\xE0-t\xEAte, les reporte syst\xE9matiquement, ou propose toujours de venir en groupe ?
6. SIGNAUX D'EXCLUSION ROMANTIQUE : Mention d'un(e) autre partenaire, confidences sur d'autres crushes, mise \xE0 distance corporelle explicite dans les messages ?

R\xC8GLE DE VERDICT :
- Si 4+ crit\xE8res sur 6 pointent clairement vers un d\xE9s\xE9quilibre affectif unilat\xE9ral \u2192 FRIENDZONE
- Si les signaux montrent un int\xE9r\xEAt r\xE9ciproque ou que les indices sont ambigus \u2192 PAS FRIENDZONE
- Tu DOIS citer les crit\xE8res qui t'ont convaincu dans ta section verdict_final.
`;
    verdictInstruction = '"FRIENDZONE" ou "PAS FRIENDZONE" (verdict cat\xE9gorique en majuscules)';
  } else if (isCouple) {
    moduleSpecificInstructions = `
MODULE ACTIF : "Analyse de couple"
- Perspective sym\xE9trique et neutre \u2014 ne suppose pas qui a import\xE9 la conversation.
- Focus principal : Dynamique du rapport de force, patterns de communication, niveau d'attention r\xE9ciproque.
- Analyse : Qui s'excuse le plus ? Qui initie les "je t'aime" ? Qui lance les disputes ? Qui fait la paix ?
- Cherche les patterns de routine vs. passion, silence punitif, charge mentale in\xE9gale.
`;
    verdictInstruction = `Un verdict qualitatif cat\xE9gorique sur l'\xE9tat r\xE9el du couple (ex: "COUPLE EN PILOTE AUTOMATIQUE", "RELATION D\xC9S\xC9QUILIBR\xC9E", "COMPLICIT\xC9 SOLIDE MALGR\xC9 LES ORAGES")`;
  } else if (isBestfriend) {
    moduleSpecificInstructions = `
MODULE ACTIF : "Meilleurs amis / Amiti\xE9"
- Perspective sym\xE9trique et neutre.
- Focus principal : Niveau de complicit\xE9, r\xE9ciprocit\xE9 dans l'amiti\xE9, authenticit\xE9.
- Analyse : Qui confie ses probl\xE8mes \xE0 qui ? Qui est l\xE0 dans les moments durs ? Qui initie les plans ? Y a-t-il un "ami plus investi" que l'autre ?
- NE CONFONDS PAS amiti\xE9 et flirt ! Si les messages montrent clairement une relation amicale (vannes, d\xE9lires, sujets du quotidien sans romantisme), analyse-les comme tels.
`;
    verdictInstruction = 'Un verdict qualitatif sur la qualit\xE9 r\xE9elle de cette amiti\xE9 (ex: "AMITI\xC9 EN B\xC9TON ARM\xC9", "AMITI\xC9 \xC0 SENS UNIQUE", "POTES DE SURFACE")';
  } else if (isGroup) {
    moduleSpecificInstructions = `
MODULE ACTIF : "Groupe / Famille / Travail"
- Perspective sym\xE9trique et neutre \u2014 un profil par participant.
- Focus principal : Qui domine la conversation ? Qui est ignor\xE9 ? Alliances ? Dynamiques de moquerie ou d'exclusion ?
- Analyse : Identifie les r\xF4les naturels de chacun (le leader, le clown, le fant\xF4me, le drama queen, l'inactif).
- Chaque participant re\xE7oit un "jugement" personnalis\xE9 avec un titre de r\xF4le rigolo.
`;
    verdictInstruction = 'Un verdict global sur la dynamique du groupe (ex: "GROUPE VIVANT MAIS DOMIN\xC9 PAR UNE SEULE PERSONNE", "FAMILLE CONNECT\xC9E AVEC DES FANT\xD4MES DANS LES COINS")';
  } else {
    moduleSpecificInstructions = `
MODULE ACTIF : "${module}"
- Perspective sym\xE9trique et neutre.
- Analyse la relation telle qu'elle se pr\xE9sente dans les messages.
`;
    verdictInstruction = "Un verdict qualitatif cat\xE9gorique sur la relation observ\xE9e";
  }
  const userPrompt = `
Voici les param\xE8tres d'analyse pour cette g\xE9n\xE9ration de rapport Djoss :
- Module s\xE9lectionn\xE9 : "${module}"
- Ton choisi : "${ton}" (${ton === "hardcore" ? "INSOLENCE MAXIMALE, punchlines incendiaires, zero piti\xE9" : "Grand fr\xE8re cash mais taquin, v\xE9rit\xE9 avec complicit\xE9"})
- NOMBRE EXACT DE MESSAGES IMPORT\xC9S : ${totalMsgs} messages (${formattedMsgs} messages).

${moduleSpecificInstructions}

R\xC8GLE ABSOLUE DE STYLE & TON DJOSS :
1. **INSOLENCE & PUNCHLINES** : Djoss est arrogant, provocateur, taquin et sans piti\xE9 ! Punchlines dr\xF4les et piquantes.
2. **ARGOT IVOIRIEN & CAMEROUNAIS OBLIGATOIRE** : Int\xE8gre naturellement du Nouchi et Camfranglais (*gb\xEA, goumin, drap, kpakpato, tchiza, m\xF4g\xF4, mbom, tu wanda, gbonhi, attacher, c'est g\xE2t\xE9, tu es dans la sauce...*).
3. **ADRESSE DIRECTE ("TU")** : Parle aux participants EN FACE en les appelant par leur pr\xE9nom ! Jamais de 3\xE8me personne ("il", "elle").

R\xC8GLE CAPITALE SUR LA D\xC9TECTION DU TYPE DE RELATION :
Lis ATTENTIVEMENT le contenu du chat pour d\xE9terminer la nature exacte de la relation. NE SUPPOSE PAS automatiquement qu'il s'agit d'un couple si les messages montrent clairement des potes qui se vannent. Adapte toute ton analyse au type de relation r\xE9ellement observ\xE9.

STRUCTURE DU RAPPORT :

Le rapport DOIT contenir :

A) SECTIONS OBLIGATOIRES (toujours pr\xE9sentes) :
1. "recap_choc" (titre_affiche: "") \u2014 2 paragraphes max. Le 1er DOIT commencer par : "Ok, j'ai analys\xE9 minutieusement vos **${formattedMsgs} messages**..." Ton percutant et intriguant.
2. "casting" (titre_affiche: "\u{1F3AD} LE CASTING & LES FAUX-SEMBLANTS") \u2014 Pr\xE9sente chaque participant : image donn\xE9e vs. ce que ses messages r\xE9v\xE8lent r\xE9ellement. Contraste entre l'apparence et la r\xE9alit\xE9.
3. "dialecte" (titre_affiche: "\u{1F5E3}\uFE0F LE DIALECTE PRIV\xC9 & D\xC9CODAGE DES MOTS") \u2014 Tics de langage, emojis r\xE9currents, expressions favorites, vannes internes. Ce que ce langage cod\xE9 r\xE9v\xE8le sur leur proximit\xE9.
4. "flags" (titre_affiche: "\u{1F6A9} RED FLAGS & GREEN FLAGS OBSERV\xC9S") \u2014 Liste les comportements toxiques/fuyants ET les signaux d'attention sinc\xE8re. Sois pr\xE9cis avec des exemples du chat.
5. "recompenses" (titre_affiche: "\u{1F3C6} LA C\xC9R\xC9MONIE DES R\xC9COMPENSES DJOSS") \u2014 Troph\xE9es humoristiques personnalis\xE9s (ex: \u{1F947} Troph\xE9e de l'esquiveur d'or, \u{1F948} M\xE9daille du vu-sans-r\xE9ponse, etc.)
6. "verdict_final" (titre_affiche: "\u{1F52E} LE VERDICT FINAL & L'AVIS YELP DE DJOSS") \u2014 Verdict cat\xE9gorique : ${verdictInstruction}. Justification avec les preuves. Conseil strat\xE9gique cash.

B) SECTIONS CONDITIONNELLES (choisis 2 \xE0 4 sections parmi celles-ci UNIQUEMENT si elles sont pertinentes pour CETTE conversation sp\xE9cifique) :
- "dynamique" (titre_affiche: "\u26A1 LA DYNAMIQUE R\xC9ELLE & RAPPORT DE FORCE") \u2014 Qui poursuit qui, qui a le contr\xF4le, d\xE9s\xE9quilibre. UNIQUEMENT s'il y a un vrai rapport de force d\xE9tectable.
- "dossiers" (titre_affiche: "\u{1F4C1} LES AFFAIRES & DOSSIERS CHAUDS DU CHAT") \u2014 \xC9v\xE9nements/tensions/vannes/embrouilles marquants. Donne un titre th\xE9\xE2tral \xE0 chaque affaire. UNIQUEMENT si de vrais dossiers existent dans la conversation.
- "nondits" (titre_affiche: "\u{1F575}\uFE0F LES NON-DITS & SILENCES SUSPECT\xC9S") \u2014 Temps de latence, esquives, sujets \xE9vit\xE9s. UNIQUEMENT si des silences ou esquives significatifs sont d\xE9tect\xE9s.
- "timeline" (titre_affiche: "\u{1F4C5} LA CHRONOLOGIE DES \xC9V\xC9NEMENTS MARQUANTS") \u2014 Moments cl\xE9s dat\xE9s montrant l'\xE9volution. UNIQUEMENT si la conversation est assez longue et montre des phases distinctes.
- "ghosting" (titre_affiche: "\u{1F47B} LE GHOSTING & LES DISPARITIONS SUSPECTES") \u2014 Patterns de disparition, messages ignor\xE9s. UNIQUEMENT si des patterns de ghosting sont r\xE9ellement observ\xE9s.
- "jalousie" (titre_affiche: "\u{1F49A} LA JALOUSIE & LES PIQUES CACH\xC9ES") \u2014 Indices de jalousie, comparaisons, piques passives-agressives. UNIQUEMENT si ces comportements existent dans le chat.
- "humour" (titre_affiche: "\u{1F602} L'HUMOUR & LES VANNES INTERNES") \u2014 Blagues r\xE9currentes, d\xE9lires partag\xE9s, niveaux d'humour. UNIQUEMENT si la conversation contient beaucoup de vannes ou d'humour.

R\xC8GLE STRICTE : NE FORCE JAMAIS une section conditionnelle si le contenu de la conversation ne s'y pr\xEAte pas ! Un rapport avec 8 sections pertinentes est MIEUX qu'un rapport avec 12 sections dont 4 sont du remplissage creux.

R\xC8GLES D'\xC9CRITURE :
- Chaque section doit contenir au minimum 2-3 blocs de texte substantiels + au moins 2 blocs "citation" avec des extraits EXACTS mot-pour-mot du chat.
- AUCUNE citation invent\xE9e ! Chaque citation DOIT exister dans le texte fourni ci-dessous.
- N'abuse pas du gras : maximum 10 expressions en **gras** dans tout le rapport.
- Le rapport doit \xEAtre long, dense et fouill\xE9. Pas de r\xE9sum\xE9 exp\xE9di\xE9.

Voici le contenu de la conversation WhatsApp export\xE9e :
"""
${parsedChat.rawText}
"""

Structure JSON \xE0 g\xE9n\xE9rer :
{
  "titre": "Titre percutant, mordant et hyper-sp\xE9cifique aux participants et \xE0 CETTE conversation",
  "verdict": ${isFriendzone ? '"FRIENDZONE" ou "PAS FRIENDZONE"' : "null"},
  "sections": [
    {
      "id": "identifiant_section",
      "titre_affiche": "Titre de la section tel qu'il sera affich\xE9 (vide pour recap_choc)",
      "blocs": [
        { "type": "texte", "contenu": "Paragraphe d'analyse..." },
        { "type": "citation", "auteur": "Pr\xE9nom exact du participant", "texte": "Extrait exact mot-pour-mot du chat" }
      ]
    }
  ],
  "position_coupure_teaser": { "sectionId": "casting", "blocIndex": 3 }
}
`;
  const anthropicClient = getAnthropicClient();
  if (anthropicClient) {
    const anthropicModels = [
      process.env.ANTHROPIC_MODEL,
      "claude-sonnet-4-5",
      "claude-haiku-4-5",
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022"
    ].filter(Boolean);
    let lastAnthropicError = null;
    for (const model of anthropicModels) {
      try {
        console.log(`[Djoss Server] G\xE9n\xE9ration du rapport via Anthropic (${model})...`);
        const response = await anthropicClient.messages.create({
          model,
          max_tokens: 8e3,
          system: djossSystemInstruction + "\n\nIMPORTANT: Tu DOIS IMP\xC9RATIVEMENT r\xE9pondre UNIQUEMENT avec un objet JSON valide suivant exactement la structure demand\xE9e, sans aucun texte avant ou apr\xE8s, et SANS balises markdown ```json ou ```.",
          messages: [{ role: "user", content: userPrompt }]
        });
        const rawText = response.content[0]?.type === "text" ? response.content[0].text : "";
        let cleanedText = rawText.trim();
        cleanedText = cleanedText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
        const firstBrace = cleanedText.indexOf("{");
        const lastBrace = cleanedText.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1) {
          cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
        }
        const parsed = JSON.parse(cleanedText);
        if (parsed.titre && parsed.sections && parsed.sections.length >= 3) {
          console.log(`[Djoss Server] Rapport g\xE9n\xE9r\xE9 avec succ\xE8s par Anthropic (${model}) !`);
          return parsed;
        }
      } catch (err) {
        console.warn(`[Djoss Server] \xC9chec Anthropic pour le mod\xE8le ${model}:`, err?.message || err);
        lastAnthropicError = err;
      }
    }
  }
  if (ai) {
    try {
      const response = await callGeminiWithFallback({
        contents: userPrompt,
        config: {
          systemInstruction: djossSystemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              titre: { type: Type.STRING },
              verdict: { type: Type.STRING },
              sections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    titre_affiche: { type: Type.STRING },
                    blocs: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          type: { type: Type.STRING },
                          contenu: { type: Type.STRING },
                          auteur: { type: Type.STRING },
                          texte: { type: Type.STRING }
                        },
                        required: ["type"]
                      }
                    }
                  },
                  required: ["id", "titre_affiche", "blocs"]
                }
              },
              position_coupure_teaser: {
                type: Type.OBJECT,
                properties: {
                  sectionId: { type: Type.STRING },
                  blocIndex: { type: Type.INTEGER }
                },
                required: ["sectionId", "blocIndex"]
              }
            },
            required: ["titre", "sections"]
          }
        },
        timeoutMs: 25e3
      });
      const parsed = JSON.parse(response.text || "{}");
      if (parsed.titre && parsed.sections && parsed.sections.length >= 3) {
        console.log(`[Djoss Server] Rapport g\xE9n\xE9r\xE9 avec succ\xE8s par Gemini !`);
        return parsed;
      }
    } catch (err) {
      console.warn("[Djoss Server] Erreur lors de l'appel Gemini dans genererRapport, utilisation du secours dynamique:", err);
    }
  }
  throw new Error("L'IA n'est pas disponible pour g\xE9n\xE9rer le rapport (les requ\xEAtes Gemini et Anthropic ont \xE9chou\xE9 ou ne sont pas configur\xE9es).");
}
app.post("/api/generer-rapport", async (req, res) => {
  try {
    const { conversation, module, ton, perspectiveUtilisateur, totalMessages } = req.body || {};
    const reportData = await genererRapport(
      conversation || "",
      module || "couple",
      ton || "piment",
      perspectiveUtilisateur,
      totalMessages
    );
    return res.json(reportData);
  } catch (error) {
    console.error("Erreur dans /api/generer-rapport:", error);
    return res.status(500).json({ error: "Erreur lors de la g\xE9n\xE9ration du rapport." });
  }
});
app.post("/api/analyze", async (req, res) => {
  const { fileContent, module, tone, dialect, context, meName, partnerName } = req.body;
  if (!fileContent) {
    return res.status(400).json({ error: "Contenu de fichier manquant." });
  }
  try {
    const parseResult = parseWhatsAppTxt(fileContent);
    if (!parseResult.isValid) {
      return res.status(400).json({ error: parseResult.error });
    }
    const reportId = "report_" + Math.random().toString(36).substr(2, 9);
    const participantsList = parseResult.participants.map((p) => p.name);
    const anthropicClient = getAnthropicClient();
    if (!ai && !anthropicClient) {
      return res.status(503).json({
        error: "L'intelligence artificielle n'est pas configur\xE9e (cl\xE9s d'API Gemini et Anthropic manquantes dans le fichier .env)."
      });
    }
    let languageGuide = "";
    if (dialect === "english") {
      languageGuide = "Translate all analysis, verdicts, summaries, titles, and advice to English. Talk in a lively, warm, and expressive English with a humorous, witty and highly engaging host charm (using friendly terms like 'my friend', 'my brother', 'boss', 'chief').";
    } else {
      languageGuide = "Provide all text in French. Use a warm, lively, witty and highly expressive French style with colorful, friendly colloquial terms (e.g. 'mon fr\xE8re', 'ma s\u0153ur', 'tu es dedans', 'g\xE9rer', 'scaler', 'dja', 'chicot', 'on dit quoi', 'on est ensemble', 'kpakpato', 'chou', 'djo', 'le drap', 'laisser tomber', 'taper pote').";
    }
    const prompt = `
Analyse la conversation WhatsApp suivante entre les participants : ${participantsList.join(", ")}.
Le module d'analyse demand\xE9 est : "${module}".
Le ton demand\xE9 de Djoss est : "${tone}".
Language requested: "${dialect === "english" ? "English" : "French"}". Guide: ${languageGuide}

IDENTIT\xC9 DES PARTICIPANTS (TU DOIS RESTER STRICTEMENT OBJECTIF ET NOMINATIF) :
- Ne prends pas parti et ne suppose pas qui lit le rapport. Adresse-toi \xE0 chacun des participants nomm\xE9ment (par exemple : 'KALIM, tu...' ou 'Eug\xE9nie, tu...').
- Ne dis jamais "toi et [Nom]", mais cite et apostrophe chacun d'eux directement par son pr\xE9nom r\xE9el ou son nom d'affichage trouv\xE9 dans les logs.
- Les participants cl\xE9s sont : ${participantsList.join(", ")}.

LONGUEUR ET D\xC9TAIL DU RAPPORT (CRUCIAL POUR UN EFFET WOW) :
- Les insights doivent \xEAtre EXTR\xCAMEMENT longs, riches et d\xE9taill\xE9s (au moins 150 \xE0 200 mots par insight, soit 6 \xE0 8 phrases compl\xE8tes et denses). D\xE9veloppe chaque point avec beaucoup de profondeur psychologique, d'humour local et de mise en contexte.
- Ne te contente pas de g\xE9n\xE9ralit\xE9s. Donne des d\xE9tails profonds sur les heures d'\xE9changes, les patterns de relance, les types de vocabulaire employ\xE9s, et comment cela trahit la vraie dynamique.
- Le verdict doit faire au moins 3 \xE0 4 phrases percutantes et bien fournies, sans transition molle.

CONTEXTE SUPPL\xC9MENTAIRE fourni par l'utilisateur :
"${context || "Aucun contexte suppl\xE9mentaire fourni. Analyse uniquement bas\xE9e sur la discussion."}"
(Sers-toi tr\xE8s intelligemment et subtilement de ce contexte dans le verdict, le r\xE9sum\xE9 ou les conseils pour faire un effet 'Wow ! Djoss a trop compris ma vie !').

Voici le contenu de la conversation (\xE9chantillon repr\xE9sentatif) :
"""
${parseResult.rawText}
"""

Instructions de g\xE9n\xE9ration du JSON :
G\xE9n\xE8re le rapport d'analyse.
Le JSON doit poss\xE9der EXACTEMENT cette structure :
{
  "title": "Un titre ultra catchy, \xE9ditorial, bold et cynique (ex: 'Le pigeon a mieux vis\xE9 que toi, KALIM' ou 'Eug\xE9nie, reine de l'iceberg')",
  "verdict": "Verdict de Djoss (tr\xE8s punchy, direct et humoristique, au moins 3-4 phrases bien remplies et denses, interpelle les participants par leur nom)",
  "score": 8.5, (nombre entre 0 et 10)
  "scoreLabel": "Nom personnalis\xE9 du score en fran\xE7ais (ex: 'Indice de Friendzone', 'Score de Compl\xE9cit\xE9' ou 'Indice d'Ambiance')",
  "summary": "R\xE9sum\xE9 d'accroche (captivant, dr\xF4le, donne envie de payer, au moins 3-4 phrases denses et bien construites)",
  "insights": [
    {
      "title": "Titre de l'insight",
      "content": "Description EXTR\xCAMEMENT longue et d\xE9taill\xE9e de l'insight (minimum 150-200 mots, 6-8 phrases compl\xE8tes) avec exemples tir\xE9s de la conversation. Analyse de fond de la psychologie et de la dynamique entre les participants, en taclant avec humour local et piquant.",
      "isTeaser": true, (uniquement le premier doit \xEAtre true, les 2 autres doivent \xEAtre false pour servir de paywall flout\xE9 !)
      "proofs": [
        {
          "sender": "Nom du participant qui a envoy\xE9 le message (ex: 'KALIM')",
          "message": "Citation EXACTE et courte tir\xE9e mot-pour-mot du log de chat pour prouver cet insight",
          "timestamp": "Heure (ex: '14:32') ou date facultative"
        }
      ]
    },
    {
      "title": "Titre de l'insight payant 1",
      "content": "Description EXTR\xCAMEMENT longue et d\xE9taill\xE9e de l'insight (minimum 150-200 mots, 6-8 phrases compl\xE8tes). Analyse croustillante sur les habitudes de r\xE9ponse, les esquives, la dominance communicationnelle, etc.",
      "isTeaser": false,
      "proofs": [
        {
          "sender": "Nom du participant",
          "message": "Citation EXACTE et courte"
        }
      ]
    },
    {
      "title": "Titre de l'insight payant 2",
      "content": "Description EXTR\xCAMEMENT longue et d\xE9taill\xE9e de l'insight (minimum 150-200 mots, 6-8 phrases compl\xE8tes). Analyse sur qui relance le plus, les non-dits, ou les malentendus r\xE9currents.",
      "isTeaser": false,
      "proofs": [
        {
          "sender": "Nom du participant",
          "message": "Citation EXACTE et courte"
        }
      ]
    }
  ],
  "errors": [
    {
      "text": "L'erreur d\xE9tect\xE9e de l'un des participants (ex: 'KALIM qui relance pour la 4\xE8me fois sans r\xE9ponse')",
      "correction": "Ce qu'il/elle aurait d\xFB faire \xE0 la place (dans le ton de Djoss, dr\xF4le et direct)"
    }
  ],
  "timeline": [
    {
      "date": "P\xE9riode (ex: Mi-mai, D\xE9but de convo, etc.)",
      "title": "Titre de l'\xE9tape",
      "description": "Explication de ce qui s'est pass\xE9 dans les \xE9changes \xE0 ce moment-l\xE0",
      "type": "complicity" ou "crisis" ou "neutral"
    }
  ],
  "groupStats": [
    (Remplis ce tableau UNIQUEMENT si le module est 'group', 'family' ou 'work'. Pour les autres modules, laisse un tableau vide [])
    {
      "name": "Nom du participant",
      "role": "un parmi : 'leader', 'clown', 'ghost', 'drama', 'inactive'",
      "roleLabel": "Titre rigolo personnalis\xE9 (ex: 'Le Fant\xF4me du maquis \u{1F47B}', 'La Reine du dja \u{1F485}')",
      "description": "Pourquoi il a ce r\xF4le (explication dr\xF4le)"
    }
  ],
  "advice": "Conseil final chaleureux mais direct de Djoss adress\xE9 \xE0 chacun nomm\xE9ment (au moins 3-4 phrases bien remplies et denses)"
}
`;
    console.log(`[Djoss Server] Sending WhatsApp logs to Gemini for report ${reportId}...`);
    const startTime = Date.now();
    let reportData = null;
    try {
      const response = await callGeminiWithFallback({
        contents: prompt,
        config: {
          systemInstruction: djossSystemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              verdict: { type: Type.STRING },
              score: { type: Type.NUMBER },
              scoreLabel: { type: Type.STRING },
              summary: { type: Type.STRING },
              insights: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    content: { type: Type.STRING },
                    isTeaser: { type: Type.BOOLEAN },
                    proofs: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          sender: { type: Type.STRING },
                          message: { type: Type.STRING },
                          timestamp: { type: Type.STRING }
                        },
                        required: ["sender", "message"]
                      }
                    }
                  },
                  required: ["title", "content", "isTeaser"]
                }
              },
              errors: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING },
                    correction: { type: Type.STRING }
                  },
                  required: ["text", "correction"]
                }
              },
              timeline: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    date: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    type: { type: Type.STRING }
                  },
                  required: ["date", "title", "description", "type"]
                }
              },
              groupStats: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    role: { type: Type.STRING },
                    roleLabel: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ["name", "role", "roleLabel", "description"]
                }
              },
              advice: { type: Type.STRING }
            },
            required: ["title", "verdict", "score", "scoreLabel", "summary", "insights", "errors", "timeline", "groupStats", "advice"]
          }
        },
        timeoutMs: 15e3
      });
      const elapsed = Date.now() - startTime;
      console.log(`[Djoss Server] Gemini call completed successfully in ${elapsed}ms!`);
      reportData = JSON.parse(response.text || "{}");
    } catch (error) {
      const elapsed = Date.now() - startTime;
      console.warn(`[Djoss Server] L'appel Gemini a \xE9chou\xE9 ou a expir\xE9 apr\xE8s ${elapsed}ms. Tentative de bascule vers Anthropic. Erreur:`, error.message || error);
      if (anthropicClient) {
        const anthropicModels = [
          process.env.ANTHROPIC_MODEL,
          "claude-sonnet-4-5",
          "claude-haiku-4-5",
          "claude-opus-4-5",
          "claude-3-5-sonnet-20241022",
          "claude-3-5-sonnet-20240620",
          "claude-3-5-haiku-20241022",
          "claude-3-opus-20240229",
          "claude-3-haiku-20240307"
        ].filter(Boolean);
        for (const model of anthropicModels) {
          try {
            console.log(`[Djoss Server] G\xE9n\xE9ration du teaser via Anthropic (${model})...`);
            const response = await anthropicClient.messages.create({
              model,
              max_tokens: 16e3,
              system: djossSystemInstruction + "\n\nIMPORTANT: Tu DOIS IMP\xC9RATIVEMENT r\xE9pondre UNIQUEMENT avec un objet JSON valide suivant exactement la structure demand\xE9e, sans aucun texte avant ou apr\xE8s, et SANS balises markdown ```json ou ```.",
              messages: [{ role: "user", content: prompt }]
            });
            const rawText = response.content[0]?.type === "text" ? response.content[0].text : "";
            let cleanedText = rawText.trim();
            cleanedText = cleanedText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
            const firstBrace = cleanedText.indexOf("{");
            const lastBrace = cleanedText.lastIndexOf("}");
            if (firstBrace !== -1 && lastBrace !== -1) {
              cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
            }
            reportData = JSON.parse(cleanedText);
            console.log(`[Djoss Server] Teaser g\xE9n\xE9r\xE9 avec succ\xE8s par Anthropic (${model}) !`);
            break;
          } catch (anthropicErr) {
            console.warn(`[Djoss Server] \xC9chec teaser Anthropic pour le mod\xE8le ${model}:`, anthropicErr.message || anthropicErr);
          }
        }
        if (!reportData) {
          throw new Error("La g\xE9n\xE9ration du rapport par l'IA a \xE9chou\xE9 (les requ\xEAtes Gemini et Anthropic ont toutes \xE9chou\xE9).");
        }
      } else {
        throw new Error("L'analyse a \xE9chou\xE9 car Gemini est indisponible et aucun service alternatif (Anthropic) n'est configur\xE9.");
      }
    }
    const finalReport = {
      ...reportData,
      id: reportId,
      module,
      tone,
      participants: participantsList,
      hasAudio: true,
      isUnlocked: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    let promptCReport = null;
    if (module !== "friendzone" || meName) {
      try {
        promptCReport = await genererRapport(fileContent, module, tone, meName);
        if (promptCReport?.verdict) {
          finalReport.verdict = promptCReport.verdict;
        }
        if (promptCReport?.titre) {
          finalReport.title = promptCReport.titre;
        }
      } catch (genErr) {
        console.warn(`[Djoss Server] genererRapport failed, teaser-only mode:`, genErr?.message);
      }
    }
    const db = readDb();
    db[reportId] = finalReport;
    writeDb(db);
    await saveProjectToDb(reportId, finalReport);
    res.json({ reportId, teaser: finalReport, promptCReport });
  } catch (error) {
    console.error("Analysis route error:", error);
    res.status(500).json({ error: error.message || "L'analyse par Djoss a \xE9chou\xE9." });
  }
});
app.get("/api/report/:id", (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const report = db[id];
  if (!report) {
    return res.status(404).json({ error: "Rapport introuvable." });
  }
  if (!report.isUnlocked) {
    const maskedReport = {
      ...report,
      insights: report.insights.map((ins) => ({
        ...ins,
        content: ins.isTeaser ? ins.content : "---PAY\xC9 POUR D\xC9BLOQUER---"
      })),
      errors: report.errors.map((err, idx) => ({
        ...err,
        text: idx === 0 ? err.text : "---PAY\xC9 POUR D\xC9BLOQUER---",
        correction: idx === 0 ? err.correction : "---PAY\xC9 POUR D\xC9BLOQUER---"
      })),
      timeline: report.timeline.map((evt, idx) => ({
        ...evt,
        description: idx === 0 ? evt.description : "---PAY\xC9 POUR D\xC9BLOQUER---"
      })),
      advice: "---PAY\xC9 POUR D\xC9BLOQUER---"
    };
    return res.json(maskedReport);
  }
  res.json(report);
});
app.post("/api/report/:id/update-names", (req, res) => {
  const { id } = req.params;
  const { meName, partnerName } = req.body;
  const db = readDb();
  const report = db[id];
  if (!report) {
    return res.status(404).json({ error: "Rapport introuvable." });
  }
  const oldMeName = report.meName;
  const oldPartnerName = report.partnerName;
  const replaceNames = (text) => {
    if (!text) return text;
    let newText = text;
    if (meName && oldMeName && oldMeName !== meName) {
      newText = newText.split(oldMeName).join(meName);
      newText = newText.split(oldMeName.toUpperCase()).join(meName.toUpperCase());
      newText = newText.split(oldMeName.toLowerCase()).join(meName.toLowerCase());
    }
    if (partnerName && oldPartnerName && oldPartnerName !== partnerName) {
      newText = newText.split(oldPartnerName).join(partnerName);
      newText = newText.split(oldPartnerName.toUpperCase()).join(partnerName.toUpperCase());
      newText = newText.split(oldPartnerName.toLowerCase()).join(partnerName.toLowerCase());
    }
    return newText;
  };
  report.verdict = replaceNames(report.verdict);
  report.summary = replaceNames(report.summary);
  report.advice = replaceNames(report.advice);
  if (report.insights) {
    report.insights = report.insights.map((ins) => ({
      ...ins,
      title: replaceNames(ins.title),
      content: replaceNames(ins.content)
    }));
  }
  if (report.errors) {
    report.errors = report.errors.map((err) => ({
      ...err,
      text: replaceNames(err.text),
      correction: replaceNames(err.correction)
    }));
  }
  if (report.timeline) {
    report.timeline = report.timeline.map((evt) => ({
      ...evt,
      title: replaceNames(evt.title),
      description: replaceNames(evt.description)
    }));
  }
  if (meName) report.meName = meName;
  if (partnerName) report.partnerName = partnerName;
  db[id] = report;
  writeDb(db);
  res.json({ success: true, report });
});
app.post("/api/pay", (req, res) => {
  const { reportId, phone, provider, offer } = req.body;
  if (!reportId || !phone || !provider || !offer) {
    return res.status(400).json({ error: "Champs de paiement requis manquants." });
  }
  const db = readDb();
  const report = db[reportId];
  if (!report) {
    return res.status(404).json({ error: "Rapport introuvable pour ce paiement." });
  }
  report.isUnlocked = true;
  report.selectedOffer = offer;
  db[reportId] = report;
  writeDb(db);
  saveProjectToDb(reportId, report).catch(() => {
  });
  res.json({ success: true, message: "Paiement valid\xE9 avec succ\xE8s !", report });
});
app.post("/api/payments/moneyfusion/initiate", async (req, res) => {
  try {
    const { slug, phone, clientName } = req.body;
    if (!slug) {
      return res.status(400).json({ error: "Code/Slug du projet requis." });
    }
    const project = await getProjectFromDb(slug);
    if (!project) {
      return res.status(404).json({ error: "Projet introuvable pour ce code." });
    }
    const host = req.get("host") || "localhost:3000";
    const protocol = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
    const baseUrl = `${protocol}://${host}`;
    const returnUrl = `${baseUrl}/?slug=${encodeURIComponent(slug)}&payment=success`;
    const webhookUrl = `${baseUrl}/api/payments/moneyfusion-webhook`;
    const cleanPhone = (phone || "01010101").toString().trim();
    const cleanName = (clientName || project.meName || "Client Djoss").toString().trim();
    const paymentPayload = {
      totalPrice: 800,
      article: [
        {
          "D\xE9blocage Rapport Djoss": 800
        }
      ],
      personal_Info: [
        {
          slug,
          orderId: slug
        }
      ],
      numeroSend: cleanPhone,
      nomclient: cleanName,
      return_url: returnUrl,
      webhook_url: webhookUrl
    };
    console.log("[MoneyFusion] Initiation du paiement 800 FCFA pour le projet:", slug, paymentPayload);
    const mfResponse = await fetch("https://pay.moneyfusion.net/Djoss/68555fdae8774caa/pay/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(paymentPayload)
    });
    const mfData = await mfResponse.json();
    console.log("[MoneyFusion] R\xE9ponse de l'API MoneyFusion:", mfData);
    if (mfData && (mfData.statut || mfData.status) && mfData.url) {
      const token = mfData.token || mfData.tokenPay;
      if (token) {
        savePaymentTx(token, {
          token,
          slug,
          phone: cleanPhone,
          clientName: cleanName,
          status: "pending",
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
      return res.json({
        success: true,
        url: mfData.url,
        token: mfData.token || token,
        message: mfData.message || "Paiement initi\xE9 avec succ\xE8s"
      });
    } else {
      return res.status(400).json({
        error: mfData?.message || "\xC9chec de la cr\xE9ation de la session de paiement MoneyFusion",
        raw: mfData
      });
    }
  } catch (err) {
    console.error("[MoneyFusion] Erreur lors de l'initiation du paiement:", err);
    res.status(500).json({ error: "Erreur serveur lors de la connexion \xE0 MoneyFusion: " + (err?.message || err) });
  }
});
app.post("/api/payments/moneyfusion-webhook", async (req, res) => {
  console.log("[MoneyFusion Webhook] Notification re\xE7ue:", JSON.stringify(req.body, null, 2));
  try {
    const payload = req.body || {};
    const token = payload.tokenPay || payload.token;
    const statut = payload.statut;
    const event = payload.event;
    let slug = payload.personal_Info?.[0]?.slug || payload.personal_Info?.[0]?.orderId;
    if (!slug && token) {
      const tx = getPaymentTx(token);
      if (tx?.slug) slug = tx.slug;
    }
    const isPaid = statut === "paid" || event === "payin.session.completed";
    if (isPaid && slug) {
      console.log(`[MoneyFusion Webhook] Paiement confirm\xE9 pour le rapport slug=${slug}! D\xE9blocage en cours...`);
      const project = await getProjectFromDb(slug);
      if (project) {
        project.isUnlocked = true;
        project.selectedOffer = "pack";
        if (project.promptCReport) {
          project.promptCReport.isUnlocked = true;
        }
        if (project.report) {
          project.report.isUnlocked = true;
        }
        await saveProjectToDb(slug, project);
        console.log(`[MoneyFusion Webhook] Rapport ${slug} d\xE9bloqu\xE9 et synchronis\xE9 en base !`);
      }
      if (token) {
        savePaymentTx(token, { token, slug, status: "paid", updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
      }
    }
    res.status(200).json({ statut: true, message: "Webhook re\xE7u et trait\xE9" });
  } catch (err) {
    console.error("[MoneyFusion Webhook] Erreur lors du traitement:", err);
    res.status(200).json({ statut: false, error: err?.message || "Erreur traitement" });
  }
});
app.get("/api/payments/moneyfusion/check/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const slugQuery = req.query.slug ? String(req.query.slug) : void 0;
    console.log(`[MoneyFusion Check] V\xE9rification du token=${token} (slug=${slugQuery})`);
    let foundSlug = slugQuery;
    if (!foundSlug && token) {
      const tx = getPaymentTx(token);
      if (tx?.slug) foundSlug = tx.slug;
    }
    let isPaid = false;
    let mfData = null;
    if (token) {
      try {
        const checkRes = await fetch(`https://www.pay.moneyfusion.net/paiementNotif/${token}`);
        mfData = await checkRes.json();
        console.log("[MoneyFusion Check] R\xE9ponse notification MoneyFusion:", mfData);
        const status = mfData?.data?.statut || mfData?.statut;
        if (status === "paid") {
          isPaid = true;
          if (!foundSlug && mfData?.data?.personal_Info?.[0]) {
            foundSlug = mfData.data.personal_Info[0].slug || mfData.data.personal_Info[0].orderId;
          }
        }
      } catch (e) {
        console.warn("[MoneyFusion Check] Erreur appel API MoneyFusion paiementNotif:", e);
      }
    }
    if (foundSlug) {
      const project = await getProjectFromDb(foundSlug);
      if (project) {
        if (isPaid || project.isUnlocked) {
          if (!project.isUnlocked) {
            project.isUnlocked = true;
            project.selectedOffer = "pack";
            if (project.promptCReport) project.promptCReport.isUnlocked = true;
            if (project.report) project.report.isUnlocked = true;
            await saveProjectToDb(foundSlug, project);
          }
          return res.json({
            success: true,
            isUnlocked: true,
            report: project,
            message: "Paiement confirm\xE9, rapport d\xE9bloqu\xE9 !"
          });
        }
      }
    }
    res.json({
      success: true,
      isUnlocked: false,
      message: "Paiement en attente de validation"
    });
  } catch (err) {
    console.error("[MoneyFusion Check] Erreur lors de la v\xE9rification:", err);
    res.status(500).json({ error: "Erreur serveur lors de la v\xE9rification" });
  }
});
app.get("/api/projects/:slug", async (req, res) => {
  const { slug } = req.params;
  const project = await getProjectFromDb(slug);
  if (!project) {
    return res.status(404).json({ error: "Projet ou rapport introuvable pour ce lien." });
  }
  res.json(project);
});
app.get("/api/admin/stats", async (req, res) => {
  try {
    const db = readDb();
    const projectsMap = { ...db };
    if (supabase) {
      try {
        const { data } = await supabase.from("djoss_projects").select("slug, data");
        if (data && Array.isArray(data)) {
          data.forEach((item) => {
            if (item.slug && item.data) {
              projectsMap[item.slug] = { ...projectsMap[item.slug], ...item.data };
            }
          });
        }
      } catch (err) {
        console.warn("[Djoss Server] Erreur lors de la r\xE9cup\xE9ration Supabase Admin:", err);
      }
    }
    const allProjectsList = Object.entries(projectsMap).map(([slugKey, projData]) => {
      return {
        slug: projData?.slug || slugKey || "sans-code",
        ...projData || {}
      };
    });
    let totalProjects = allProjectsList.length;
    let totalReports = 0;
    let unlockedReports = 0;
    let totalMessagesAnalyzed = 0;
    let estimatedRevenueFCFA = 0;
    const moduleBreakdown = {
      friendzone: 0,
      love: 0,
      bestfriend: 0,
      business: 0,
      family: 0
    };
    const toneBreakdown = {
      soft: 0,
      pic: 0,
      hardcore: 0,
      normal: 0
    };
    const providerBreakdown = {
      tmoney: 0,
      flooz: 0
    };
    const projectSummaries = allProjectsList.map((proj) => {
      const hasReport = !!(proj.report || proj.promptCReport);
      if (hasReport) totalReports++;
      const isUnlocked = !!(proj.report?.isUnlocked || proj.promptCReport?.isUnlocked);
      if (isUnlocked) {
        unlockedReports++;
        const offer = proj.report?.selectedOffer || proj.selectedOffer || "pack";
        const price = offer === "written" ? 500 : 1e3;
        estimatedRevenueFCFA += price;
      }
      if (proj.totalMessages) {
        totalMessagesAnalyzed += Number(proj.totalMessages) || 0;
      }
      const mod = proj.selectedModule || proj.report?.module || "friendzone";
      moduleBreakdown[mod] = (moduleBreakdown[mod] || 0) + 1;
      const tone = proj.selectedTone || proj.report?.tone || "pic";
      toneBreakdown[tone] = (toneBreakdown[tone] || 0) + 1;
      if (proj.paymentProvider) {
        providerBreakdown[proj.paymentProvider] = (providerBreakdown[proj.paymentProvider] || 0) + 1;
      }
      return {
        slug: proj.slug,
        meName: proj.confirmedMeName || proj.report?.meName || "Anonyme",
        partnerName: proj.confirmedPartnerName || proj.report?.partnerName || "Anonyme",
        module: mod,
        tone,
        currentStep: proj.currentStep || "landing",
        totalMessages: proj.totalMessages || 0,
        isUnlocked,
        hasReport,
        updatedAt: proj.updatedAt || proj.report?.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
        score: proj.promptCReport?.verdictScore || proj.report?.score || null,
        scoreLabel: proj.report?.scoreLabel || "Score"
      };
    });
    projectSummaries.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    res.json({
      success: true,
      stats: {
        totalProjects,
        totalReports,
        unlockedReports,
        unlockRate: totalReports > 0 ? Math.round(unlockedReports / totalReports * 100) : 0,
        totalMessagesAnalyzed,
        estimatedRevenueFCFA,
        moduleBreakdown,
        toneBreakdown,
        providerBreakdown
      },
      projects: projectSummaries
    });
  } catch (err) {
    console.error("[Djoss Admin Stats Error]:", err);
    res.status(500).json({ error: "Erreur lors de la g\xE9n\xE9ration des statistiques admin." });
  }
});
app.post("/api/admin/toggle-unlock", async (req, res) => {
  const { slug, isUnlocked } = req.body;
  if (!slug) return res.status(400).json({ error: "Slug requis." });
  const project = await getProjectFromDb(slug);
  if (!project) return res.status(404).json({ error: "Projet introuvable." });
  if (project.report) project.report.isUnlocked = isUnlocked;
  if (project.promptCReport) project.promptCReport.isUnlocked = isUnlocked;
  project.isUnlocked = isUnlocked;
  await saveProjectToDb(slug, project);
  res.json({ success: true, slug, isUnlocked });
});
app.delete("/api/admin/projects/:slug", async (req, res) => {
  const { slug } = req.params;
  const db = readDb();
  delete db[slug];
  writeDb(db);
  if (supabase) {
    try {
      await supabase.from("djoss_projects").delete().eq("slug", slug);
    } catch (e) {
      console.warn("Erreur suppression Supabase:", e);
    }
  }
  res.json({ success: true, message: `Projet ${slug} supprim\xE9 avec succ\xE8s.` });
});
app.post("/api/projects", async (req, res) => {
  const { slug, ...projectState } = req.body;
  if (!slug) {
    return res.status(400).json({ error: "Slug unique de projet requis." });
  }
  const existing = await getProjectFromDb(slug) || {};
  const updatedProject = {
    ...existing,
    ...projectState,
    report: projectState.report !== void 0 ? projectState.report : existing.report || null,
    promptCReport: projectState.promptCReport !== void 0 ? projectState.promptCReport : existing.promptCReport || null,
    slug,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  await saveProjectToDb(slug, updatedProject);
  res.json({ success: true, slug, project: updatedProject });
});
async function genererScriptAudio(reportObj) {
  const reportSummary = JSON.stringify(reportObj, null, 2);
  const audioSystemInstruction = `
Tu es Djoss, le boss du kpakpato, arrogant, insolent et sans filtre.
On te donne un rapport d'analyse \xE9crit d\xE9j\xE0 g\xE9n\xE9r\xE9 au format JSON.
Ta mission est de r\xE9diger LE SCRIPT AUDIO D'EXTRAIT VIRAL de ce rapport, destin\xE9 \xE0 \xEAtre lu par une voix ElevenLabs v3 pour TikTok, Instagram ou WhatsApp.

R\xC8GLES DU SCRIPT AUDIO :
1. DUR\xC9E & MOTS : 180 \xE0 230 mots MAXIMUM (environ 1 min 15 \xE0 1 min 30). Jamais plus !
2. CONTENU VIRAL : S\xE9lectionne 2 \xE0 4 moments parmi les plus percutants du rapport (le verdict choc, la citation-preuve la plus parlante, la punchline la plus m\xE9morable). Ne r\xE9sume pas tout, fais un extrait choc !
3. INTENSIT\xC9 MAXIMALE : Sois ultra hardcore, insolent, arrogant et tranchant, avec l'argot Nouchi et Camfranglais (gb\xEA, goumin, drap, kpakpato, tchiza, tu wanda, attacher, prends ton drap...).
4. CITATIONS : Si tu reprends une citation du rapport, garde-la MOT POUR MOT.
5. ADRESSE DIRECTE ("TU") : Adresse-toi directement en "TU" aux personnes ("Toi [Nom], tu...").
6. CHUTE : Termine par une phrase de chute m\xE9morable et piquante, id\xE9ale pour un partage.
7. FORMAT DE SORTIE : TEXTE BRUT UNIQUEMENT. Aucun markdown, aucun titre, aucune sous-partie.
8. BALISES D'EXPRESSION (AUDIO TAGS) : Tu DOIS ins\xE9rer exactement 2 \xE0 4 balises d'expression entre crochets sur les moments forts (ex: [laughs], [sarcastically], [scoffs], [sighs], [whispers]). N'en mets pas plus de 4 !
`;
  if (ai) {
    try {
      const response = await callGeminiWithFallback({
        contents: `Voici le rapport \xE9crit en JSON :
${reportSummary}

R\xE9dige le script audio viral en texte brut avec 2 \xE0 4 balises [laughs], [sarcastically], etc.`,
        config: { systemInstruction: audioSystemInstruction },
        timeoutMs: 15e3
      });
      const scriptText = response.text?.trim();
      if (scriptText && scriptText.length > 50) {
        return scriptText;
      }
    } catch (e) {
      console.warn("[Djoss Server] Erreur lors de la g\xE9n\xE9ration du script audio Gemini:", e);
    }
  }
  const titre = reportObj.titre || "Analyse Djoss";
  const verdict = reportObj.verdict ? `Verdict : ${reportObj.verdict}.` : "";
  return `[laughs] Ah on dit quoi ! C'est Djoss en personne. J'ai scann\xE9 toute votre discussion et [sarcastically] c'est la magie totale ! ${titre}. ${verdict} Tu envoies des pav\xE9s de 50 lignes pour recevoir un 'ok' en retour. [scoffs] Le goumin frappe \xE0 ta porte et tu lui ouvres en grand ! Prends ton drap en douce et dis le gb\xEA. On est ensemble !`;
}
async function synthesizeElevenLabs(script) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID || "pMsXg2M65B3pI8iDWM3U";
  if (!apiKey || apiKey === "MY_ELEVENLABS_API_KEY") {
    console.log("[Djoss Server] ELEVENLABS_API_KEY non configur\xE9e. Passage au fallback TTS.");
    return null;
  }
  const modelsToTry = [
    process.env.ELEVENLABS_MODEL_ID || "eleven_v3",
    "eleven_multilingual_v2"
  ];
  for (const modelId of modelsToTry) {
    try {
      console.log(`[Djoss Server] Appel API ElevenLabs avec le mod\xE8le ${modelId}...`);
      const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: script,
          model_id: modelId,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        })
      });
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Audio = buffer.toString("base64");
        console.log(`[Djoss Server] G\xE9n\xE9ration audio ElevenLabs r\xE9ussie (${modelId}) !`);
        return base64Audio;
      } else {
        const errText = await response.text();
        console.warn(`[Djoss Server] \xC9chec ElevenLabs (${modelId}): ${response.status}`, errText);
      }
    } catch (e) {
      console.warn(`[Djoss Server] Erreur lors de l'appel ElevenLabs (${modelId}):`, e);
    }
  }
  return null;
}
app.get("/api/generate-audio/:id", async (req, res) => {
  const { id } = req.params;
  const db = readDb();
  let reportKey = id;
  if (!db[reportKey] && id === "current") {
    const keys = Object.keys(db);
    if (keys.length > 0) {
      reportKey = keys[keys.length - 1];
    }
  }
  let report = db[reportKey];
  if (!report) {
    const fallbackScript = `[laughs] Ah on dit quoi ! C'est Djoss en personne. J'ai scann\xE9 toute la discussion et c'est la magie ! Tu envoies des pav\xE9s de 50 lignes pour recevoir un 'ok' en retour. [scoffs] Le goumin frappe \xE0 ta porte et tu lui ouvres en grand ! Prends ton drap en douce et dis le gb\xEA. On est ensemble !`;
    return res.json({ useWebSpeech: true, script: fallbackScript });
  }
  if (report.audioBase64 && report.audioScript) {
    console.log(`[Djoss Server] Utilisation de l'audio en cache pour le rapport ${reportKey}`);
    return res.json({ audioBase64: report.audioBase64, script: report.audioScript });
  }
  let audioScript = report.audioScript;
  if (!audioScript) {
    audioScript = await genererScriptAudio(report);
    report.audioScript = audioScript;
    db[reportKey] = report;
    writeDb(db);
    saveProjectToDb(reportKey, report).catch(() => {
    });
  }
  const elevenLabsAudio = await synthesizeElevenLabs(audioScript);
  if (elevenLabsAudio) {
    report.audioBase64 = elevenLabsAudio;
    db[reportKey] = report;
    writeDb(db);
    saveProjectToDb(reportKey, report).catch(() => {
    });
    return res.json({ audioBase64: elevenLabsAudio, script: audioScript });
  }
  if (ai) {
    try {
      console.log(`G\xE9n\xE9ration audio avec Gemini TTS (fallback)...`);
      const cleanPromptText = audioScript.replace(/\[.*?\]/g, "").trim();
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: `Lis ce texte avec un ton tr\xE8s expressif, provocateur et vivant : ${cleanPromptText}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Zephyr" }
            }
          }
        }
      });
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        report.audioBase64 = base64Audio;
        db[reportKey] = report;
        writeDb(db);
        saveProjectToDb(reportKey, report).catch(() => {
        });
        return res.json({ audioBase64: base64Audio, script: audioScript });
      }
    } catch (e) {
      console.warn("\xC9chec du fallback Gemini TTS:", e);
    }
  }
  res.json({ useWebSpeech: true, script: audioScript });
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[Djoss Server] Running at http://localhost:${PORT}`);
    });
  }
}
if (!process.env.VERCEL) {
  startServer();
}
var server_default = app;
export {
  server_default as default,
  genererRapport
};
