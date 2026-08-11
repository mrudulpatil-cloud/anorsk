"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft, Check, X, RotateCcw, BookOpen, MessageCircle, Sparkles, GraduationCap,
  Award, ChevronDown, Flame, Zap, Lock, Loader2, Headphones, FileText, PenLine, Play,
  Volume2, Mic, Square, Info, TreePine, ShoppingCart, TramFront, Waves, Cake, Activity,
  Ship, Store, Snowflake, Plus, Repeat, Puzzle, Sun, Moon,
} from "lucide-react";

// Standalone replacement for Claude's artifact-only window.storage API.
// Same async get/set shape (throws on missing key, like the original),
// backed by the browser's real localStorage so the app works outside
// the Claude sandbox. This is an interim, single-device store — Phase 2
// swaps this for a real account-based database (Supabase).
const storage = {
  async get(key) {
    if (typeof window === "undefined") throw new Error("no window");
    const v = window.localStorage.getItem(`dypdykk:${key}`);
    if (v === null) throw new Error("not found");
    return { key, value: v };
  },
  async set(key, value) {
    if (typeof window === "undefined") return null;
    window.localStorage.setItem(`dypdykk:${key}`, value);
    return { key, value };
  },
};

const LIGHT_PALETTE = {
  bg: "#FAF9F4",
  card: "#FFFFFF",
  border: "#E3DFD3",
  ink: "#1C2430",
  body: "#3A3F47",
  muted: "#75766E",
  navy: "#1E3A5F",
  navyDeep: "#16324A",
  red: "#B8433D",
  green: "#4F7259",
  greenBg: "#EAF1EA",
  redBg: "#F7E9E8",
  gold: "#B08A3E",
  goldBg: "#F5EEDD",
};

const DARK_PALETTE = {
  bg: "#12161C",
  card: "#1B212B",
  border: "#2B3340",
  ink: "#EDEFF3",
  body: "#D7DCE3",
  muted: "#96A0AF",
  navy: "#6E9BD6",
  navyDeep: "#8CB2E0",
  red: "#E2857A",
  green: "#7FBF8F",
  greenBg: "#1E2B22",
  redBg: "#332120",
  gold: "#DBB968",
  goldBg: "#2B2413",
};

// C is a single mutable palette object referenced throughout via C.xxx.
// applyTheme() swaps its contents in place; since no component here is
// memoized, a top-level state change (theme) triggers a full re-render
// that reads the freshly-mutated values — no context/prop threading needed.
const C = { ...LIGHT_PALETTE };
function applyTheme(theme) {
  Object.assign(C, theme === "dark" ? DARK_PALETTE : LIGHT_PALETTE);
}

const STORAGE_KEY = "dypdykk-progress-v1";

const RANKS = [
  { min: 0, name: "Snorkler" },
  { min: 100, name: "Dykker" },
  { min: 300, name: "Avansert dykker" },
  { min: 600, name: "Dyphavsdykker" },
];

function rankFor(xp) {
  let r = RANKS[0];
  for (const rk of RANKS) if (xp >= rk.min) r = rk;
  const idx = RANKS.indexOf(r);
  const next = RANKS[idx + 1];
  return { ...r, next };
}

const BADGES = [
  { id: "first_dive", label: "Første dykk", desc: "Fullført din første ordprøve" },
  { id: "perfect", label: "Perfekt score", desc: "8/8 på en ordprøve" },
  { id: "a1_mastered", label: "A1 mestret", desc: "6/8 eller mer på A1-prøven" },
  { id: "a2_mastered", label: "A2 mestret", desc: "6/8 eller mer på A2-prøven" },
  { id: "b1_mastered", label: "B1 mestret", desc: "6/8 eller mer på B1-prøven" },
  { id: "b2_mastered", label: "B2 mestret", desc: "6/8 eller mer på B2-prøven" },
  { id: "sample_test", label: "Dypdykker", desc: "Fullført et komplett prøvesett" },
  { id: "evaluated", label: "Nivåvurdert", desc: "Fullført en nivåvurdering" },
  { id: "streak3", label: "Tre dager på rad", desc: "Øvd tre dager på rad" },
  { id: "srs_first", label: "Første repetisjon", desc: "Fullført din første repetisjonsøkt" },
  { id: "srs_10", label: "Ti ord repetert", desc: "Repetert totalt 10 ord med spaced repetition" },
  { id: "srs_mastered10", label: "Ti ord mestret", desc: "Nådd høyeste nivå på 10 ord i Repetisjon" },
];

const LEVELS = [
  {
    id: "A1", name: "Nybegynner", cefr: "A1 — Breakthrough", depth: 1, color: "#7FA0BE",
    blurb: "Greetings, introducing yourself, the verb å være, and basic word order.",
    vocab: [
      { no: "Hei", en: "Hello" }, { no: "God morgen", en: "Good morning" }, { no: "God dag", en: "Good afternoon" },
      { no: "God kveld", en: "Good evening" }, { no: "Ha det", en: "Goodbye" }, { no: "Takk", en: "Thanks" },
      { no: "Vær så snill", en: "Please" }, { no: "Ja / Nei", en: "Yes / No" }, { no: "Unnskyld", en: "Excuse me / Sorry" },
      { no: "Jeg / Du / Han / Hun", en: "I / You / He / She" }, { no: "Vi / Dere / De", en: "We / You (pl.) / They" },
      { no: "Én, to, tre, fire, fem", en: "One, two, three, four, five" },
    ],
    phrases: [
      { no: "Jeg heter ...", en: "My name is ..." }, { no: "Hva heter du?", en: "What's your name?" },
      { no: "Jeg kommer fra ...", en: "I come from ..." }, { no: "Jeg bor i ...", en: "I live in ..." },
      { no: "Hvordan går det?", en: "How's it going?" }, { no: "Det går bra, takk", en: "It's going well, thanks" },
      { no: "Snakker du engelsk?", en: "Do you speak English?" }, { no: "Jeg forstår ikke", en: "I don't understand" },
    ],
    grammar: [
      { title: "Å være (to be) never changes", body: "Unlike English, Norwegian verbs don't conjugate by person. Jeg er, du er, han/hun er, vi er, dere er, de er — one form for everyone. This is true for every verb, which makes present tense refreshingly simple." },
      { title: "Two genders: en and et", body: "Nouns are either en-words or et-words: en bil (a car), et hus (a house). The definite form ('the') is a suffix, not a separate word: bilen (the car), huset (the house)." },
      { title: "V2 word order", body: "The verb sits in the second position of a statement, even when something other than the subject starts the sentence. I dag jobber jeg — 'Today work I' — not 'Today I work'." },
      { title: "Pronouns as subject", body: "Jeg (I), du (you), han (he), hun (she), den/det (it), vi (we), dere (you pl.), de (they). Norwegian has no gendered 'it' distinction to worry about beyond den/det, which follows noun gender." },
    ],
    quiz: [
      { q: "How do you say 'Thank you' in Norwegian?", options: ["Ha det", "Takk", "Unnskyld", "Vær så snill"], answer: 1 },
      { q: "'Jeg heter Anna' means:", options: ["I live in Anna", "My name is Anna", "I come from Anna", "I like Anna"], answer: 1 },
      { q: "Fill the gap: Jeg ___ fra England. (I am from England)", options: ["har", "er", "være", "bor"], answer: 1 },
      { q: "Which is an et-word?", options: ["en bil", "en dag", "et hus", "en hund"], answer: 2 },
      { q: "'Hvordan går det?' asks about your:", options: ["name", "home country", "wellbeing", "age"], answer: 2 },
      { q: "Correct V2 order: 'Today I work' becomes:", options: ["I dag jeg jobber", "Jeg i dag jobber", "I dag jobber jeg", "Jobber jeg i dag"], answer: 2 },
      { q: "'Snakker du engelsk?' means:", options: ["Are you English?", "Do you speak English?", "Where are you from?", "Can you help me?"], answer: 1 },
      { q: "The definite form of 'et hus' (a house) is:", options: ["huset", "husen", "det hus", "huser"], answer: 0 },
    ],
  },
  {
    id: "A2", name: "Grunnleggende", cefr: "A2 — Waystage", depth: 2, color: "#4F7FA8",
    blurb: "Everyday errands, the weather, modal verbs, and simple past tense.",
    vocab: [
      { no: "Butikk", en: "Shop" }, { no: "Mat", en: "Food" }, { no: "Vær", en: "Weather" },
      { no: "Regn / Sol / Snø", en: "Rain / Sun / Snow" }, { no: "I dag / I morgen / I går", en: "Today / Tomorrow / Yesterday" },
      { no: "Klokken", en: "The clock / time" }, { no: "Jobb", en: "Job, work" }, { no: "Hus / Leilighet", en: "House / Apartment" },
      { no: "Buss / Tog", en: "Bus / Train" }, { no: "Billig / Dyrt", en: "Cheap / Expensive" },
      { no: "Kaldt / Varmt", en: "Cold / Warm" }, { no: "Familie", en: "Family" },
    ],
    phrases: [
      { no: "Hva koster det?", en: "How much does it cost?" }, { no: "Kan jeg få ...?", en: "Can I get ...?" },
      { no: "Klokken er ...", en: "The time is ..." }, { no: "Jeg må gå nå", en: "I have to go now" },
      { no: "Kan du hjelpe meg?", en: "Can you help me?" }, { no: "Hvor er ...?", en: "Where is ...?" },
      { no: "Jeg liker ...", en: "I like ..." }, { no: "Det er kaldt i dag", en: "It's cold today" },
    ],
    grammar: [
      { title: "Modal verbs + infinitive", body: "Kan (can), vil (want to), skal (shall/will), må (must) are followed by a bare infinitive, no 'å': Jeg må jobbe (I have to work), not Jeg må å jobbe." },
      { title: "Simple past (preteritum)", body: "Most regular verbs add -et: å snakke → jeg snakket (I spoke). Some strong verbs change the vowel instead: å dra → jeg dro (I went)." },
      { title: "Adjectives agree with the noun", body: "En fin bil (a nice car, en-word), et fint hus (a nice house, et-word), fine biler (nice cars, plural). The -t and -e endings track gender and number." },
      { title: "Core prepositions", body: "I (in), på (on/at), til (to), fra (from). Norwegian prepositions don't always map 1:1 to English — på jobb (at work), i Norge (in Norway) — so it's worth memorising set phrases." },
    ],
    quiz: [
      { q: "'Jeg må gå nå' means:", options: ["I want to go now", "I have to go now", "I can go now", "I went now"], answer: 1 },
      { q: "Which follows a modal verb correctly?", options: ["Jeg kan å svømme", "Jeg kan svømme", "Jeg kan svømmer", "Jeg kan svømt"], answer: 1 },
      { q: "Past tense of 'å snakke' (to speak):", options: ["snakker", "snakket", "snakke", "snakk"], answer: 1 },
      { q: "'Hva koster det?' is asking about:", options: ["location", "time", "price", "weather"], answer: 2 },
      { q: "En-word adjective agreement: 'a nice car' is:", options: ["en fint bil", "en fin bil", "et fin bil", "en fine bil"], answer: 1 },
      { q: "'Jeg liker sol, men ikke ___' (rain) is:", options: ["snø", "regn", "vind", "vær"], answer: 1 },
      { q: "Correct preposition: 'at work' is 'på ___'.", options: ["jobb", "arbeide", "jobber", "arbeidet"], answer: 0 },
      { q: "'I går' means:", options: ["Today", "Tomorrow", "Yesterday", "Every day"], answer: 2 },
    ],
  },
  {
    id: "B1", name: "Selvstendig", cefr: "B1 — Threshold", depth: 3, color: "#2C5679",
    blurb: "Opinions, connected reasoning, present perfect, and subordinate clauses.",
    vocab: [
      { no: "Mening", en: "Opinion" }, { no: "Samfunn", en: "Society" }, { no: "Miljø", en: "Environment" },
      { no: "Utdanning", en: "Education" }, { no: "Erfaring", en: "Experience" }, { no: "Interessant / Viktig", en: "Interesting / Important" },
      { no: "Dessverre", en: "Unfortunately" }, { no: "Derfor", en: "Therefore" }, { no: "Selv om", en: "Even though" },
      { no: "I tillegg", en: "In addition" }, { no: "Egentlig", en: "Actually" }, { no: "Likevel", en: "Nevertheless" },
    ],
    phrases: [
      { no: "Jeg synes at ...", en: "I think that ..." }, { no: "Etter min mening ...", en: "In my opinion ..." },
      { no: "Det kommer an på ...", en: "It depends on ..." }, { no: "Jeg er enig / uenig", en: "I agree / disagree" },
      { no: "For det første ... for det andre ...", en: "Firstly ... secondly ..." }, { no: "Det er viktig å ...", en: "It's important to ..." },
      { no: "Så vidt jeg vet ...", en: "As far as I know ..." }, { no: "Alt tatt i betraktning ...", en: "All things considered ..." },
    ],
    grammar: [
      { title: "Perfektum: har + past participle", body: "The present perfect uses har (or er for motion verbs) plus a participle: Jeg har spist (I have eaten), Jeg er reist (I have travelled). Reach for this whenever an action connects the past to now." },
      { title: "Subordinate clauses shift word order", body: "After conjunctions like fordi, at, om, når, the negation ikke moves before the verb instead of after it: ... fordi jeg ikke forstår (... because I don't understand), versus Jeg forstår ikke in a main clause." },
      { title: "The relative pronoun som", body: "Som covers 'who', 'which', and 'that' in one word: Mannen som bor der ... (The man who lives there ...). It never changes form." },
      { title: "Linking an argument", body: "Derfor (therefore), dessuten (moreover), men (but), likevel (nevertheless) let you build the kind of connected, multi-sentence reasoning the B1 writing and oral tasks look for." },
    ],
    quiz: [
      { q: "'Jeg har spist' means:", options: ["I eat", "I ate", "I have eaten", "I will eat"], answer: 2 },
      { q: "'Som' most closely translates to:", options: ["and / but", "who / which / that", "because", "if"], answer: 1 },
      { q: "In a subordinate clause, 'ikke' moves:", options: ["after the verb, as usual", "before the verb", "to the start of the clause", "to the end of the sentence"], answer: 1 },
      { q: "'Etter min mening' means:", options: ["After a while", "In my opinion", "By the way", "It depends"], answer: 1 },
      { q: "Which word signals a contrast?", options: ["derfor", "dessuten", "likevel", "egentlig"], answer: 2 },
      { q: "'Det kommer an på ...' means:", options: ["It's about ...", "It depends on ...", "It's called ...", "It comes from ..."], answer: 1 },
      { q: "Motion verbs in perfektum often use:", options: ["har", "er", "skal", "må"], answer: 1 },
      { q: "'Selv om' introduces:", options: ["a reason", "a result", "a concession (even though)", "a time"], answer: 2 },
    ],
  },
  {
    id: "B2", name: "Viderekommen", cefr: "B2 — Vantage", depth: 4, color: "#16324A",
    blurb: "Abstract debate, passive voice, nominalisation, and formal register.",
    vocab: [
      { no: "Konsekvens", en: "Consequence" }, { no: "Påvirke", en: "To influence" }, { no: "Utfordring", en: "Challenge" },
      { no: "Løsning", en: "Solution" }, { no: "Holdning", en: "Attitude" }, { no: "Rettighet / Plikt", en: "Right / Duty" },
      { no: "Bærekraftig", en: "Sustainable" }, { no: "Mangfold", en: "Diversity" }, { no: "Integrering", en: "Integration" },
      { no: "Debatt / Argument", en: "Debate / Argument" }, { no: "Forutsetning", en: "Prerequisite" }, { no: "Forbruk", en: "Consumption" },
    ],
    phrases: [
      { no: "På den ene siden ... på den andre siden ...", en: "On one hand ... on the other hand ..." },
      { no: "Det er ingen tvil om at ...", en: "There's no doubt that ..." },
      { no: "Selv om det kan virke ..., er det ...", en: "Even though it may seem ..., it is ..." },
      { no: "Man kan argumentere for at ...", en: "One can argue that ..." }, { no: "Alt i alt", en: "All in all" },
      { no: "Til tross for at ...", en: "Despite the fact that ..." }, { no: "Dette reiser spørsmålet om ...", en: "This raises the question of ..." },
    ],
    grammar: [
      { title: "Passive voice: two forms", body: "The -s passive is common in writing: Møtet avlyses hver mandag (The meeting is cancelled every Monday, a rule). The bli-passive marks a single event: Møtet ble avlyst (The meeting was cancelled)." },
      { title: "Nominalisation", body: "Formal Norwegian favours abstract nouns over verbs: å forbedre (to improve) becomes forbedring (an improvement). Å redusere becomes reduksjon. This is the register the B2 written exam expects." },
      { title: "Concession and complex conjunctions", body: "Til tross for at, i og med at, and selv om let you concede a point before making your own — essential structure for the argumentative essay task at this level." },
      { title: "Formal vs. spoken register", body: "Written B2 Norwegian avoids spoken fillers (egentlig, liksom, jo) and prefers precise connectors (dessuten, følgelig, dermed) — a shift candidates often under-prepare for." },
    ],
    quiz: [
      { q: "The -s passive is typically used for:", options: ["a single, one-off event", "a recurring or general rule", "questions only", "commands"], answer: 1 },
      { q: "'Forbedring' is the nominalised form of:", options: ["å forbedre", "å forberede", "å forbruke", "å foreslå"], answer: 0 },
      { q: "'Til tross for at' introduces:", options: ["a cause", "a concession", "a condition", "a result"], answer: 1 },
      { q: "'Man kan argumentere for at ...' means:", options: ["It is proven that ...", "One can argue that ...", "It is forbidden to ...", "It seems that ..."], answer: 1 },
      { q: "Which word fits formal writing over spoken register?", options: ["liksom", "jo", "dermed", "egentlig"], answer: 2 },
      { q: "'Bærekraftig' means:", options: ["Sustainable", "Profitable", "Diverse", "Mandatory"], answer: 0 },
      { q: "'Dette reiser spørsmålet om ...' means:", options: ["This solves the problem of ...", "This raises the question of ...", "This avoids the issue of ...", "This proves that ..."], answer: 1 },
      { q: "Bli-passive best marks:", options: ["a general truth", "a specific, completed event", "future intention", "a habitual routine"], answer: 1 },
    ],
  },
];

const VERB_BUCKETS = {
  A1: [
    { no: "være", en: "to be", pret: "var" },
    { no: "ha", en: "to have", pret: "hadde" },
    { no: "bli", en: "to become / to be (passive)", pret: "ble" },
    { no: "kunne", en: "can / to be able to", pret: "kunne" },
    { no: "ville", en: "will / to want to", pret: "ville" },
    { no: "skulle", en: "shall / should", pret: "skulle" },
    { no: "måtte", en: "must / to have to", pret: "måtte" },
    { no: "burde", en: "ought to / should", pret: "burde" },
    { no: "gjøre", en: "to do / make", pret: "gjorde" },
    { no: "si", en: "to say", pret: "sa" },
    { no: "ta", en: "to take", pret: "tok" },
    { no: "komme", en: "to come", pret: "kom" },
    { no: "gå", en: "to go / walk", pret: "gikk" },
    { no: "se", en: "to see", pret: "så" },
    { no: "vite", en: "to know (a fact)", pret: "visste" },
    { no: "få", en: "to get / receive", pret: "fikk" },
    { no: "gi", en: "to give", pret: "ga" },
    { no: "tro", en: "to believe / think", pret: "trodde" },
    { no: "mene", en: "to mean / to think (opinion)", pret: "mente" },
    { no: "spørre", en: "to ask", pret: "spurte" },
    { no: "svare", en: "to answer", pret: "svarte" },
    { no: "snakke", en: "to talk / speak", pret: "snakket" },
    { no: "tenke", en: "to think", pret: "tenkte" },
    { no: "finne", en: "to find", pret: "fant" },
    { no: "bruke", en: "to use", pret: "brukte" },
    { no: "sette", en: "to set / put", pret: "satte" },
    { no: "legge", en: "to lay / put down", pret: "la" },
    { no: "stå", en: "to stand", pret: "sto" },
    { no: "ligge", en: "to lie (position)", pret: "lå" },
    { no: "sitte", en: "to sit", pret: "satt" },
    { no: "holde", en: "to hold / keep", pret: "holdt" },
    { no: "begynne", en: "to begin", pret: "begynte" },
    { no: "slutte", en: "to stop / finish", pret: "sluttet" },
    { no: "fortsette", en: "to continue", pret: "fortsatte" },
    { no: "prøve", en: "to try", pret: "prøvde" },
    { no: "klare", en: "to manage", pret: "klarte" },
    { no: "trenge", en: "to need", pret: "trengte" },
    { no: "ønske", en: "to wish", pret: "ønsket" },
    { no: "like", en: "to like", pret: "likte" },
    { no: "elske", en: "to love", pret: "elsket" },
    { no: "hate", en: "to hate", pret: "hatet" },
    { no: "håpe", en: "to hope", pret: "håpet" },
    { no: "vise", en: "to show", pret: "viste" },
    { no: "skrive", en: "to write", pret: "skrev" },
    { no: "lese", en: "to read", pret: "leste" },
    { no: "høre", en: "to hear", pret: "hørte" },
    { no: "lytte", en: "to listen", pret: "lyttet" },
    { no: "kjøpe", en: "to buy", pret: "kjøpte" },
    { no: "selge", en: "to sell", pret: "solgte" },
    { no: "betale", en: "to pay", pret: "betalte" },
    { no: "koste", en: "to cost", pret: "kostet" },
    { no: "spise", en: "to eat", pret: "spiste" },
    { no: "drikke", en: "to drink", pret: "drakk" },
    { no: "sove", en: "to sleep", pret: "sov" },
    { no: "våkne", en: "to wake up", pret: "våknet" },
    { no: "jobbe", en: "to work", pret: "jobbet" },
    { no: "arbeide", en: "to work", pret: "arbeidet" },
    { no: "studere", en: "to study", pret: "studerte" },
    { no: "lære", en: "to learn / to teach", pret: "lærte" },
    { no: "undervise", en: "to teach", pret: "underviste" },
  ],
  A2: [
    { no: "forstå", en: "to understand", pret: "forsto" },
    { no: "huske", en: "to remember", pret: "husket" },
    { no: "glemme", en: "to forget", pret: "glemte" },
    { no: "tape", en: "to lose", pret: "tapte" },
    { no: "vinne", en: "to win", pret: "vant" },
    { no: "spille", en: "to play", pret: "spilte" },
    { no: "danse", en: "to dance", pret: "danset" },
    { no: "synge", en: "to sing", pret: "sang" },
    { no: "løpe", en: "to run", pret: "løp" },
    { no: "kjøre", en: "to drive", pret: "kjørte" },
    { no: "fly", en: "to fly", pret: "fløy" },
    { no: "reise", en: "to travel", pret: "reiste" },
    { no: "flytte", en: "to move (residence)", pret: "flyttet" },
    { no: "bo", en: "to live / reside", pret: "bodde" },
    { no: "bygge", en: "to build", pret: "bygde" },
    { no: "lage", en: "to make", pret: "laget" },
    { no: "skape", en: "to create", pret: "skapte" },
    { no: "ødelegge", en: "to destroy", pret: "ødela" },
    { no: "reparere", en: "to repair", pret: "reparerte" },
    { no: "rydde", en: "to tidy up", pret: "ryddet" },
    { no: "vaske", en: "to wash", pret: "vasket" },
    { no: "rengjøre", en: "to clean", pret: "rengjorde" },
    { no: "lukke", en: "to close", pret: "lukket" },
    { no: "åpne", en: "to open", pret: "åpnet" },
    { no: "starte", en: "to start", pret: "startet" },
    { no: "stoppe", en: "to stop", pret: "stoppet" },
    { no: "avslutte", en: "to end / conclude", pret: "avsluttet" },
    { no: "fortelle", en: "to tell", pret: "fortalte" },
    { no: "forklare", en: "to explain", pret: "forklarte" },
    { no: "diskutere", en: "to discuss", pret: "diskuterte" },
    { no: "møte", en: "to meet", pret: "møtte" },
    { no: "treffe", en: "to meet / to hit", pret: "traff" },
    { no: "besøke", en: "to visit", pret: "besøkte" },
    { no: "invitere", en: "to invite", pret: "inviterte" },
    { no: "takke", en: "to thank", pret: "takket" },
    { no: "beklage", en: "to apologize / regret", pret: "beklaget" },
    { no: "unnskylde", en: "to excuse", pret: "unnskyldte" },
    { no: "love", en: "to promise", pret: "lovte" },
    { no: "lyve", en: "to lie (tell a falsehood)", pret: "løy" },
    { no: "stjele", en: "to steal", pret: "stjal" },
    { no: "sende", en: "to send", pret: "sendte" },
    { no: "motta", en: "to receive", pret: "mottok" },
    { no: "levere", en: "to deliver", pret: "leverte" },
    { no: "hente", en: "to fetch / pick up", pret: "hentet" },
    { no: "bære", en: "to carry", pret: "bar" },
    { no: "løfte", en: "to lift", pret: "løftet" },
    { no: "kaste", en: "to throw", pret: "kastet" },
    { no: "fange", en: "to catch", pret: "fanget" },
    { no: "gripe", en: "to grab / seize", pret: "grep" },
    { no: "slippe", en: "to let go / release", pret: "slapp" },
    { no: "dra", en: "to pull / to go", pret: "dro" },
    { no: "skyve", en: "to push", pret: "skjøv" },
    { no: "trekke", en: "to pull", pret: "trakk" },
    { no: "presse", en: "to press / push", pret: "presset" },
    { no: "klemme", en: "to squeeze / hug", pret: "klemte" },
    { no: "kysse", en: "to kiss", pret: "kysset" },
    { no: "røre", en: "to touch / stir", pret: "rørte" },
    { no: "berøre", en: "to touch", pret: "berørte" },
    { no: "føle", en: "to feel", pret: "følte" },
    { no: "kjenne", en: "to know (a person) / to feel", pret: "kjente" },
    { no: "merke", en: "to notice", pret: "merket" },
    { no: "oppdage", en: "to discover", pret: "oppdaget" },
    { no: "undersøke", en: "to investigate / examine", pret: "undersøkte" },
    { no: "utforske", en: "to explore", pret: "utforsket" },
    { no: "lete", en: "to search", pret: "lette" },
    { no: "søke", en: "to search / apply", pret: "søkte" },
    { no: "miste", en: "to lose (something)", pret: "mistet" },
    { no: "sikre", en: "to secure / ensure", pret: "sikret" },
    { no: "beskytte", en: "to protect", pret: "beskyttet" },
    { no: "forsvare", en: "to defend", pret: "forsvarte" },
    { no: "angripe", en: "to attack", pret: "angrep" },
    { no: "kjempe", en: "to fight / struggle", pret: "kjempet" },
    { no: "slåss", en: "to fight (physically)", pret: "sloss" },
    { no: "slå", en: "to hit / beat", pret: "slo" },
    { no: "skade", en: "to harm / injure", pret: "skadet" },
    { no: "skje", en: "to happen", pret: "skjedde" },
    { no: "hende", en: "to happen", pret: "hendte" },
    { no: "oppstå", en: "to arise / occur", pret: "oppsto" },
    { no: "forsvinne", en: "to disappear", pret: "forsvant" },
    { no: "forlate", en: "to leave", pret: "forlot" },
    { no: "returnere", en: "to return", pret: "returnerte" },
    { no: "ankomme", en: "to arrive", pret: "ankom" },
    { no: "vente", en: "to wait", pret: "ventet" },
    { no: "skynde", en: "to hurry", pret: "skyndte" },
    { no: "forsinke", en: "to delay", pret: "forsinket" },
    { no: "utsette", en: "to postpone", pret: "utsatte" },
    { no: "planlegge", en: "to plan", pret: "planla" },
    { no: "organisere", en: "to organize", pret: "organiserte" },
    { no: "forberede", en: "to prepare", pret: "forberedte" },
    { no: "avgjøre", en: "to decide / determine", pret: "avgjorde" },
    { no: "bestemme", en: "to decide", pret: "bestemte" },
    { no: "velge", en: "to choose", pret: "valgte" },
    { no: "foretrekke", en: "to prefer", pret: "foretrakk" },
    { no: "sammenligne", en: "to compare", pret: "sammenlignet" },
    { no: "vurdere", en: "to assess / consider", pret: "vurderte" },
    { no: "dømme", en: "to judge / sentence", pret: "dømte" },
    { no: "kritisere", en: "to criticize", pret: "kritiserte" },
    { no: "rose", en: "to praise", pret: "roste" },
    { no: "anbefale", en: "to recommend", pret: "anbefalte" },
    { no: "foreslå", en: "to suggest", pret: "foreslo" },
    { no: "argumentere", en: "to argue", pret: "argumenterte" },
    { no: "overbevise", en: "to convince", pret: "overbeviste" },
    { no: "overtale", en: "to persuade", pret: "overtalte" },
    { no: "tvile", en: "to doubt", pret: "tvilte" },
    { no: "stole", en: "to trust", pret: "stolte" },
    { no: "tillate", en: "to allow", pret: "tillot" },
    { no: "nekte", en: "to refuse / deny", pret: "nektet" },
    { no: "forby", en: "to forbid", pret: "forbød" },
    { no: "kreve", en: "to demand / require", pret: "krevde" },
    { no: "insistere", en: "to insist", pret: "insisterte" },
    { no: "tilby", en: "to offer", pret: "tilbød" },
    { no: "akseptere", en: "to accept", pret: "aksepterte" },
    { no: "avvise", en: "to reject", pret: "avviste" },
    { no: "godta", en: "to accept / approve", pret: "godtok" },
    { no: "avslå", en: "to decline / refuse", pret: "avslo" },
    { no: "oppgi", en: "to give up / to state", pret: "oppga" },
    { no: "overgi", en: "to surrender / hand over", pret: "overga" },
    { no: "konkurrere", en: "to compete", pret: "konkurrerte" },
    { no: "samarbeide", en: "to cooperate", pret: "samarbeidet" },
    { no: "delta", en: "to participate", pret: "deltok" },
  ],
  B1: [
    { no: "bidra", en: "to contribute", pret: "bidro" },
    { no: "hjelpe", en: "to help", pret: "hjalp" },
    { no: "støtte", en: "to support", pret: "støttet" },
    { no: "oppmuntre", en: "to encourage", pret: "oppmuntret" },
    { no: "motivere", en: "to motivate", pret: "motiverte" },
    { no: "inspirere", en: "to inspire", pret: "inspirerte" },
    { no: "påvirke", en: "to influence", pret: "påvirket" },
    { no: "kontrollere", en: "to control / check", pret: "kontrollerte" },
    { no: "styre", en: "to steer / manage", pret: "styrte" },
    { no: "lede", en: "to lead", pret: "ledet" },
    { no: "administrere", en: "to administer", pret: "administrerte" },
    { no: "drive", en: "to run / operate", pret: "drev" },
    { no: "eie", en: "to own", pret: "eide" },
    { no: "låne", en: "to borrow / lend", pret: "lånte" },
    { no: "leie", en: "to rent", pret: "leide" },
    { no: "investere", en: "to invest", pret: "investerte" },
    { no: "spare", en: "to save (money)", pret: "sparte" },
    { no: "tjene", en: "to earn", pret: "tjente" },
    { no: "fortjene", en: "to deserve", pret: "fortjente" },
    { no: "satse", en: "to bet / invest effort", pret: "satset" },
    { no: "risikere", en: "to risk", pret: "risikerte" },
    { no: "våge", en: "to dare", pret: "våget" },
    { no: "tørre", en: "to dare", pret: "torde" },
    { no: "frykte", en: "to fear", pret: "fryktet" },
    { no: "bekymre", en: "to worry", pret: "bekymret" },
    { no: "stresse", en: "to stress", pret: "stresset" },
    { no: "slappe", en: "to relax", pret: "slappet" },
    { no: "hvile", en: "to rest", pret: "hvilte" },
    { no: "puste", en: "to breathe", pret: "pustet" },
    { no: "leve", en: "to live / be alive", pret: "levde" },
    { no: "dø", en: "to die", pret: "døde" },
    { no: "fødes", en: "to be born", pret: "ble født" },
    { no: "vokse", en: "to grow", pret: "vokste" },
    { no: "utvikle", en: "to develop", pret: "utviklet" },
    { no: "forandre", en: "to change", pret: "forandret" },
    { no: "endre", en: "to change / alter", pret: "endret" },
    { no: "forbedre", en: "to improve", pret: "forbedret" },
    { no: "forverre", en: "to worsen", pret: "forverret" },
    { no: "øke", en: "to increase", pret: "økte" },
    { no: "minske", en: "to decrease", pret: "minsket" },
    { no: "redusere", en: "to reduce", pret: "reduserte" },
    { no: "falle", en: "to fall", pret: "falt" },
    { no: "stige", en: "to rise / climb", pret: "steg" },
    { no: "synke", en: "to sink", pret: "sank" },
    { no: "flyte", en: "to float", pret: "fløt" },
    { no: "svømme", en: "to swim", pret: "svømte" },
    { no: "dykke", en: "to dive", pret: "dykket" },
    { no: "seile", en: "to sail", pret: "seilte" },
    { no: "padle", en: "to paddle", pret: "padlet" },
    { no: "klatre", en: "to climb", pret: "klatret" },
    { no: "hoppe", en: "to jump", pret: "hoppet" },
    { no: "vandre", en: "to wander / hike", pret: "vandret" },
    { no: "spasere", en: "to stroll", pret: "spaserte" },
    { no: "jogge", en: "to jog", pret: "jogget" },
    { no: "trene", en: "to train / exercise", pret: "trente" },
    { no: "øve", en: "to practice", pret: "øvde" },
    { no: "mestre", en: "to master", pret: "mestret" },
    { no: "lykkes", en: "to succeed", pret: "lyktes" },
    { no: "mislykkes", en: "to fail", pret: "mislyktes" },
    { no: "feile", en: "to fail / err", pret: "feilet" },
    { no: "teste", en: "to test", pret: "testet" },
    { no: "sjekke", en: "to check", pret: "sjekket" },
    { no: "verifisere", en: "to verify", pret: "verifiserte" },
    { no: "bekrefte", en: "to confirm", pret: "bekreftet" },
    { no: "bevise", en: "to prove", pret: "beviste" },
    { no: "motbevise", en: "to disprove", pret: "motbeviste" },
    { no: "demonstrere", en: "to demonstrate", pret: "demonstrerte" },
    { no: "avsløre", en: "to reveal", pret: "avslørte" },
    { no: "skjule", en: "to hide", pret: "skjulte" },
    { no: "gjemme", en: "to hide (something)", pret: "gjemte" },
    { no: "dekke", en: "to cover", pret: "dekket" },
    { no: "avdekke", en: "to uncover", pret: "avdekket" },
    { no: "pakke", en: "to pack", pret: "pakket" },
    { no: "folde", en: "to fold", pret: "foldet" },
    { no: "brette", en: "to fold", pret: "brettet" },
    { no: "rulle", en: "to roll", pret: "rullet" },
    { no: "vri", en: "to twist", pret: "vred" },
    { no: "dreie", en: "to turn / rotate", pret: "dreide" },
    { no: "snu", en: "to turn around", pret: "snudde" },
    { no: "vende", en: "to turn", pret: "vendte" },
    { no: "bøye", en: "to bend", pret: "bøyde" },
    { no: "strekke", en: "to stretch", pret: "strakte" },
    { no: "knekke", en: "to crack / break", pret: "knekte" },
    { no: "brekke", en: "to break", pret: "brakk" },
    { no: "knuse", en: "to smash", pret: "knuste" },
    { no: "splitte", en: "to split", pret: "splittet" },
    { no: "dele", en: "to share / divide", pret: "delte" },
    { no: "samle", en: "to gather / collect", pret: "samlet" },
    { no: "sanke", en: "to gather", pret: "sanket" },
    { no: "plukke", en: "to pick", pret: "plukket" },
    { no: "høste", en: "to harvest", pret: "høstet" },
    { no: "så", en: "to sow", pret: "sådde" },
    { no: "plante", en: "to plant", pret: "plantet" },
    { no: "dyrke", en: "to cultivate / grow", pret: "dyrket" },
    { no: "vanne", en: "to water", pret: "vannet" },
    { no: "blomstre", en: "to bloom / flourish", pret: "blomstret" },
    { no: "visne", en: "to wither", pret: "visnet" },
    { no: "gro", en: "to grow (of plants/wounds)", pret: "grodde" },
    { no: "modne", en: "to ripen", pret: "modnet" },
    { no: "koke", en: "to boil", pret: "kokte" },
    { no: "steke", en: "to fry", pret: "stekte" },
    { no: "bake", en: "to bake", pret: "bakte" },
    { no: "grille", en: "to grill", pret: "grillet" },
    { no: "riste", en: "to toast / shake", pret: "ristet" },
    { no: "skjære", en: "to cut", pret: "skar" },
    { no: "kutte", en: "to cut", pret: "kuttet" },
    { no: "hakke", en: "to chop", pret: "hakket" },
    { no: "blande", en: "to mix", pret: "blandet" },
    { no: "smake", en: "to taste", pret: "smakte" },
    { no: "krydre", en: "to season / spice", pret: "krydret" },
    { no: "servere", en: "to serve", pret: "serverte" },
    { no: "varme", en: "to warm / heat", pret: "varmet" },
    { no: "kjøle", en: "to cool", pret: "kjølte" },
    { no: "fryse", en: "to freeze", pret: "frøs" },
    { no: "tine", en: "to thaw", pret: "tinte" },
    { no: "smelte", en: "to melt", pret: "smeltet" },
    { no: "male", en: "to paint / to grind", pret: "malte" },
    { no: "pusse", en: "to polish / renovate", pret: "pusset" },
    { no: "montere", en: "to assemble / install", pret: "monterte" },
    { no: "installere", en: "to install", pret: "installerte" },
    { no: "koble", en: "to connect", pret: "koblet" },
    { no: "skru", en: "to screw / turn (a knob)", pret: "skrudde" },
    { no: "feste", en: "to fasten / attach", pret: "festet" },
    { no: "henge", en: "to hang", pret: "hengte" },
    { no: "plassere", en: "to place", pret: "plasserte" },
    { no: "arrangere", en: "to arrange", pret: "arrangerte" },
    { no: "dekorere", en: "to decorate", pret: "dekorerte" },
    { no: "pynte", en: "to decorate / dress up", pret: "pyntet" },
    { no: "tenne", en: "to light / turn on", pret: "tente" },
    { no: "slukke", en: "to extinguish / turn off", pret: "slukket" },
    { no: "lade", en: "to charge", pret: "ladet" },
    { no: "klikke", en: "to click", pret: "klikket" },
    { no: "trykke", en: "to press", pret: "trykket" },
    { no: "taste", en: "to key in / type", pret: "tastet" },
    { no: "ringe", en: "to call (phone)", pret: "ringte" },
    { no: "maile", en: "to email", pret: "mailet" },
    { no: "poste", en: "to post", pret: "postet" },
    { no: "streame", en: "to stream", pret: "streamet" },
    { no: "laste", en: "to load / download", pret: "lastet" },
    { no: "oppdatere", en: "to update", pret: "oppdaterte" },
    { no: "slette", en: "to delete", pret: "slettet" },
    { no: "glede", en: "to please / delight", pret: "gledet" },
    { no: "more", en: "to amuse", pret: "moret" },
    { no: "kjede", en: "to bore", pret: "kjedet" },
    { no: "irritere", en: "to irritate", pret: "irriterte" },
    { no: "ergre", en: "to annoy", pret: "ergret" },
    { no: "skuffe", en: "to disappoint", pret: "skuffet" },
    { no: "overraske", en: "to surprise", pret: "overrasket" },
    { no: "sjokkere", en: "to shock", pret: "sjokkerte" },
    { no: "forbause", en: "to astonish", pret: "forbauset" },
  ],
  B2: [
    { no: "imponere", en: "to impress", pret: "imponerte" },
    { no: "fascinere", en: "to fascinate", pret: "fascinerte" },
    { no: "trøste", en: "to comfort", pret: "trøstet" },
    { no: "berolige", en: "to calm / reassure", pret: "beroliget" },
    { no: "provosere", en: "to provoke", pret: "provoserte" },
    { no: "fornærme", en: "to insult", pret: "fornærmet" },
    { no: "krenke", en: "to violate / offend", pret: "krenket" },
    { no: "respektere", en: "to respect", pret: "respekterte" },
    { no: "beundre", en: "to admire", pret: "beundret" },
    { no: "gifte", en: "to marry", pret: "giftet" },
    { no: "skille", en: "to separate / divorce", pret: "skilte" },
    { no: "forlove", en: "to get engaged", pret: "forlovet" },
    { no: "flørte", en: "to flirt", pret: "flørtet" },
    { no: "omgås", en: "to associate with", pret: "omgikkes" },
    { no: "presentere", en: "to present / introduce", pret: "presenterte" },
    { no: "hilse", en: "to greet", pret: "hilste" },
    { no: "nikke", en: "to nod", pret: "nikket" },
    { no: "vinke", en: "to wave", pret: "vinket" },
    { no: "smile", en: "to smile", pret: "smilte" },
    { no: "le", en: "to laugh", pret: "lo" },
    { no: "gråte", en: "to cry", pret: "gråt" },
    { no: "skrike", en: "to scream", pret: "skrek" },
    { no: "rope", en: "to shout / call out", pret: "ropte" },
    { no: "hviske", en: "to whisper", pret: "hvisket" },
    { no: "mumle", en: "to mumble", pret: "mumlet" },
    { no: "stamme", en: "to stutter", pret: "stammet" },
    { no: "sukke", en: "to sigh", pret: "sukket" },
    { no: "gjespe", en: "to yawn", pret: "gjespet" },
    { no: "nyse", en: "to sneeze", pret: "nyste" },
    { no: "hoste", en: "to cough", pret: "hostet" },
    { no: "klø", en: "to itch / scratch", pret: "klødde" },
    { no: "svette", en: "to sweat", pret: "svettet" },
    { no: "skjelve", en: "to tremble / shiver", pret: "skalv" },
    { no: "pugge", en: "to cram / memorize", pret: "pugget" },
    { no: "repetere", en: "to repeat / revise", pret: "repeterte" },
    { no: "eksaminere", en: "to examine (test)", pret: "eksaminerte" },
    { no: "bestå", en: "to pass (an exam)", pret: "besto" },
    { no: "stryke", en: "to fail (an exam) / iron", pret: "strøk" },
    { no: "signere", en: "to sign", pret: "signerte" },
    { no: "undertegne", en: "to sign / undersign", pret: "undertegnet" },
    { no: "godkjenne", en: "to approve", pret: "godkjente" },
    { no: "anklage", en: "to accuse", pret: "anklaget" },
    { no: "saksøke", en: "to sue", pret: "saksøkte" },
    { no: "frikjenne", en: "to acquit", pret: "frikjente" },
    { no: "arrestere", en: "to arrest", pret: "arresterte" },
    { no: "fengsle", en: "to imprison", pret: "fengslet" },
    { no: "løslate", en: "to release (from custody)", pret: "løslot" },
    { no: "straffe", en: "to punish", pret: "straffet" },
    { no: "vedta", en: "to adopt / resolve (a law)", pret: "vedtok" },
    { no: "stemme", en: "to vote / to match", pret: "stemte" },
    { no: "utnevne", en: "to appoint", pret: "utnevnte" },
    { no: "ansette", en: "to hire / employ", pret: "ansatte" },
    { no: "avskjedige", en: "to dismiss / fire", pret: "avskjediget" },
    { no: "permittere", en: "to lay off temporarily", pret: "permitterte" },
    { no: "forhandle", en: "to negotiate", pret: "forhandlet" },
    { no: "avtale", en: "to agree / arrange", pret: "avtalte" },
    { no: "fakturere", en: "to invoice", pret: "fakturerte" },
    { no: "refundere", en: "to refund", pret: "refunderte" },
    { no: "kompensere", en: "to compensate", pret: "kompenserte" },
    { no: "budsjettere", en: "to budget", pret: "budsjetterte" },
    { no: "kalkulere", en: "to calculate", pret: "kalkulerte" },
    { no: "beregne", en: "to calculate / estimate", pret: "beregnet" },
    { no: "estimere", en: "to estimate", pret: "estimerte" },
    { no: "rapportere", en: "to report", pret: "rapporterte" },
    { no: "evaluere", en: "to evaluate", pret: "evaluerte" },
    { no: "analysere", en: "to analyze", pret: "analyserte" },
    { no: "forske", en: "to research", pret: "forsket" },
    { no: "regne", en: "to rain / to calculate", pret: "regnet" },
    { no: "snø", en: "to snow", pret: "snødde" },
    { no: "blåse", en: "to blow", pret: "blåste" },
    { no: "tordne", en: "to thunder", pret: "tordnet" },
    { no: "lyne", en: "to lighten (weather)", pret: "lynte" },
    { no: "skinne", en: "to shine", pret: "skinte" },
    { no: "ake", en: "to sled / slide", pret: "akte" },
    { no: "gli", en: "to slide / glide", pret: "gled" },
    { no: "krype", en: "to crawl", pret: "krøp" },
    { no: "hinke", en: "to hop / limp", pret: "hinket" },
    { no: "børste", en: "to brush", pret: "børstet" },
    { no: "gni", en: "to rub", pret: "gned" },
    { no: "skrubbe", en: "to scrub", pret: "skrubbet" },
    { no: "tørke", en: "to dry / wipe", pret: "tørket" },
    { no: "skylle", en: "to rinse", pret: "skylte" },
    { no: "dyppe", en: "to dip", pret: "dyppet" },
    { no: "helle", en: "to pour", pret: "helte" },
    { no: "fylle", en: "to fill", pret: "fylte" },
    { no: "tømme", en: "to empty", pret: "tømte" },
    { no: "veie", en: "to weigh", pret: "veide" },
    { no: "måle", en: "to measure", pret: "målte" },
    { no: "telle", en: "to count", pret: "talte" },
    { no: "regne ut", en: "to calculate / work out", pret: "regnet ut" },
    { no: "summere", en: "to sum up", pret: "summerte" },
    { no: "dele opp", en: "to divide up", pret: "delte opp" },
    { no: "koble sammen", en: "to connect / link together", pret: "koblet sammen" },
    { no: "adskille", en: "to separate", pret: "adskilte" },
    { no: "blande sammen", en: "to mix together", pret: "blandet sammen" },
    { no: "forene", en: "to unite", pret: "forente" },
    { no: "knytte", en: "to tie / bind", pret: "knyttet" },
    { no: "løse", en: "to solve / loosen", pret: "løste" },
    { no: "binde", en: "to bind / tie", pret: "bandt" },
    { no: "henge opp", en: "to hang up", pret: "hengte opp" },
    { no: "ta av", en: "to take off", pret: "tok av" },
    { no: "kle på", en: "to dress", pret: "kledde på" },
    { no: "kle av", en: "to undress", pret: "kledde av" },
    { no: "bytte", en: "to change / swap", pret: "byttet" },
    { no: "skifte", en: "to change / switch", pret: "skiftet" },
    { no: "erstatte", en: "to replace", pret: "erstattet" },
    { no: "fjerne", en: "to remove", pret: "fjernet" },
    { no: "legge til", en: "to add", pret: "la til" },
    { no: "trekke fra", en: "to subtract", pret: "trakk fra" },
    { no: "dele ut", en: "to distribute", pret: "delte ut" },
    { no: "dele på", en: "to divide by / share", pret: "delte på" },
    { no: "gange", en: "to multiply", pret: "ganget" },
    { no: "plusse", en: "to add up", pret: "plusset" },
    { no: "runde", en: "to round (a number)", pret: "rundet" },
    { no: "anta", en: "to assume", pret: "antok" },
    { no: "regne med", en: "to expect / count on", pret: "regnet med" },
    { no: "stole på", en: "to rely on / trust", pret: "stolte på" },
    { no: "basere", en: "to base (on)", pret: "baserte" },
    { no: "bygge på", en: "to build on / be based on", pret: "bygde på" },
    { no: "konkludere", en: "to conclude", pret: "konkluderte" },
    { no: "oppsummere", en: "to summarize", pret: "oppsummerte" },
    { no: "innlede", en: "to introduce / begin", pret: "innledet" },
    { no: "avrunde", en: "to round off", pret: "avrundet" },
    { no: "fastslå", en: "to establish / state", pret: "fastslo" },
    { no: "understreke", en: "to underline / emphasize", pret: "understreket" },
    { no: "poengtere", en: "to point out / emphasize", pret: "poengterte" },
    { no: "nevne", en: "to mention", pret: "nevnte" },
    { no: "omtale", en: "to mention / discuss", pret: "omtalte" },
    { no: "beskrive", en: "to describe", pret: "beskrev" },
    { no: "skildre", en: "to depict / portray", pret: "skildret" },
    { no: "illustrere", en: "to illustrate", pret: "illustrerte" },
    { no: "tegne", en: "to draw", pret: "tegnet" },
    { no: "fotografere", en: "to photograph", pret: "fotograferte" },
    { no: "filme", en: "to film", pret: "filmet" },
    { no: "ta bilde", en: "to take a photo", pret: "tok bilde" },
    { no: "spille inn", en: "to record", pret: "spilte inn" },
    { no: "redigere", en: "to edit", pret: "redigerte" },
    { no: "publisere", en: "to publish", pret: "publiserte" },
    { no: "utgi", en: "to publish / issue", pret: "utga" },
    { no: "trykke opp", en: "to print", pret: "trykket opp" },
    { no: "kopiere", en: "to copy", pret: "kopierte" },
    { no: "skanne", en: "to scan", pret: "skannet" },
    { no: "printe", en: "to print", pret: "printet" },
    { no: "arkivere", en: "to archive / file", pret: "arkiverte" },
    { no: "registrere", en: "to register", pret: "registrerte" },
    { no: "melde", en: "to report / notify", pret: "meldte" },
    { no: "varsle", en: "to notify / warn", pret: "varslet" },
    { no: "advare", en: "to warn", pret: "advarte" },
    { no: "informere", en: "to inform", pret: "informerte" },
    { no: "opplyse", en: "to inform / light up", pret: "opplyste" },
    { no: "orientere", en: "to inform / orient", pret: "orienterte" },
    { no: "konsultere", en: "to consult", pret: "konsulterte" },
    { no: "rådføre", en: "to consult / seek advice", pret: "rådførte" },
    { no: "veilede", en: "to guide / advise", pret: "veiledet" },
    { no: "instruere", en: "to instruct", pret: "instruerte" },
    { no: "trene opp", en: "to train (someone) up", pret: "trente opp" },
    { no: "oppdra", en: "to raise / bring up", pret: "oppdro" },
    { no: "passe", en: "to fit / to look after", pret: "passet" },
    { no: "stelle", en: "to tend / care for", pret: "stelte" },
    { no: "pleie", en: "to nurse / care for / used to", pret: "pleide" },
    { no: "behandle", en: "to treat / handle", pret: "behandlet" },
    { no: "helbrede", en: "to heal / cure", pret: "helbredet" },
    { no: "kurere", en: "to cure", pret: "kurerte" },
    { no: "diagnostisere", en: "to diagnose", pret: "diagnostiserte" },
    { no: "operere", en: "to operate", pret: "opererte" },
    { no: "skjære opp", en: "to cut up", pret: "skar opp" },
    { no: "bløte", en: "to soak", pret: "bløtte" },
    { no: "desinfisere", en: "to disinfect", pret: "desinfiserte" },
    { no: "vaksinere", en: "to vaccinate", pret: "vaksinerte" },
    { no: "smitte", en: "to infect", pret: "smittet" },
  ],
};const SAMPLE_TESTS = [
  {
    id: "a1a2", pair: "A1–A2", lower: "A1", upper: "A2", color: "#7FA0BE", maxPlays: 2,
    reading: [
      { passage: "Anna bor i Oslo. Hun jobber på et sykehus. Om morgenen drikker hun kaffe og leser avisen. Hun liker jobben sin, men hun er ofte trøtt om kvelden.",
        questions: [
          { q: "Hvor bor Anna?", options: ["Bergen", "Oslo", "Trondheim", "Stavanger"], answer: 1 },
          { q: "Hva drikker Anna om morgenen?", options: ["Te", "Juice", "Kaffe", "Melk"], answer: 2 },
        ] },
      { passage: "Familien skal på ferie til Spania i juli. De skal fly fra Gardermoen klokken ni om morgenen. Barna gleder seg mye, for de skal bade i havet hver dag.",
        questions: [
          { q: "Hvor skal familien reise?", options: ["Frankrike", "Italia", "Spania", "Portugal"], answer: 2 },
          { q: "Når flyr de?", options: ["Klokken sju", "Klokken ni", "Klokken tolv", "Klokken fem"], answer: 1 },
        ] },
    ],
    listening: {
      dialogue: "A: Hei! Skal du på jobb i dag?\nB: Nei, jeg har fri i dag. Jeg skal handle mat og lage middag.\nA: Så hyggelig. Hva skal du lage?\nB: Jeg tenker å lage fiskesuppe. Vil du bli med og spise?\nA: Ja, gjerne! Når passer det?\nB: Klokken seks er fint.",
      questions: [
        { q: "Hva skal B gjøre i dag?", options: ["Jobbe", "Handle mat og lage middag", "Reise", "Sove"], answer: 1 },
        { q: "Hva skal B lage til middag?", options: ["Pizza", "Fiskesuppe", "Taco", "Kyllingsuppe"], answer: 1 },
        { q: "Når skal de spise?", options: ["Klokken fire", "Klokken fem", "Klokken seks", "Klokken sju"], answer: 2 },
      ],
    },
    writing: { tasks: [
      { prompt: "Skriv en kort tekst (30–50 ord) der du presenterer deg selv: navn, hvor du bor, hva du jobber med, og en ting du liker å gjøre på fritiden.", minWords: 30 },
    ] },
  },
  {
    id: "a2b1", pair: "A2–B1", lower: "A2", upper: "B1", color: "#4F7FA8", maxPlays: 2,
    reading: [
      { passage: "Det siste året har flere norske byer innført bysykler som alle kan leie. Ordningen er populær blant unge som pendler til jobb eller skole. Noen mener likevel at det er for få sykler tilgjengelig i rushtiden.",
        questions: [
          { q: "Hva handler teksten om?", options: ["Bybusser", "Bysykler", "Togforbindelser", "Parkeringsplasser"], answer: 1 },
          { q: "Hva er kritikken mot ordningen?", options: ["For dyrt", "For få sykler i rushtiden", "Dårlig kvalitet", "Farlig å sykle"], answer: 1 },
        ] },
      { passage: "Mange arbeidsgivere tilbyr nå hjemmekontor to eller tre dager i uken. Undersøkelser viser at ansatte som får velge selv, ofte er mer fornøyde med jobben. Samtidig savner noen det sosiale fellesskapet på kontoret.",
        questions: [
          { q: "Hva tilbyr mange arbeidsgivere nå?", options: ["Kortere arbeidsuke", "Hjemmekontor noen dager i uken", "Høyere lønn", "Gratis lunsj"], answer: 1 },
          { q: "Hva savner noen ansatte?", options: ["Fri hver fredag", "Det sosiale fellesskapet", "Mer lønn", "Egen kontorplass"], answer: 1 },
        ] },
    ],
    listening: {
      dialogue: "A: Kan du fortelle litt om hvorfor du flyttet til Norge?\nB: Ja, jeg flyttet hit for tre år siden på grunn av jobb. Jeg jobber som ingeniør, og firmaet jeg jobber for har kontor både i hjemlandet mitt og her.\nA: Hvordan har det vært å lære norsk?\nB: Det har vært utfordrende, men jeg synes det går bedre nå. Jeg tar kurs to ganger i uken, og jeg prøver å snakke norsk med kollegene mine så mye som mulig.\nA: Har du noen tips til andre som lærer norsk?\nB: Jeg vil si at det viktigste er å ikke være redd for å gjøre feil. Man lærer mye av å bare snakke, selv om man ikke er perfekt.",
      questions: [
        { q: "Hvorfor flyttet B til Norge?", options: ["Studier", "Jobb", "Familie", "Klima"], answer: 1 },
        { q: "Hvor ofte tar B norskkurs?", options: ["Én gang i uken", "To ganger i uken", "Hver dag", "Én gang i måneden"], answer: 1 },
        { q: "Hva er B sitt tips?", options: ["Lese mye", "Ikke være redd for å gjøre feil", "Bo med nordmenn", "Se mye TV"], answer: 1 },
      ],
    },
    writing: { tasks: [
      { prompt: "Skriv en e-post til en venn der du forteller om en reise du har vært på. Beskriv hvor du dro, hva du gjorde, og hvordan turen var.", minWords: 60 },
      { prompt: "Skriv en kort tekst der du gir din mening om følgende påstand: 'Alle bør trene minst tre ganger i uken.' Bruk egne argumenter.", minWords: 60 },
    ] },
  },
  {
    id: "b1b2", pair: "B1–B2", lower: "B1", upper: "B2", color: "#16324A", maxPlays: 1,
    reading: [
      { passage: "Debatten om kunstig intelligens i arbeidslivet har blitt stadig mer intens. Mens noen frykter at automatisering vil føre til færre arbeidsplasser, hevder andre at teknologien vil skape nye typer yrker vi ennå ikke kan forestille oss. Det som er sikkert, er at arbeidstakere i økende grad må omstille seg gjennom hele karrieren.",
        questions: [
          { q: "Hva er hovedtemaet i teksten?", options: ["Klimaendringer", "Kunstig intelligens og arbeidslivet", "Norsk skolepolitikk", "Boligmarkedet"], answer: 1 },
          { q: "Hva mener noen vil skje med automatisering?", options: ["Flere arbeidsplasser umiddelbart", "Færre arbeidsplasser", "Ingen endring", "Bare positive effekter"], answer: 1 },
        ] },
      { passage: "Til tross for strenge klimamål har norske utslipp av klimagasser gått ned saktere enn forventet de siste årene. Regjeringen peker på at overgangen til fornybar energi krever store investeringer og tid, mens miljøorganisasjoner mener tempoet ikke er godt nok til å nå togradersmålet.",
        questions: [
          { q: "Hva sier teksten om norske klimautslipp?", options: ["De har økt kraftig", "De har gått ned saktere enn forventet", "De har blitt halvert", "De er uendret"], answer: 1 },
          { q: "Hva mener miljøorganisasjoner?", options: ["At tempoet er for lavt", "At målene er unødvendige", "At Norge gjør nok", "At olje er løsningen"], answer: 0 },
        ] },
    ],
    listening: {
      dialogue: "A: I dag skal vi diskutere firedagers arbeidsuke. Hva tenker du om det?\nB: Jeg er positiv. Flere studier viser at produktiviteten ikke nødvendigvis går ned, og ansatte rapporterer om bedre balanse mellom jobb og fritid.\nA: Men er ikke dette vanskelig for bransjer med mye kundekontakt, som butikker og helsevesen?\nB: Jo, det er en utfordring. Der må man kanskje tenke annerledes, for eksempel med skiftordninger, i stedet for å innføre det likt overalt.\nA: Så du mener løsningen må tilpasses bransjen?\nB: Nettopp. Det finnes ingen løsning som passer alle, men jeg tror vi kommer til å se mer eksperimentering fremover.",
      questions: [
        { q: "Hva er B sin holdning til firedagers arbeidsuke?", options: ["Negativ", "Positiv", "Likegyldig", "Usikker"], answer: 1 },
        { q: "Hvilken utfordring nevner B?", options: ["Lavere lønn", "Bransjer med mye kundekontakt", "Mer stress", "Dårligere kvalitet"], answer: 1 },
        { q: "Hva foreslår B for slike bransjer?", options: ["Å avskaffe ordningen helt", "Skiftordninger", "Kortere lunsjpause", "Ingenting"], answer: 1 },
      ],
    },
    writing: { tasks: [
      { prompt: "Skriv en argumenterende tekst (150–200 ord) om følgende påstand: 'Det bør innføres en firedagers arbeidsuke i Norge.' Presenter din mening og støtt den med minst to argumenter. Bruk gjerne uttrykk som 'på den ene siden', 'til tross for' eller 'derfor'.", minWords: 150 },
    ] },
  },
  {
    id: "a1a2-vaer", pair: "A1–A2", lower: "A1", upper: "A2", color: "#7FA0BE", maxPlays: 2,
    reading: [
      { passage: "I dag er det kaldt i Norge. Det snør, og temperaturen er minus fem grader. Barna gleder seg til å leke i snøen etter skolen.",
        questions: [
          { q: "Hvordan er været i dag?", options: ["Varmt", "Kaldt", "Regnfullt", "Vindfullt"], answer: 1 },
          { q: "Hva gjør barna etter skolen?", options: ["Sover", "Leser", "Leker i snøen", "Spiser"], answer: 2 },
        ] },
      { passage: "Per skal gå tur i fjellet i vinter. Han tar på seg varm jakke, lue og votter. Skoene hans er tykke og varme. Han vil ikke fryse.",
        questions: [
          { q: "Hva skal Per gjøre?", options: ["Sove", "Gå tur i fjellet", "Jobbe", "Lage mat"], answer: 1 },
          { q: "Hva tar Per på seg?", options: ["Bare jakke", "Varm jakke, lue og votter", "Shorts og t-skjorte", "Badedrakt"], answer: 1 },
        ] },
    ],
    listening: {
      dialogue: "A: Hei! Har du sett hvordan været er ute?\nB: Ja, det er veldig kaldt i dag. Det snør mye.\nA: Skal vi gå tur likevel?\nB: Ja, men vi må kle oss varmt. Ta på deg lue og votter.\nA: God idé. Jeg tar med skjerf også.\nB: Fint. Da møtes vi klokken ti utenfor.",
      questions: [
        { q: "Hvordan er været ute?", options: ["Varmt", "Kaldt og snø", "Regn", "Sol"], answer: 1 },
        { q: "Hva må de gjøre før turen?", options: ["Spise frokost", "Kle seg varmt", "Ringe en venn", "Vaske huset"], answer: 1 },
        { q: "Når møtes de?", options: ["Klokken åtte", "Klokken ni", "Klokken ti", "Klokken elleve"], answer: 2 },
      ],
    },
    writing: { tasks: [
      { prompt: "Skriv en kort tekst (30–50 ord) om hvordan været er der du bor om vinteren, og hva du pleier å ha på deg når det er kaldt ute.", minWords: 30 },
    ] },
  },
  {
    id: "a1a2-handle", pair: "A1–A2", lower: "A1", upper: "A2", color: "#7FA0BE", maxPlays: 2,
    reading: [
      { passage: "Marit handler mat hver lørdag. Hun går til butikken like ved huset sitt. Hun kjøper alltid brød, melk og frukt. Noen ganger kjøper hun også fisk til middag.",
        questions: [
          { q: "Når handler Marit mat?", options: ["Hver mandag", "Hver lørdag", "Hver søndag", "Hver dag"], answer: 1 },
          { q: "Hva kjøper hun alltid?", options: ["Kjøtt og ris", "Brød, melk og frukt", "Kaker", "Klær"], answer: 1 },
        ] },
      { passage: "I dag har butikken tilbud på grønnsaker. Tomater og agurker er billige. Lars kjøper mye grønnsaker fordi han skal lage salat til middag i kveld.",
        questions: [
          { q: "Hva har tilbud i butikken?", options: ["Frukt", "Grønnsaker", "Kjøtt", "Brød"], answer: 1 },
          { q: "Hvorfor kjøper Lars mye grønnsaker?", options: ["Han skal lage suppe", "Han skal lage salat", "Han skal reise", "Han skal sove"], answer: 1 },
        ] },
    ],
    listening: {
      dialogue: "A: Skal du til butikken i dag?\nB: Ja, jeg må handle mat til hele uken.\nA: Kan du kjøpe litt melk til meg også?\nB: Ja, det går fint. Trenger du noe mer?\nA: Kanskje litt brød og ost.\nB: Greit, jeg skriver det på handlelisten.\nA: Tusen takk! Jeg gir deg penger senere.",
      questions: [
        { q: "Hvorfor skal B til butikken?", options: ["For å møte en venn", "For å handle mat til uken", "For å jobbe", "For å hente en pakke"], answer: 1 },
        { q: "Hva vil A ha?", options: ["Bare melk", "Melk, brød og ost", "Frukt og fisk", "Kake"], answer: 1 },
        { q: "Hva gjør B med det A ber om?", options: ["Glemmer det", "Skriver det på handlelisten", "Sier nei", "Ringer butikken"], answer: 1 },
      ],
    },
    writing: { tasks: [
      { prompt: "Skriv en kort tekst (30–50 ord) om hvordan du handler mat: hvor du handler, hvor ofte, og hva du liker å kjøpe.", minWords: 30 },
    ] },
  },
  {
    id: "a1a2-lege", pair: "A1–A2", lower: "A1", upper: "A2", color: "#7FA0BE", maxPlays: 2,
    reading: [
      { passage: "Ola er syk. Han har vondt i halsen og feber. I dag skal han til legen klokken to. Han håper legen kan gi ham medisin.",
        questions: [
          { q: "Hva feiler Ola?", options: ["Vondt i magen", "Vondt i halsen og feber", "Vondt i beinet", "Han er bare trøtt"], answer: 1 },
          { q: "Når skal han til legen?", options: ["Klokken ett", "Klokken to", "Klokken tre", "Klokken fire"], answer: 1 },
        ] },
      { passage: "Legesenteret ligger midt i byen. Det er åpent fra åtte til fire på hverdager. Man må ringe og bestille time før man kommer.",
        questions: [
          { q: "Når er legesenteret åpent?", options: ["Fra åtte til fire på hverdager", "Hele døgnet", "Bare i helgen", "Fra ni til fem"], answer: 0 },
          { q: "Hva må man gjøre før man kommer?", options: ["Betale først", "Bestille time", "Skrive brev", "Vente utenfor"], answer: 1 },
        ] },
    ],
    listening: {
      dialogue: "A: God dag. Jeg har time klokken to hos legen.\nB: Hva heter du?\nA: Jeg heter Kari Hansen.\nB: Ja, jeg ser deg her. Vent litt, legen kommer snart.\nA: Takk. Vet du hvor lenge jeg må vente?\nB: Bare noen minutter. Sett deg der borte.\nA: Greit, tusen takk.",
      questions: [
        { q: "Når har Kari time?", options: ["Klokken ett", "Klokken to", "Klokken tre", "Klokken fire"], answer: 1 },
        { q: "Hva heter pasienten?", options: ["Anna Hansen", "Kari Hansen", "Kari Olsen", "Marit Hansen"], answer: 1 },
        { q: "Hvor lenge må Kari vente?", options: ["En time", "Noen minutter", "Hele dagen", "Ingen tid"], answer: 1 },
      ],
    },
    writing: { tasks: [
      { prompt: "Skriv en kort tekst (30–50 ord) om sist gang du var syk eller hos legen. Hva feilte det deg, og hva gjorde du?", minWords: 30 },
    ] },
  },
  {
    id: "a1a2-buss", pair: "A1–A2", lower: "A1", upper: "A2", color: "#7FA0BE", maxPlays: 2,
    reading: [
      { passage: "Ingrid tar bussen til jobb hver dag. Bussen går klokken sju om morgenen fra holdeplassen nær huset hennes. Turen tar tjue minutter.",
        questions: [
          { q: "Hvordan reiser Ingrid til jobb?", options: ["Med bil", "Med bussen", "Med tog", "Til fots"], answer: 1 },
          { q: "Hvor lang tid tar turen?", options: ["Ti minutter", "Tjue minutter", "Tretti minutter", "En time"], answer: 1 },
        ] },
      { passage: "En turist spør en mann om veien til togstasjonen. Mannen sier at hun må gå rett fram og så ta til venstre ved kirken. Stasjonen ligger like ved.",
        questions: [
          { q: "Hva spør turisten om?", options: ["Veien til butikken", "Veien til togstasjonen", "Klokken", "Været"], answer: 1 },
          { q: "Hvor skal turisten ta til venstre?", options: ["Ved skolen", "Ved kirken", "Ved broen", "Ved parken"], answer: 1 },
        ] },
    ],
    listening: {
      dialogue: "A: Unnskyld, vet du hvor bussen til sentrum går fra?\nB: Ja, holdeplassen er rett rundt hjørnet.\nA: Tusen takk. Vet du når neste buss går?\nB: Jeg tror den går om ti minutter.\nA: Flott. Koster billetten mye?\nB: Nei, den koster bare tretti kroner.\nA: Da tar jeg bussen. Ha en fin dag!",
      questions: [
        { q: "Hva leter A etter?", options: ["Toget", "Bussen til sentrum", "Butikken", "Skolen"], answer: 1 },
        { q: "Når går neste buss?", options: ["Om fem minutter", "Om ti minutter", "Om tjue minutter", "Nå med en gang"], answer: 1 },
        { q: "Hva koster billetten?", options: ["Tjue kroner", "Tretti kroner", "Femti kroner", "Hundre kroner"], answer: 1 },
      ],
    },
    writing: { tasks: [
      { prompt: "Skriv en kort tekst (30–50 ord) om hvordan du reiser til jobb eller skole. Bruker du buss, tog, bil eller sykkel?", minWords: 30 },
    ] },
  },
  {
    id: "a1a2-hobby", pair: "A1–A2", lower: "A1", upper: "A2", color: "#7FA0BE", maxPlays: 2,
    reading: [
      { passage: "Erik liker å gå på ski om vinteren. Hver helg drar han til fjellet med familien. De går på ski hele dagen og drikker varm kakao etterpå.",
        questions: [
          { q: "Hva liker Erik å gjøre om vinteren?", options: ["Svømme", "Gå på ski", "Sykle", "Fiske"], answer: 1 },
          { q: "Hva drikker de etterpå?", options: ["Kaffe", "Varm kakao", "Juice", "Vann"], answer: 1 },
        ] },
      { passage: "Kari og faren hennes drar ofte og fisker i sjøen om sommeren. De sitter stille i båten og venter. I går fikk de tre fisker til middag.",
        questions: [
          { q: "Hvor fisker Kari og faren?", options: ["I elven", "I sjøen", "I et basseng", "I en dam"], answer: 1 },
          { q: "Hvor mange fisker fikk de i går?", options: ["To", "Tre", "Fire", "Fem"], answer: 1 },
        ] },
    ],
    listening: {
      dialogue: "A: Hva skal du gjøre i helgen?\nB: Jeg skal gå på ski i fjellet med noen venner.\nA: Så gøy! Har du gått på ski før?\nB: Ja, jeg har gått på ski siden jeg var liten.\nA: Er det kaldt der oppe?\nB: Ja, det er kaldt, så vi må kle oss godt.\nA: Lykke til, håper dere har det fint!",
      questions: [
        { q: "Hva skal B gjøre i helgen?", options: ["Fiske", "Gå på ski", "Svømme", "Lese"], answer: 1 },
        { q: "Hvem skal B være med?", options: ["Familien", "Noen venner", "Alene", "Kollegaer"], answer: 1 },
        { q: "Hvorfor må de kle seg godt?", options: ["Det regner", "Det er kaldt", "Det er sent", "Det er langt"], answer: 1 },
      ],
    },
    writing: { tasks: [
      { prompt: "Skriv en kort tekst (30–50 ord) om en hobby du liker. Hva gjør du, hvor ofte, og hvorfor liker du det?", minWords: 30 },
    ] },
  },
  {
    id: "a1a2-nabo", pair: "A1–A2", lower: "A1", upper: "A2", color: "#7FA0BE", maxPlays: 2,
    reading: [
      { passage: "Kristin flyttet inn i leiligheten i forrige uke. I dag møter hun naboen sin i trappen. De prater litt om været og om huset.",
        questions: [
          { q: "Når flyttet Kristin inn?", options: ["I går", "I forrige uke", "I fjor", "I morgen"], answer: 1 },
          { q: "Hvor møter hun naboen?", options: ["I hagen", "I trappen", "På jobb", "På butikken"], answer: 1 },
        ] },
      { passage: "Naboen heter Bjørn. Han er pensjonist og har bodd i huset i tjue år. Han har en hund som heter Rex. Rex liker å hilse på alle som går forbi.",
        questions: [
          { q: "Hvor lenge har Bjørn bodd der?", options: ["Ti år", "Tjue år", "Tretti år", "Fem år"], answer: 1 },
          { q: "Hva heter hunden til Bjørn?", options: ["Fido", "Rex", "Bella", "Max"], answer: 1 },
        ] },
    ],
    listening: {
      dialogue: "A: Hei! Er du den nye naboen?\nB: Ja, jeg heter Sara. Jeg flyttet inn i forrige uke.\nA: Velkommen! Jeg heter Tom, jeg bor i andre etasje.\nB: Hyggelig å møte deg, Tom. Det er fint her.\nA: Ja, det er et rolig nabolag. Trenger du hjelp med noe?\nB: Kanskje senere. Nå må jeg pakke ut esker.\nA: Bare si ifra hvis du trenger noe!",
      questions: [
        { q: "Hva heter den nye naboen?", options: ["Tom", "Sara", "Kristin", "Bjørn"], answer: 1 },
        { q: "Hvor bor Tom?", options: ["Første etasje", "Andre etasje", "Tredje etasje", "Fjerde etasje"], answer: 1 },
        { q: "Hva skal Sara gjøre nå?", options: ["Lage middag", "Pakke ut esker", "Gå tur", "Sove"], answer: 1 },
      ],
    },
    writing: { tasks: [
      { prompt: "Skriv en kort tekst (30–50 ord) om naboene dine. Kjenner du dem godt? Hva pleier dere å snakke om?", minWords: 30 },
    ] },
  },
  {
    id: "a1a2-skole", pair: "A1–A2", lower: "A1", upper: "A2", color: "#7FA0BE", maxPlays: 2,
    reading: [
      { passage: "Emma er sju år og går på skolen hver dag. Hun står opp klokken sju og spiser frokost med familien. Skolen begynner klokken åtte og slutter klokken to.",
        questions: [
          { q: "Hvor gammel er Emma?", options: ["Seks år", "Sju år", "Åtte år", "Ni år"], answer: 1 },
          { q: "Når begynner skolen?", options: ["Klokken sju", "Klokken åtte", "Klokken ni", "Klokken ti"], answer: 1 },
        ] },
      { passage: "I friminuttet leker barna ute i skolegården. Emma liker best å hoppe tau med venninnene sine. Etter skolen går hun hjem og gjør lekser.",
        questions: [
          { q: "Hva liker Emma å gjøre i friminuttet?", options: ["Lese bøker", "Hoppe tau", "Tegne", "Synge"], answer: 1 },
          { q: "Hva gjør Emma etter skolen?", options: ["Sover", "Gjør lekser", "Ser på TV", "Leker ute"], answer: 1 },
        ] },
    ],
    listening: {
      dialogue: "A: Hei Emma, hvordan var det på skolen i dag?\nB: Det var gøy! Vi lærte om dyr i naturfag.\nA: Så spennende. Hva skal du gjøre nå?\nB: Jeg må gjøre lekser først, så kan jeg leke.\nA: Trenger du hjelp med leksene?\nB: Ja, jeg forstår ikke matteoppgavene.\nA: Kom, så hjelper jeg deg etter middag.",
      questions: [
        { q: "Hva lærte Emma om i naturfag?", options: ["Planter", "Dyr", "Vær", "Tall"], answer: 1 },
        { q: "Hva må Emma gjøre først?", options: ["Leke", "Lekser", "Sove", "Spise"], answer: 1 },
        { q: "Hvilket fag trenger hun hjelp med?", options: ["Norsk", "Matte", "Engelsk", "Naturfag"], answer: 1 },
      ],
    },
    writing: { tasks: [
      { prompt: "Skriv en kort tekst (30–50 ord) om en vanlig skoledag eller arbeidsdag. Når begynner den, og hva gjør du?", minWords: 30 },
    ] },
  },
  {
    id: "a1a2-bursdag", pair: "A1–A2", lower: "A1", upper: "A2", color: "#7FA0BE", maxPlays: 2,
    reading: [
      { passage: "Sondre skal fylle ti år i neste uke. Mamma og pappa planlegger en fest for ham. De skal invitere ti venner og kjøpe en stor kake.",
        questions: [
          { q: "Hvor gammel blir Sondre?", options: ["Ni år", "Ti år", "Elleve år", "Tolv år"], answer: 1 },
          { q: "Hvor mange venner skal de invitere?", options: ["Fem", "Ti", "Femten", "Tjue"], answer: 1 },
        ] },
      { passage: "Festen skal være hjemme hos Sondre på lørdag klokken tolv. Alle gjestene skal ha med gave. Etter kaken skal barna spille spill i hagen.",
        questions: [
          { q: "Når skal festen være?", options: ["Fredag", "Lørdag", "Søndag", "Mandag"], answer: 1 },
          { q: "Hva skal barna gjøre etter kaken?", options: ["Se film", "Spille spill i hagen", "Sove", "Synge"], answer: 1 },
        ] },
    ],
    listening: {
      dialogue: "A: Har du bestemt hva du vil gjøre på bursdagen din?\nB: Ja, jeg vil ha fest med vennene mine.\nA: Så gøy! Hvor mange skal du invitere?\nB: Kanskje ti venner. Vi skal spille spill og spise kake.\nA: Skal dere være ute eller inne?\nB: Ute, hvis været er fint. Ellers inne.\nA: Jeg gleder meg til å komme!",
      questions: [
        { q: "Hva vil B gjøre på bursdagen?", options: ["Reise bort", "Ha fest med venner", "Jobbe", "Sove hele dagen"], answer: 1 },
        { q: "Hvor mange venner skal inviteres?", options: ["Fem", "Ti", "Femten", "Tjue"], answer: 1 },
        { q: "Hvor skal festen være hvis været er fint?", options: ["Inne", "Ute", "På skolen", "På jobb"], answer: 1 },
      ],
    },
    writing: { tasks: [
      { prompt: "Skriv en kort tekst (30–50 ord) om hvordan du pleier å feire bursdagen din. Hvem inviterer du, og hva gjør dere?", minWords: 30 },
    ] },
  },
  {
    id: "a1a2-bibliotek", pair: "A1–A2", lower: "A1", upper: "A2", color: "#7FA0BE", maxPlays: 2,
    reading: [
      { passage: "Thomas går til biblioteket hver onsdag. Han låner alltid to eller tre bøker. Denne uken vil han låne en bok om dyr.",
        questions: [
          { q: "Når går Thomas til biblioteket?", options: ["Hver mandag", "Hver onsdag", "Hver fredag", "Hver søndag"], answer: 1 },
          { q: "Hva slags bok vil han låne denne uken?", options: ["Om mat", "Om dyr", "Om sport", "Om biler"], answer: 1 },
        ] },
      { passage: "Biblioteket er stort og har mange bøker for barn og voksne. Man kan låne bøker gratis i fire uker. Hvis man kommer for sent, må man betale litt.",
        questions: [
          { q: "Hvor lenge kan man låne bøker?", options: ["To uker", "Fire uker", "Seks uker", "Åtte uker"], answer: 1 },
          { q: "Hva skjer hvis man kommer for sent?", options: ["Man mister kortet", "Man må betale litt", "Ingenting skjer", "Man får en ny bok gratis"], answer: 1 },
        ] },
    ],
    listening: {
      dialogue: "A: Hei, jeg vil gjerne låne noen bøker.\nB: Har du lånekort fra før?\nA: Nei, dette er første gang jeg er her.\nB: Da må du fylle ut et skjema. Har du med legitimasjon?\nA: Ja, her er passet mitt.\nB: Perfekt. Nå kan du låne opptil fem bøker.\nA: Tusen takk for hjelpen!",
      questions: [
        { q: "Har personen lånekort fra før?", options: ["Ja", "Nei", "Vet ikke", "Kanskje"], answer: 1 },
        { q: "Hva må personen fylle ut?", options: ["En bok", "Et skjema", "En avis", "Et brev"], answer: 1 },
        { q: "Hvor mange bøker kan man låne?", options: ["Tre", "Fem", "Sju", "Ti"], answer: 1 },
      ],
    },
    writing: { tasks: [
      { prompt: "Skriv en kort tekst (30–50 ord) om et bibliotek du kjenner til, eller om bøker du liker å lese.", minWords: 30 },
    ] },
  },
  {
    id: "a2b1-voksenopplaring", pair: "A2–B1", lower: "A2", upper: "B1", color: "#4F7FA8", maxPlays: 2,
    reading: [
      { passage: "Amina går på voksenopplæring tre dager i uken. Hun lærer norsk sammen med tjue andre voksne fra ulike land. Læreren sier at det er lurt å snakke norsk også utenfor klasserommet, for eksempel med naboer og kollegaer. Amina prøver å øve hver dag, selv om det noen ganger er vanskelig å finne tid ved siden av jobb og familie.",
        questions: [
          { q: "Hvor mange dager i uken går Amina på voksenopplæring?", options: ["To", "Tre", "Fire", "Fem"], answer: 1 },
          { q: "Hva sier læreren er lurt å gjøre?", options: ["Bare lese bøker", "Snakke norsk utenfor klasserommet", "Se på TV hele dagen", "Slutte å jobbe"], answer: 1 },
        ] },
      { passage: "Mange voksenopplæringssentre tilbyr kurs på ulike nivåer, fra nybegynner til viderekommen. Deltakerne kan ofte velge mellom dag- og kveldskurs, slik at det passer med jobb. Etter hvert nivå tar man en prøve for å se om man er klar for neste trinn.",
        questions: [
          { q: "Hva kan deltakerne velge mellom?", options: ["Bare kveldskurs", "Dag- og kveldskurs", "Bare helgekurs", "Ingen kurs"], answer: 1 },
          { q: "Hva skjer etter hvert nivå?", options: ["Man slutter automatisk", "Man tar en prøve", "Man bytter skole", "Ingenting"], answer: 1 },
        ] },
    ],
    listening: {
      dialogue: "A: Hvordan går det med norskkurset ditt?\nB: Det går bra, men det er ganske krevende. Vi har mye å lese.\nA: Hvilket nivå er du på nå?\nB: Jeg er på A2, men jeg håper å komme til B1 til våren.\nA: Hva synes du er vanskeligst?\nB: Grammatikken, spesielt preposisjonene. De følger ikke alltid en logisk regel.\nA: Ja, jeg husker det var vanskelig for meg også. Det blir bedre med øvelse.\nB: Det håper jeg virkelig!",
      questions: [
        { q: "Hvilket nivå er B på nå?", options: ["A1", "A2", "B1", "B2"], answer: 1 },
        { q: "Hva synes B er vanskeligst?", options: ["Uttale", "Grammatikken, spesielt preposisjoner", "Lytting", "Skriving"], answer: 1 },
        { q: "Hva tror A vil hjelpe?", options: ["Å slutte", "Øvelse over tid", "Å bytte kurs", "Å lese mindre"], answer: 1 },
      ],
    },
    writing: { tasks: [
      { prompt: "Skriv en tekst (60–80 ord) om dine egne erfaringer med å lære norsk, eller et annet språk. Hva har vært lettest, og hva har vært vanskeligst?", minWords: 60 },
    ] },
  },
  {
    id: "a2b1-leiebolig", pair: "A2–B1", lower: "A2", upper: "B1", color: "#4F7FA8", maxPlays: 2,
    reading: [
      { passage: "Det kan være vanskelig å finne leiebolig i store norske byer, spesielt i Oslo og Bergen. Mange leiligheter blir leid ut samme dag som de blir annonsert, og utleiere kan motta flere titalls henvendelser på kort tid. Det lønner seg derfor å ha alle nødvendige papirer klare før man begynner å se på visninger.",
        questions: [
          { q: "Hvor kan det være spesielt vanskelig å finne bolig?", options: ["Små bygder", "Oslo og Bergen", "Utlandet", "På landet"], answer: 1 },
          { q: "Hva lønner det seg å gjøre på forhånd?", options: ["Ha papirene klare", "Vente lenge", "Ringe utleier hver dag", "Ikke gjøre noe"], answer: 0 },
        ] },
      { passage: "En leiekontrakt bør alltid være skriftlig og inneholde informasjon om husleie, depositum, oppsigelsestid og hvem som er ansvarlig for vedlikehold. Depositumet settes vanligvis på en egen sperret bankkonto, slik at pengene er beskyttet for begge parter dersom det oppstår en uenighet.",
        questions: [
          { q: "Hva bør en leiekontrakt alltid være?", options: ["Muntlig", "Skriftlig", "Uformell", "Hemmelig"], answer: 1 },
          { q: "Hvor settes depositumet vanligvis?", options: ["Kontant hos utleier", "En sperret bankkonto", "I en konvolutt", "Det trengs ikke"], answer: 1 },
        ] },
    ],
    listening: {
      dialogue: "A: Har du funnet en leilighet ennå?\nB: Nei, det er så vanskelig! Jeg har vært på fem visninger allerede.\nA: Hva ser du etter?\nB: Noe sentralt, gjerne to rom, og under tolv tusen i måneden.\nA: Det høres ikke lett ut i denne byen. Har du sjekket depositumsordningen de tilbyr?\nB: Ja, det virker greit hos de fleste. Problemet er bare konkurransen.\nA: Lykke til! Si ifra hvis du trenger hjelp med kontrakten.\nB: Takk, det setter jeg pris på.",
      questions: [
        { q: "Hvor mange visninger har B vært på?", options: ["To", "Tre", "Fem", "Ti"], answer: 2 },
        { q: "Hva ser B etter?", options: ["Ett rom, billig", "To rom, sentralt, under tolv tusen", "Hus på landet", "Delt leilighet"], answer: 1 },
        { q: "Hva tilbyr A hjelp med?", options: ["Flyttingen", "Kontrakten", "Møblene", "Nøklene"], answer: 1 },
      ],
    },
    writing: { tasks: [
      { prompt: "Skriv en tekst (60–80 ord) om hvordan det er å lete etter bolig der du bor. Hva er utfordringene, og hva ville gjort det enklere?", minWords: 60 },
      { prompt: "Skriv en kort e-post (minst 40 ord) til en utleier der du spør om en leilighet fortsatt er ledig, og foreslår en tid for visning.", minWords: 40 },
    ] },
  },
  {
    id: "a2b1-frivillig-arbeid", pair: "A2–B1", lower: "A2", upper: "B1", color: "#4F7FA8", maxPlays: 2,
    reading: [
      { passage: "Frivillig arbeid er svært vanlig i Norge. Mange organisasjoner, som Røde Kors og ulike idrettslag, er avhengige av frivillige for å kunne drive aktivitetene sine. Å delta som frivillig kan også være en fin måte å bli kjent med nye mennesker og lære mer om norsk kultur og samfunnsliv.",
        questions: [
          { q: "Hvem er avhengige av frivillige?", options: ["Bare staten", "Organisasjoner som Røde Kors og idrettslag", "Ingen", "Bare private bedrifter"], answer: 1 },
          { q: "Hva kan frivillig arbeid være en fin måte å gjøre?", options: ["Tjene mye penger", "Bli kjent med nye mennesker", "Unngå andre mennesker", "Slappe helt av"], answer: 1 },
        ] },
      { passage: "Noen frivillige oppgaver krever spesiell opplæring, for eksempel førstehjelp eller arbeid med barn og unge. Da må man ofte gjennomføre et kurs eller vise politiattest før man kan begynne. De fleste organisasjoner setter stor pris på nye frivillige og hjelper gjerne til med å finne en oppgave som passer.",
        questions: [
          { q: "Hva kan enkelte frivillige oppgaver kreve?", options: ["Ingenting spesielt", "Spesiell opplæring", "Høy lønn", "Universitetsutdanning"], answer: 1 },
          { q: "Hva må man noen ganger vise før man begynner?", options: ["Førerkort", "Politiattest", "Pass", "Vitnemål"], answer: 1 },
        ] },
    ],
    listening: {
      dialogue: "A: Jeg vurderer å bli frivillig et sted. Har du noen tips?\nB: Ja, jeg har vært frivillig i fotballklubben i to år. Det er veldig givende.\nA: Hva gjør du der?\nB: Jeg hjelper til med barnetreninger på lørdager, og noen ganger på kamper.\nA: Måtte du ta noe kurs først?\nB: Ja, et kort kurs om trygghet rundt barn. Det tok bare noen timer.\nA: Det høres overkommelig ut. Tror du de trenger flere frivillige?\nB: Definitivt, de er alltid glade for nye folk!",
      questions: [
        { q: "Hvor har B vært frivillig?", options: ["Et sykehus", "En fotballklubb", "Et bibliotek", "En skole"], answer: 1 },
        { q: "Hva måtte B gjøre før hun begynte?", options: ["Ingenting", "Ta et kort kurs", "Betale et gebyr", "Vente et år"], answer: 1 },
        { q: "Hvordan beskriver B erfaringen?", options: ["Kjedelig", "Givende", "Vanskelig", "Skummel"], answer: 1 },
      ],
    },
    writing: { tasks: [
      { prompt: "Skriv en tekst (60–80 ord) om frivillig arbeid du har gjort, eller kunne tenke deg å gjøre. Hvorfor er dette viktig for deg?", minWords: 60 },
    ] },
  },
  {
    id: "a2b1-17-mai", pair: "A2–B1", lower: "A2", upper: "B1", color: "#4F7FA8", maxPlays: 2,
    reading: [
      { passage: "17. mai er Norges nasjonaldag og feires over hele landet med barnetog, folketog og mye russefeiring. Folk kler seg ofte i bunad eller pent tøy, og mange byer arrangerer store folketog der ulike organisasjoner og skoler deltar. Dagen markerer grunnloven som ble signert i 1814.",
        questions: [
          { q: "Hva markerer 17. mai?", options: ["En kongelig fødselsdag", "Grunnloven fra 1814", "En religiøs høytid", "Sommerens begynnelse"], answer: 1 },
          { q: "Hva kler folk seg ofte i?", options: ["Arbeidsklær", "Bunad eller pent tøy", "Badetøy", "Skiklær"], answer: 1 },
        ] },
      { passage: "Om morgenen 17. mai er det vanlig at familier spiser en god frokost sammen før de går ut for å se på toget. Barn får ofte is og pølser i løpet av dagen, og mange steder er det leker og aktiviteter arrangert spesielt for de yngste.",
        questions: [
          { q: "Hva gjør mange familier om morgenen?", options: ["Sover lenge", "Spiser en god frokost sammen", "Reiser bort", "Jobber som vanlig"], answer: 1 },
          { q: "Hva får barn ofte i løpet av dagen?", options: ["Bare vann", "Is og pølser", "Kaffe", "Ingenting spesielt"], answer: 1 },
        ] },
    ],
    listening: {
      dialogue: "A: Skal du gjøre noe spesielt på 17. mai i år?\nB: Ja, jeg skal se barnetoget med familien, som vanlig.\nA: Har dere noen tradisjoner?\nB: Vi spiser alltid frokost med champagne og jordbær før vi går ut.\nA: Det høres koselig ut! Har du bunad?\nB: Nei, jeg har ikke det ennå, men jeg pleier å kle meg pent.\nA: Jeg gleder meg uansett, det er en av mine favorittdager.\nB: Enig, stemningen er alltid helt spesiell.",
      questions: [
        { q: "Hva skal B gjøre på 17. mai?", options: ["Jobbe", "Se barnetoget med familien", "Reise til utlandet", "Sove hele dagen"], answer: 1 },
        { q: "Hva spiser familien til frokost?", options: ["Bare brød", "Champagne og jordbær", "Fisk", "Ingenting"], answer: 1 },
        { q: "Har B bunad?", options: ["Ja", "Nei", "Vet ikke", "Skal kjøpe i år"], answer: 1 },
      ],
    },
    writing: { tasks: [
      { prompt: "Skriv en tekst (60–80 ord) om en nasjonaldag eller høytid som er viktig der du kommer fra. Hvordan feires den?", minWords: 60 },
    ] },
  },
  {
    id: "a2b1-jobbintervju", pair: "A2–B1", lower: "A2", upper: "B1", color: "#4F7FA8", maxPlays: 2,
    reading: [
      { passage: "Å forberede seg godt til et jobbintervju kan øke sjansene for å få jobben betydelig. Det lønner seg å lese om bedriften på forhånd, tenke gjennom egne styrker og svakheter, og forberede eksempler fra tidligere erfaring som viser relevante ferdigheter.",
        questions: [
          { q: "Hva kan øke sjansene for å få jobben?", options: ["Å komme uforberedt", "God forberedelse", "Å komme for sent", "Å ikke stille spørsmål"], answer: 1 },
          { q: "Hva lønner det seg å gjøre på forhånd?", options: ["Ignorere bedriften", "Lese om bedriften", "Glemme CV-en", "Unngå å tenke på svakheter"], answer: 1 },
        ] },
      { passage: "Mange arbeidsgivere setter pris på kandidater som stiller egne spørsmål mot slutten av intervjuet. Det viser interesse og engasjement. Det er også lurt å sende en kort takk-e-post etter intervjuet, der man takker for muligheten og gjentar interessen for stillingen.",
        questions: [
          { q: "Hva setter mange arbeidsgivere pris på?", options: ["Kandidater som ikke sier noe", "Kandidater som stiller egne spørsmål", "Kandidater som kommer sent", "Kandidater som avbryter"], answer: 1 },
          { q: "Hva er lurt å gjøre etter intervjuet?", options: ["Glemme det helt", "Sende en takk-e-post", "Ringe hver dag", "Ingenting"], answer: 1 },
        ] },
    ],
    listening: {
      dialogue: "A: Hvordan gikk jobbintervjuet ditt i går?\nB: Jeg tror det gikk ganske bra, faktisk. Jeg var nervøs i starten.\nA: Hva spurte de om?\nB: Mest om tidligere erfaring, og hvorfor jeg ville jobbe akkurat der.\nA: Stilte du noen spørsmål selv?\nB: Ja, jeg spurte om opplæringen de tilbyr nye ansatte.\nA: Bra tenkt! Når får du svar?\nB: De sa de ville gi beskjed innen en uke.",
      questions: [
        { q: "Hvordan følte B seg i starten?", options: ["Rolig", "Nervøs", "Sint", "Kjedet"], answer: 1 },
        { q: "Hva spurte B om selv?", options: ["Lønnen", "Opplæringen for nye ansatte", "Ferien", "Ingenting"], answer: 1 },
        { q: "Når får B svar?", options: ["Samme dag", "Innen en uke", "Om en måned", "Aldri"], answer: 1 },
      ],
    },
    writing: { tasks: [
      { prompt: "Skriv en tekst (60–80 ord) om hvordan du forbereder deg til et jobbintervju, eller om en erfaring du har hatt med intervjuer.", minWords: 60 },
      { prompt: "Skriv en kort takk-e-post (minst 40 ord) til en arbeidsgiver etter et jobbintervju.", minWords: 40 },
    ] },
  },
  {
    id: "a2b1-fastlege", pair: "A2–B1", lower: "A2", upper: "B1", color: "#4F7FA8", maxPlays: 2,
    reading: [
      { passage: "Alle som bor i Norge har rett til å ha en fastlege. Fastlegen er ofte det første stedet man henvender seg når man er syk eller trenger medisinsk hjelp. Man kan bytte fastlege opptil to ganger i året hvis man ikke er fornøyd, eller hvis man flytter til et nytt sted.",
        questions: [
          { q: "Hvem har rett til å ha en fastlege?", options: ["Bare norske statsborgere", "Alle som bor i Norge", "Bare barn", "Ingen"], answer: 1 },
          { q: "Hvor mange ganger i året kan man bytte fastlege?", options: ["Én gang", "To ganger", "Fire ganger", "Aldri"], answer: 1 },
        ] },
      { passage: "For å bestille time hos fastlegen kan man ofte bruke en app eller nettside, i tillegg til å ringe legekontoret. Ved akutte tilstander bør man kontakte legevakten i stedet, siden fastlegen ikke alltid er tilgjengelig samme dag.",
        questions: [
          { q: "Hvordan kan man ofte bestille time?", options: ["Bare ved å møte opp", "Via app eller nettside", "Bare med brev", "Det går ikke"], answer: 1 },
          { q: "Hvem bør man kontakte ved akutte tilstander?", options: ["Fastlegen alltid", "Legevakten", "En nabo", "Ingen"], answer: 1 },
        ] },
    ],
    listening: {
      dialogue: "A: Jeg må bestille time hos fastlegen min. Vet du hvordan jeg gjør det?\nB: Ja, du kan bruke helsenorge.no, det er enklest.\nA: Å, jeg visste ikke det. Går det raskt å få time?\nB: Det kommer an på hvor travelt det er, men ofte innen noen dager.\nA: Hva hvis det haster mer?\nB: Da bør du ringe legevakten i stedet for å vente på fastlegen.\nA: Greit, takk for tipset!\nB: Bare hyggelig, håper du blir bedre snart.",
      questions: [
        { q: "Hvor kan man bestille time ifølge B?", options: ["Bare telefon", "helsenorge.no", "SMS", "E-post"], answer: 1 },
        { q: "Hva bør man gjøre hvis det haster?", options: ["Vente på fastlegen", "Ringe legevakten", "Ikke gjøre noe", "Dra til apoteket"], answer: 1 },
        { q: "Hvor lang tid tar det ofte å få time?", options: ["Samme time", "Innen noen dager", "En måned", "Et år"], answer: 1 },
      ],
    },
    writing: { tasks: [
      { prompt: "Skriv en tekst (60–80 ord) om helsevesenet der du bor, eller om en erfaring du har hatt med lege eller sykehus.", minWords: 60 },
    ] },
  },
  {
    id: "a2b1-kildesortering", pair: "A2–B1", lower: "A2", upper: "B1", color: "#4F7FA8", maxPlays: 2,
    reading: [
      { passage: "Kildesortering er en viktig del av hverdagen for de fleste husholdninger i Norge. Vanligvis sorterer man avfall i kategorier som matavfall, papir, plast og restavfall. Ulike kommuner kan ha litt forskjellige regler, så det er lurt å sjekke informasjon fra sin egen kommune.",
        questions: [
          { q: "Hva er kildesortering en viktig del av?", options: ["Ferien", "Hverdagen for husholdninger", "Skolen", "Jobben"], answer: 1 },
          { q: "Hva bør man sjekke siden reglene kan variere?", options: ["Ingenting", "Informasjon fra egen kommune", "Naboens meninger", "Avisen"], answer: 1 },
        ] },
      { passage: "Matavfall kastes ofte i grønne poser som senere blir til biogass og biogjødsel. Plastemballasje samles i egne poser for gjenvinning, mens glass og metall leveres til returpunkter. God kildesortering bidrar til mindre forurensning og bedre utnyttelse av ressurser.",
        questions: [
          { q: "Hva blir matavfall ofte til?", options: ["Ny mat", "Biogass og biogjødsel", "Bensin", "Ingenting"], answer: 1 },
          { q: "Hvor leveres glass og metall?", options: ["Restavfall", "Returpunkter", "Papirbeholder", "Komposten"], answer: 1 },
        ] },
    ],
    listening: {
      dialogue: "A: Jeg er litt forvirret over kildesorteringen her. Kan du hjelpe meg?\nB: Klart det! Matavfall skal i den grønne posen, plast i den blå.\nA: Og papir?\nB: Papir og papp kaster du i papirbeholderen ute i gården.\nA: Hva med glass og metall?\nB: Det må du ta med til en returpunkt-container, det hentes ikke hjemmefra.\nA: Ok, det er mer å huske på enn jeg trodde!\nB: Ja, men det blir en vane etter hvert.",
      questions: [
        { q: "Hvilken farge er posen for matavfall?", options: ["Blå", "Grønn", "Rød", "Gul"], answer: 1 },
        { q: "Hvor kastes glass og metall?", options: ["Hjemme i en pose", "En returpunkt-container", "Restavfallet", "Papirbeholderen"], answer: 1 },
        { q: "Hva tror B blir kildesortering etter hvert?", options: ["Umulig", "En vane", "Unødvendig", "Forbudt"], answer: 1 },
      ],
    },
    writing: { tasks: [
      { prompt: "Skriv en tekst (60–80 ord) om hvordan kildesortering eller resirkulering fungerer der du bor, og hva du synes om det.", minWords: 60 },
    ] },
  },
  {
    id: "a2b1-tur-i-naturen", pair: "A2–B1", lower: "A2", upper: "B1", color: "#4F7FA8", maxPlays: 2,
    reading: [
      { passage: "Nordmenn er kjent for sin glede av friluftsliv, og allemannsretten gir alle rett til å ferdes fritt i naturen, uansett hvem som eier grunnen. Man kan gå tur, plukke bær og sette opp telt for én natt, så lenge man viser hensyn til dyr, natur og grunneiere.",
        questions: [
          { q: "Hva gir allemannsretten alle rett til?", options: ["Å eie skog", "Å ferdes fritt i naturen", "Å jakte fritt", "Å bygge hus overalt"], answer: 1 },
          { q: "Hva må man vise hensyn til?", options: ["Ingenting", "Dyr, natur og grunneiere", "Bare seg selv", "Bare andre turgåere"], answer: 1 },
        ] },
      { passage: "Før man drar på en lengre tur i fjellet, er det viktig å sjekke værmeldingen og fortelle noen hvor man skal. Godt fottøy, ekstra klær og nok mat og drikke er også avgjørende for en trygg og god opplevelse.",
        questions: [
          { q: "Hva bør man sjekke før en lengre fjelltur?", options: ["Aksjekursen", "Værmeldingen", "TV-programmet", "Bussruten"], answer: 1 },
          { q: "Hva er avgjørende for en trygg tur?", options: ["Dyre klær", "Godt fottøy og nok mat og drikke", "En bil", "Ingenting spesielt"], answer: 1 },
        ] },
    ],
    listening: {
      dialogue: "A: Har du planer for helgen?\nB: Ja, jeg skal på en lengre fjelltur med noen venner.\nA: Så fint! Har dere sjekket værmeldingen?\nB: Ja, det ser stabilt ut, heldigvis. Vi har pakket ekstra klær uansett.\nA: Lurt. Hvor lenge skal dere være ute?\nB: Vi planlegger å overnatte i telt én natt.\nA: Husk å fortelle noen hvor dere skal, i tilfelle noe skjer.\nB: God idé, det skal jeg gjøre før vi drar.",
      questions: [
        { q: "Hva skal B gjøre i helgen?", options: ["Jobbe", "En lengre fjelltur", "Reise til utlandet", "Sitte hjemme"], answer: 1 },
        { q: "Hvordan ser værmeldingen ut?", options: ["Dårlig", "Stabil", "Ukjent", "Veldig kald"], answer: 1 },
        { q: "Hva minner A dem på å gjøre?", options: ["Ta med paraply", "Fortelle noen hvor de skal", "Avlyse turen", "Ringe legen"], answer: 1 },
      ],
    },
    writing: { tasks: [
      { prompt: "Skriv en tekst (60–80 ord) om en tur du har vært på i naturen, eller om hvorfor friluftsliv er viktig for deg.", minWords: 60 },
    ] },
  },
  {
    id: "a2b1-jobb-og-familie", pair: "A2–B1", lower: "A2", upper: "B1", color: "#4F7FA8", maxPlays: 2,
    reading: [
      { passage: "Mange foreldre i Norge opplever at det kan være krevende å kombinere full jobb med å ha små barn. Barnehage og skolefritidsordning gjør det lettere, men lange arbeidsdager og henting og bringing kan likevel gjøre hverdagen travel og hektisk.",
        questions: [
          { q: "Hva kan være krevende for mange foreldre?", options: ["Å ha ferie", "Å kombinere jobb og små barn", "Å lære engelsk", "Å reise"], answer: 1 },
          { q: "Hva gjør hverdagen lettere ifølge teksten?", options: ["Ingenting", "Barnehage og skolefritidsordning", "Mer jobb", "Færre venner"], answer: 1 },
        ] },
      { passage: "I Norge har både mor og far rett til foreldrepermisjon etter at et barn er født, og mange par velger å dele permisjonstiden mellom seg. Dette gir begge foreldrene mulighet til å tilbringe tid med barnet i den første tiden.",
        questions: [
          { q: "Hvem har rett til foreldrepermisjon?", options: ["Bare mor", "Både mor og far", "Bare far", "Ingen"], answer: 1 },
          { q: "Hva velger mange par å gjøre med permisjonen?", options: ["Ikke ta den", "Dele den mellom seg", "Gi den bort", "Ta den samtidig alltid"], answer: 1 },
        ] },
    ],
    listening: {
      dialogue: "A: Hvordan går det med å kombinere jobb og familieliv?\nB: Det er travelt, men vi har funnet en rytme som fungerer.\nA: Hvem henter barna i barnehagen?\nB: Vi bytter på, avhengig av hvem som slutter tidligst den dagen.\nA: Det høres organisert ut. Fikk dere delt foreldrepermisjonen?\nB: Ja, vi delte den nesten likt mellom oss.\nA: Det er fint at dere begge fikk tid med babyen.\nB: Absolutt, det var viktig for oss begge.",
      questions: [
        { q: "Hvordan beskriver B hverdagen?", options: ["Rolig", "Travel, men fungerer", "Kjedelig", "Umulig"], answer: 1 },
        { q: "Hvem henter barna i barnehagen?", options: ["Bare mor", "De bytter på", "Bare far", "En barnevakt"], answer: 1 },
        { q: "Hvordan delte de foreldrepermisjonen?", options: ["Ikke i det hele tatt", "Nesten likt", "Bare mor tok alt", "Bare far tok alt"], answer: 1 },
      ],
    },
    writing: { tasks: [
      { prompt: "Skriv en tekst (60–80 ord) om hvordan man kan balansere jobb og familieliv, basert på egne erfaringer eller meninger.", minWords: 60 },
    ] },
  },
  {
    id: "b1b2-integrering", pair: "B1–B2", lower: "B1", upper: "B2", color: "#16324A", maxPlays: 1,
    reading: [
      { level: "B1", passage: "Integrering av innvandrere er et tema som ofte diskuteres i norsk politikk. Noen mener at kommunene bør få mer ressurser til språkopplæring og introduksjonsprogram, mens andre peker på at ansvar også må ligge hos den enkelte for å lære seg språket og delta i samfunnet.",
        questions: [
          { q: "Hva mener noen kommunene bør få mer av?", options: ["Skatter", "Ressurser til språkopplæring", "Politibetjenter", "Turister"], answer: 1 },
          { q: "Hva peker andre på?", options: ["At staten skal gjøre alt", "At ansvar også ligger hos den enkelte", "At integrering er unødvendig", "At det ikke koster noe"], answer: 1 },
        ] },
      { level: "B2", passage: "Til tross for at introduksjonsprogrammet har eksistert i over to tiår, er resultatene fortsatt ujevnt fordelt mellom kommunene. Enkelte forskere peker på at arbeidsrettet opplæring, kombinert med tett oppfølging, gir bedre resultater enn ren klasseromsundervisning alene. Samtidig som debatten fortsetter, er det bred enighet om at rask overgang til arbeidslivet er en nøkkelfaktor for vellykket integrering.",
        questions: [
          { q: "Hva sier teksten om resultatene av introduksjonsprogrammet?", options: ["De er identiske overalt", "De er ujevnt fordelt mellom kommunene", "De er alltid dårlige", "De er ikke målt"], answer: 1 },
          { q: "Hva peker enkelte forskere på som mer effektivt?", options: ["Bare klasseromsundervisning", "Arbeidsrettet opplæring med tett oppfølging", "Ingen opplæring", "Lengre ferier"], answer: 1 },
        ] },
      { level: "B2", passage: "Debatten om integrering handler også om hvordan man måler suksess. Er det tilstrekkelig at innvandrere kommer i jobb, eller bør man også vurdere sosial deltakelse og trivsel? Kritikere av dagens system mener at et for snevert fokus på sysselsetting overser viktige sider ved integrering, som følelsen av tilhørighet.",
        questions: [
          { q: "Hva handler debatten også om?", options: ["Hvordan man måler suksess", "Hvilken musikk som er best", "Hvor mange biler folk eier", "Hvilken by som er finest"], answer: 0 },
          { q: "Hva mener kritikerne overses?", options: ["Sysselsetting", "Følelsen av tilhørighet", "Skatteinntekter", "Boligpriser"], answer: 1 },
        ] },
    ],
    listening: {
      dialogue: "A: I dag skal vi diskutere integreringspolitikk. Hva tenker du om dagens system?\nB: Jeg tenker det er et godt utgangspunkt, men det er rom for forbedring, spesielt i overgangen til arbeidslivet.\nA: Hva mener du konkret?\nB: Jeg mener at flere burde kombinere språkopplæring med praksis i en bedrift fra starten av.\nA: Men er ikke ren språkopplæring nødvendig først?\nB: Jo, til en viss grad, men erfaring viser at man lærer raskere når man bruker språket i en reell arbeidssituasjon.\nA: Det er et interessant poeng. Hva med de som ikke finner praksisplass?\nB: Da bør kommunen ha et sikkerhetsnett, slik at ingen faller utenfor.",
      questions: [
        { q: "Hva mener B bør kombineres fra starten?", options: ["Ferie og arbeid", "Språkopplæring og praksis", "Sport og musikk", "Ingenting"], answer: 1 },
        { q: "Hvorfor mener B at praksis hjelper?", options: ["Det er gratis", "Man lærer raskere ved reell bruk av språket", "Det er kortere", "Det krever ingen innsats"], answer: 1 },
        { q: "Hva bør kommunen ha ifølge B?", options: ["Strengere regler", "Et sikkerhetsnett for de uten praksisplass", "Færre kurs", "Høyere avgifter"], answer: 1 },
      ],
    },
    writing: { tasks: [
      { prompt: "Skriv en argumenterende tekst (150–200 ord) om følgende påstand: 'Kommunene bør få mer ressurser til introduksjonsprogrammet for innvandrere.' Presenter din mening og støtt den med minst to argumenter. Du kan bruke ord som til tross for, følgelig, samtidig som og derimot.", minWords: 150 },
    ] },
  },
  {
    id: "b1b2-boligmarked", pair: "B1–B2", lower: "B1", upper: "B2", color: "#16324A", maxPlays: 1,
    reading: [
      { level: "B1", passage: "Boligprisene i norske storbyer har steget kraftig de siste tiårene. For mange unge er det derfor vanskelig å komme seg inn på boligmarkedet uten hjelp fra familien. Noen mener at myndighetene bør bygge flere rimelige boliger, mens andre mener markedet bør styre seg selv.",
        questions: [
          { q: "Hva har skjedd med boligprisene?", options: ["De har sunket", "De har steget kraftig", "De har vært stabile", "De er forbudt"], answer: 1 },
          { q: "Hva mener noen myndighetene bør gjøre?", options: ["Bygge flere rimelige boliger", "Slutte å bygge", "Heve prisene", "Ingenting"], answer: 0 },
        ] },
      { level: "B2", passage: "Følgelig av den vedvarende prisveksten har debatten om boligpolitikk blitt stadig mer polarisert. Enkelte økonomer argumenterer for at strengere utlånsregler har gjort det vanskeligere for førstegangskjøpere, samtidig som andre hevder at reglene er nødvendige for å forhindre en finansiell boble. Uansett standpunkt er det bred enighet om at boligmangelen i storbyene må adresseres på lang sikt.",
        questions: [
          { q: "Hva mener enkelte økonomer om utlånsreglene?", options: ["De hjelper førstegangskjøpere", "De har gjort det vanskeligere for førstegangskjøpere", "De er irrelevante", "De senker prisene"], answer: 1 },
          { q: "Hva er det bred enighet om?", options: ["At boligmangelen må adresseres på lang sikt", "At prisene bør stige mer", "At ingen bør eie bolig", "At markedet er perfekt"], answer: 0 },
        ] },
      { level: "B2", passage: "Et annet moment i debatten er hvordan boligpolitikken påvirker sosial ulikhet. Kritikere hevder at dagens system favoriserer dem som allerede har kapital, mens forsvarere av markedsstyring mener at statlig inngripen ofte fører til ineffektiv ressursbruk og lengre ventelister for boliger som faktisk bygges.",
        questions: [
          { q: "Hva hevder kritikere om dagens system?", options: ["At det er helt rettferdig", "At det favoriserer dem med kapital", "At det ikke påvirker noen", "At det er billig for alle"], answer: 1 },
          { q: "Hva mener forsvarere av markedsstyring?", options: ["At staten alltid bør gripe inn", "At statlig inngripen ofte fører til ineffektivitet", "At boliger bør være gratis", "At markedet ikke fungerer"], answer: 1 },
        ] },
    ],
    listening: {
      dialogue: "A: Boligprisene fortsetter å stige. Hva tror du er løsningen?\nB: Jeg tror vi trenger mer bygging, spesielt av rimelige boliger for førstegangskjøpere.\nA: Men noen sier at problemet egentlig er utlånsreglene, ikke mangel på boliger.\nB: Det kan stemme delvis, men selv med enklere lån hjelper det lite hvis det ikke finnes nok boliger.\nA: Så du mener bygging er viktigere enn å endre reglene?\nB: Jeg mener begge deler må skje samtidig for å faktisk løse problemet.\nA: Det er et balansert syn. Tror du politikerne er enige i det?\nB: Dessverre er det for mye uenighet til at noe skjer raskt.",
      questions: [
        { q: "Hva tror B er en del av løsningen?", options: ["Mindre bygging", "Mer bygging av rimelige boliger", "Høyere skatter", "Ingen endring"], answer: 1 },
        { q: "Hva mener B om utlånsreglene alene?", options: ["De løser alt", "De hjelper lite uten nok boliger", "De er irrelevante", "De bør fjernes helt"], answer: 1 },
        { q: "Hvorfor tror B at lite skjer raskt?", options: ["For mye enighet", "For mye uenighet blant politikere", "Mangel på penger", "Det haster ikke"], answer: 1 },
      ],
    },
    writing: { tasks: [
      { prompt: "Skriv en argumenterende tekst (150–200 ord) om følgende påstand: 'Staten bør bygge flere rimelige boliger for å løse boligkrisen.' Presenter din mening og støtt den med minst to argumenter. Du kan bruke ord som til tross for, følgelig, samtidig som og derimot.", minWords: 150 },
    ] },
  },
  {
    id: "b1b2-sosiale-medier", pair: "B1–B2", lower: "B1", upper: "B2", color: "#16324A", maxPlays: 1,
    reading: [
      { level: "B1", passage: "Sosiale medier har blitt en stor del av hverdagen til mange unge mennesker. Foreldre og forskere er ofte uenige om hvor stor innvirkning dette har på ungdommers mentale helse. Noen mener sosiale medier fører til mer stress og sammenligning, mens andre peker på fordelene ved sosial kontakt og informasjonsdeling.",
        questions: [
          { q: "Hva er foreldre og forskere ofte uenige om?", options: ["Hvilken app som er best", "Innvirkningen på ungdommers mentale helse", "Prisen på mobiltelefoner", "Skolefag"], answer: 1 },
          { q: "Hva peker noen på som en fordel?", options: ["Mer stress", "Sosial kontakt og informasjonsdeling", "Dårligere karakterer", "Mindre søvn"], answer: 1 },
        ] },
      { level: "B2", passage: "Til tross for økende bekymring blant foreldre, viser flere studier at sammenhengen mellom skjermbruk og psykisk helse er mer kompleks enn tidligere antatt. Følgelig argumenterer enkelte forskere for at innholdet man konsumerer, og ikke tidsbruken alene, er den avgjørende faktoren. Samtidig som denne debatten pågår, innfører flere skoler forbud mot mobiltelefoner i undervisningstiden.",
        questions: [
          { q: "Hva viser flere studier ifølge teksten?", options: ["At sammenhengen er enkel", "At sammenhengen er mer kompleks enn antatt", "At det ikke finnes noen sammenheng", "At skjermbruk er helt ufarlig"], answer: 1 },
          { q: "Hva argumenterer enkelte forskere for er avgjørende?", options: ["Bare tidsbruken", "Innholdet man konsumerer", "Merket på telefonen", "Skjermstørrelsen"], answer: 1 },
        ] },
      { level: "B2", passage: "Et sentralt spørsmål er hvem som bør ha ansvaret for å regulere ungdommers bruk av sosiale medier: foreldrene, skolen, eller plattformene selv gjennom strengere aldersgrenser og algoritmer. Kritikere av dagens regulering mener at teknologiselskapene har for lite insentiv til å prioritere brukernes velvære over engasjement og annonseinntekter.",
        questions: [
          { q: "Hva er et sentralt spørsmål ifølge teksten?", options: ["Hvem som skal betale for internett", "Hvem som bør regulere ungdommers bruk", "Hvilken skole som er best", "Hvor mye telefoner koster"], answer: 1 },
          { q: "Hva mener kritikere om teknologiselskapene?", options: ["De prioriterer velvære over profitt", "De har for lite insentiv til å prioritere velvære", "De gjør en perfekt jobb", "De bryr seg ikke om annonser"], answer: 1 },
        ] },
    ],
    listening: {
      dialogue: "A: I dag skal vi diskutere sosiale medier og ungdom. Hva tenker du om det?\nB: Jeg tenker at det er positivt i mange sammenhenger, men det er også en klar risiko for overforbruk.\nA: Hvilken utfordring nevner du?\nB: Sammenligning med andres liv kan gi lavere selvfølelse hos mange unge.\nA: Hva foreslår du for slike bransjer, altså plattformene?\nB: Jeg mener strengere aldersgrenser og mer åpenhet om algoritmene ville hjulpet.\nA: Men er ikke foreldrenes ansvar viktigere enn reguleringer?\nB: Begge deler er viktig, men foreldre kan ikke overvåke alt alene lenger.\nA: Det er et godt poeng, teknologien utvikler seg raskere enn reglene.",
      questions: [
        { q: "Hva er B sin holdning til sosiale medier og ungdom?", options: ["Helt negativ", "Positiv med klar risiko for overforbruk", "Likegyldig", "Usikker"], answer: 1 },
        { q: "Hvilken utfordring nevner B?", options: ["Lavere lønn", "Sammenligning som gir lavere selvfølelse", "Mer stress på jobb", "Dårligere kvalitet"], answer: 1 },
        { q: "Hva foreslår B for plattformene?", options: ["Å avskaffe ordningen helt", "Strengere aldersgrenser og mer åpenhet", "Kortere lunsjpause", "Ingenting"], answer: 1 },
      ],
    },
    writing: { tasks: [
      { prompt: "Skriv en argumenterende tekst (150–200 ord) om følgende påstand: 'Sosiale medier gjør mer skade enn nytte for ungdom.' Presenter din mening og støtt den med minst to argumenter. Du kan bruke ord som til tross for, følgelig, samtidig som og derimot.", minWords: 150 },
    ] },
  },
  {
    id: "b1b2-oljeokonomi", pair: "B1–B2", lower: "B1", upper: "B2", color: "#16324A", maxPlays: 1,
    reading: [
      { level: "B1", passage: "Norge har i mange tiår bygget velstand på olje- og gassvirksomhet. Samtidig ønsker mange at landet skal satse mer på fornybar energi og redusere avhengigheten av fossile brensler. Det er en pågående debatt om hvor raskt denne overgangen bør skje.",
        questions: [
          { q: "Hva har Norge bygget velstand på i mange tiår?", options: ["Fiskeri alene", "Olje- og gassvirksomhet", "Turisme", "Skogbruk"], answer: 1 },
          { q: "Hva ønsker mange at Norge skal satse mer på?", options: ["Kull", "Fornybar energi", "Mer oljeboring", "Ingenting nytt"], answer: 1 },
        ] },
      { level: "B2", passage: "Til tross for strenge klimamål har norske utslipp av klimagasser gått ned saktere enn forventet de siste årene. Regjeringen peker på at overgangen til fornybar energi krever store investeringer og tid, samtidig som miljøorganisasjoner mener tempoet er altfor lavt gitt alvoret i klimakrisen.",
        questions: [
          { q: "Hva sier teksten om norske klimautslipp?", options: ["De har økt kraftig", "De har gått ned saktere enn forventet", "De har blitt halvert", "De er uendret"], answer: 1 },
          { q: "Hva mener miljøorganisasjoner?", options: ["At tempoet er for lavt", "At målene er unødvendige", "At Norge gjør nok", "At olje er løsningen"], answer: 0 },
        ] },
      { level: "B2", passage: "Debatten kompliseres av at oljeindustrien fortsatt sysselsetter mange tusen mennesker og bidrar betydelig til statens inntekter gjennom Oljefondet. Følgelig argumenterer noen politikere for en gradvis omstilling, mens andre mener en brå stans i ny oljeleting er nødvendig for at Norge skal ta sitt klimaansvar på alvor.",
        questions: [
          { q: "Hva bidrar oljeindustrien betydelig til?", options: ["Statens inntekter gjennom Oljefondet", "Turistnæringen", "Skoledrift", "Ingenting"], answer: 0 },
          { q: "Hva mener noen politikere er nødvendig?", options: ["Mer oljeleting", "En brå stans i ny oljeleting", "Ingen endring", "Lavere skatter"], answer: 1 },
        ] },
    ],
    listening: {
      dialogue: "A: I dag skal vi diskutere Norges oljeavhengighet. Hva tenker du om det?\nB: Jeg er positiv til en gradvis omstilling, men en brå stans tror jeg vil skade økonomien for mye.\nA: Hvilken utfordring nevner du?\nB: Mange arbeidsplasser er direkte knyttet til oljesektoren i dag.\nA: Hva foreslår du i stedet?\nB: Jeg foreslår sterkere investeringer i fornybar energi parallelt med dagens virksomhet.\nA: Men er ikke det for sakte gitt klimakrisen?\nB: Kanskje, men en for rask omstilling kan skape sosial uro og arbeidsledighet.\nA: Det er absolutt en vanskelig balansegang mellom klima og økonomi.",
      questions: [
        { q: "Hva er B sin holdning til firedagers arbeidsuke?", options: ["Negativ", "Positiv", "Likegyldig", "Usikker"], answer: 1 },
        { q: "Hvilken utfordring nevner B?", options: ["Lavere lønn", "Bransjer med mye kundekontakt", "Mer stress", "Dårligere kvalitet"], answer: 1 },
        { q: "Hva foreslår B for slike bransjer?", options: ["Å avskaffe ordningen helt", "Skiftordninger", "Kortere lunsjpause", "Ingenting"], answer: 1 },
      ],
    },
    writing: { tasks: [
      { prompt: "Skriv en argumenterende tekst (150–200 ord) om følgende påstand: 'Norge bør stanse all ny oljeleting umiddelbart.' Presenter din mening og støtt den med minst to argumenter. Du kan bruke ord som til tross for, følgelig, samtidig som og derimot.", minWords: 150 },
    ] },
  },
  {
    id: "b1b2-hjemmekontor", pair: "B1–B2", lower: "B1", upper: "B2", color: "#16324A", maxPlays: 1,
    reading: [
      { level: "B1", passage: "Etter pandemien har mange norske arbeidsplasser fortsatt å tilby hjemmekontor som en fast ordning. Noen ansatte foretrekker fleksibiliteten dette gir, mens andre savner det sosiale fellesskapet på kontoret og mener produktiviteten synker uten daglig kontakt med kolleger.",
        questions: [
          { q: "Hva tilbyr mange arbeidsplasser fortsatt?", options: ["Kortere ferier", "Hjemmekontor som fast ordning", "Høyere lønn", "Flere møter"], answer: 1 },
          { q: "Hva savner noen ansatte?", options: ["Lengre reisetid", "Det sosiale fellesskapet på kontoret", "Flere e-poster", "Ingenting"], answer: 1 },
        ] },
      { level: "B2", passage: "Til tross for at studier viser blandede resultater om produktivitet ved hjemmekontor, velger stadig flere bedrifter å innføre hybride løsninger. Følgelig har mange kontorer redusert arealet sitt, samtidig som ledere uttrykker bekymring for hvordan man bygger bedriftskultur og mentorordninger når ansatte sjelden møtes fysisk.",
        questions: [
          { q: "Hva viser studier om produktivitet ved hjemmekontor?", options: ["Entydig positive resultater", "Blandede resultater", "Entydig negative resultater", "Ingen har undersøkt det"], answer: 1 },
          { q: "Hva bekymrer ledere seg for?", options: ["For høye strømregninger", "Hvordan man bygger bedriftskultur uten fysiske møter", "For mange ansatte", "Ingenting spesielt"], answer: 1 },
        ] },
      { level: "B2", passage: "Et annet aspekt ved debatten er hvordan hjemmekontor påvirker likestilling i arbeidslivet. Enkelte forskere hevder at fleksibiliteten har gjort det lettere for foreldre, spesielt mødre, å kombinere karriere og familieliv, mens andre advarer om at usynlighet på kontoret kan gå utover forfremmelser og lønnsutvikling.",
        questions: [
          { q: "Hva hevder enkelte forskere om fleksibiliteten?", options: ["At den skader alle", "At den gjør det lettere å kombinere karriere og familieliv", "At den er irrelevant", "At den bare gjelder menn"], answer: 1 },
          { q: "Hva advarer andre om?", options: ["At usynlighet kan gå utover forfremmelser", "At det ikke finnes noen ulemper", "At hjemmekontor er forbudt", "At det koster for mye"], answer: 0 },
        ] },
    ],
    listening: {
      dialogue: "A: Hva synes du om hjemmekontor sammenlignet med å jobbe på kontoret?\nB: Jeg foretrekker en kombinasjon, ærlig talt. Begge deler har sine fordeler.\nA: Hva liker du best med hjemmekontor?\nB: Fleksibiliteten, og at jeg slipper lang reisetid hver dag.\nA: Men savner du ikke kollegaene dine?\nB: Jo, absolutt, derfor er hybridløsningen best for meg personlig.\nA: Tror du produktiviteten din er høyere hjemme eller på kontoret?\nB: Det varierer med oppgaven, men konsentrasjonsarbeid går bedre hjemme for min del.\nA: Det er interessant, jeg trodde de fleste ville si det motsatte.",
      questions: [
        { q: "Hva foretrekker B?", options: ["Bare hjemmekontor", "En kombinasjon, hybridløsning", "Bare kontor", "Ingen jobb i det hele tatt"], answer: 1 },
        { q: "Hva liker B best med hjemmekontor?", options: ["Ingenting", "Fleksibilitet og mindre reisetid", "Mer støy", "Flere møter"], answer: 1 },
        { q: "Hva sier B om konsentrasjonsarbeid?", options: ["Det går bedre på kontoret", "Det går bedre hjemme for henne", "Det går likt begge steder", "Hun gjør aldri konsentrasjonsarbeid"], answer: 1 },
      ],
    },
    writing: { tasks: [
      { prompt: "Skriv en argumenterende tekst (150–200 ord) om følgende påstand: 'Hjemmekontor bør være en fast rettighet for alle som kan utføre jobben sin digitalt.' Presenter din mening og støtt den med minst to argumenter. Du kan bruke ord som til tross for, følgelig, samtidig som og derimot.", minWords: 150 },
    ] },
  },
  {
    id: "b1b2-basisinntekt", pair: "B1–B2", lower: "B1", upper: "B2", color: "#16324A", maxPlays: 1,
    reading: [
      { level: "B1", passage: "Universell basisinntekt er en idé der alle innbyggere mottar et fast beløp fra staten, uavhengig av inntekt eller arbeidsstatus. Tilhengere mener dette kan redusere fattigdom og gi mer frihet, mens motstandere frykter at det kan svekke motivasjonen til å jobbe.",
        questions: [
          { q: "Hva er universell basisinntekt?", options: ["Et lån fra banken", "Et fast beløp fra staten til alle", "En skatt", "En pensjonsordning kun for eldre"], answer: 1 },
          { q: "Hva frykter motstandere?", options: ["At det blir for dyrt for staten alene", "At det kan svekke motivasjonen til å jobbe", "At det gir for mye frihet", "Ingenting"], answer: 1 },
        ] },
      { level: "B2", passage: "Til tross for at flere pilotprosjekter med basisinntekt har vist positive effekter på deltakernes mentale helse, er de økonomiske konsekvensene ved en fullskala innføring fortsatt omdiskutert. Følgelig argumenterer kritikere for at finansieringen ville kreve betydelige skatteøkninger, samtidig som tilhengere hevder at reduserte kostnader til andre velferdsordninger delvis kan kompensere for dette.",
        questions: [
          { q: "Hva har pilotprosjekter vist positive effekter på?", options: ["Boligpriser", "Deltakernes mentale helse", "Aksjemarkedet", "Trafikken"], answer: 1 },
          { q: "Hva argumenterer kritikere for?", options: ["At finansiering krever betydelige skatteøkninger", "At det ikke koster noe", "At det er enkelt å innføre", "At ingen vil motta pengene"], answer: 0 },
        ] },
      { level: "B2", passage: "Et sentralt spørsmål i debatten er hvorvidt basisinntekt bør erstatte eksisterende velferdsordninger eller komme i tillegg til dem. Enkelte økonomer advarer om at en fullstendig erstatning kan svekke sikkerhetsnettet for de mest sårbare gruppene, mens andre mener et forenklet system vil redusere byråkrati og administrative kostnader betraktelig.",
        questions: [
          { q: "Hva er et sentralt spørsmål i debatten?", options: ["Om basisinntekt bør erstatte eller supplere velferdsordninger", "Hvor mye skatt turister betaler", "Hvilken bank som er best", "Hvor mange biler folk eier"], answer: 0 },
          { q: "Hva advarer enkelte økonomer om?", options: ["At sikkerhetsnettet kan svekkes for sårbare grupper", "At det blir for mye byråkrati", "At ingen vil merke forskjellen", "At det er for billig"], answer: 0 },
        ] },
    ],
    listening: {
      dialogue: "A: I dag skal vi diskutere universell basisinntekt. Hva tenker du om det?\nB: Jeg er skeptisk, men åpen for pilotprosjekter for å se hvordan det faktisk fungerer.\nA: Hva bekymrer deg mest?\nB: Kostnaden, og om det virkelig ville erstatte behovet for andre velferdsordninger.\nA: Men noen studier viser jo positive effekter på mental helse.\nB: Ja, det er interessant, men vi trenger mer data før en fullskala innføring.\nA: Hva ville du foreslått i mellomtiden?\nB: Flere kontrollerte forsøk i ulike kommuner, med grundig evaluering etterpå.\nA: Det høres som en fornuftig og forsiktig tilnærming.",
      questions: [
        { q: "Hva er B sin holdning til basisinntekt?", options: ["Helt positiv", "Skeptisk, men åpen for forsøk", "Helt negativ", "Likegyldig"], answer: 1 },
        { q: "Hva bekymrer B mest?", options: ["Kostnaden og om det erstatter velferdsordninger", "Fargen på pengesedlene", "Antall møter", "Ingenting"], answer: 0 },
        { q: "Hva foreslår B i mellomtiden?", options: ["Å innføre det umiddelbart overalt", "Flere kontrollerte forsøk med evaluering", "Å avskaffe ideen helt", "Ingenting"], answer: 1 },
      ],
    },
    writing: { tasks: [
      { prompt: "Skriv en argumenterende tekst (150–200 ord) om følgende påstand: 'Norge bør innføre universell basisinntekt for alle innbyggere.' Presenter din mening og støtt den med minst to argumenter. Du kan bruke ord som til tross for, følgelig, samtidig som og derimot.", minWords: 150 },
    ] },
  },
  {
    id: "b1b2-likestilling", pair: "B1–B2", lower: "B1", upper: "B2", color: "#16324A", maxPlays: 1,
    reading: [
      { level: "B1", passage: "Norge regnes som et av de mest likestilte landene i verden, men det er fortsatt forskjeller mellom kvinner og menn, blant annet i lønn og i hvem som sitter i lederstillinger. Noen mener kjønnskvotering er nødvendig for å rette opp denne skjevheten raskere.",
        questions: [
          { q: "Hvordan regnes Norge?", options: ["Som lite likestilt", "Som et av de mest likestilte landene", "Som uinteressert i likestilling", "Som et unntak i Europa"], answer: 1 },
          { q: "Hva mener noen er nødvendig?", options: ["Å fjerne alle regler", "Kjønnskvotering", "Å ignorere problemet", "Høyere skatter"], answer: 1 },
        ] },
      { level: "B2", passage: "Til tross for lovfestet likestilling har Norge fortsatt et kjønnsdelt arbeidsmarked, der kvinner er overrepresentert i omsorgsyrker og menn dominerer teknologi- og ingeniørfag. Følgelig argumenterer noen for at holdningsendring må starte allerede i barnehagen, samtidig som andre mener strukturelle tiltak som kvotering gir raskere resultater.",
        questions: [
          { q: "Hva kjennetegner det norske arbeidsmarkedet ifølge teksten?", options: ["Det er helt kjønnsnøytralt", "Det er fortsatt kjønnsdelt", "Kvinner dominerer alle yrker", "Menn jobber ikke i teknologi"], answer: 1 },
          { q: "Hva mener noen bør starte i barnehagen?", options: ["Matteundervisning", "Holdningsendring om kjønn og yrkesvalg", "Sport", "Ingenting"], answer: 1 },
        ] },
      { level: "B2", passage: "Debatten om kjønnskvotering i styrer og lederstillinger illustrerer et dypere spørsmål om hvorvidt like muligheter er tilstrekkelig, eller om like resultater bør være målet. Motstandere av kvotering hevder at det kan undergrave meritokratiske prinsipper, mens tilhengere peker på at strukturelle barrierer gjør at like muligheter i praksis ikke fører til like resultater.",
        questions: [
          { q: "Hva illustrerer debatten om kvotering ifølge teksten?", options: ["Et spørsmål om muligheter versus resultater", "Et spørsmål om skatter", "Et spørsmål om boligpriser", "Et spørsmål om ferie"], answer: 0 },
          { q: "Hva hevder motstandere av kvotering?", options: ["At det styrker meritokratiet", "At det kan undergrave meritokratiske prinsipper", "At det ikke har noen effekt", "At det bør utvides umiddelbart"], answer: 1 },
        ] },
    ],
    listening: {
      dialogue: "A: I dag skal vi diskutere kjønnskvotering i lederstillinger. Hva er ditt syn?\nB: Jeg støtter det som et midlertidig tiltak, men ikke som en permanent løsning.\nA: Hvorfor midlertidig?\nB: Fordi målet bør være at det ikke lenger trengs, når holdningene har endret seg nok.\nA: Men er ikke det urealistisk på kort sikt?\nB: Kanskje, men uten kvotering tror jeg endringen ville tatt mye lengre tid.\nA: Hva med argumentet om at kvotering går utover kompetanse?\nB: Jeg tror det er overdrevet, det finnes mange kvalifiserte kvinner som ikke får sjansen i dag.\nA: Det er et sterkt poeng, statistikken støtter faktisk det synet.",
      questions: [
        { q: "Hva er B sin holdning til kvotering?", options: ["Helt imot", "Støtter det midlertidig", "Vil ha det permanent uansett", "Likegyldig"], answer: 1 },
        { q: "Hvorfor mener B at det bør være midlertidig?", options: ["Fordi det er ulovlig", "Fordi målet er at det ikke lenger trengs", "Fordi det er for dyrt", "Fordi ingen liker det"], answer: 1 },
        { q: "Hva mener B om argumentet om kompetanse?", options: ["At det er helt sant", "At det er overdrevet", "At det er irrelevant tema", "At han ikke har en mening"], answer: 1 },
      ],
    },
    writing: { tasks: [
      { prompt: "Skriv en argumenterende tekst (150–200 ord) om følgende påstand: 'Kjønnskvotering i lederstillinger er et nødvendig virkemiddel for økt likestilling.' Presenter din mening og støtt den med minst to argumenter. Du kan bruke ord som til tross for, følgelig, samtidig som og derimot.", minWords: 150 },
    ] },
  },
  {
    id: "b1b2-skjermtid", pair: "B1–B2", lower: "B1", upper: "B2", color: "#16324A", maxPlays: 1,
    reading: [
      { level: "B1", passage: "Barn og unge tilbringer stadig mer tid foran skjermer, både til skolearbeid og underholdning. Mange foreldre er usikre på hvor mye skjermtid som er sunt, og skoler diskuterer om mobiltelefoner bør forbys i undervisningen.",
        questions: [
          { q: "Hva tilbringer barn og unge stadig mer tid med?", options: ["Bøker", "Skjermer", "Utendørslek alene", "Musikkinstrumenter"], answer: 1 },
          { q: "Hva diskuterer skoler?", options: ["Om mobiltelefoner bør forbys i undervisningen", "Om skolen bør stenges", "Om alle fag bør fjernes", "Ingenting"], answer: 0 },
        ] },
      { level: "B2", passage: "Til tross for at mange land nå innfører strengere regler for skjermbruk i skolen, er den vitenskapelige konsensusen om langtidseffektene fortsatt under utvikling. Følgelig baserer mange beslutningstakere seg på føre-var-prinsippet, samtidig som teknologiselskaper argumenterer for at digitale verktøy også gir viktige pedagogiske fordeler som ikke bør undervurderes.",
        questions: [
          { q: "Hva sier teksten om den vitenskapelige konsensusen?", options: ["Den er fullstendig avklart", "Den er fortsatt under utvikling", "Den finnes ikke", "Den er irrelevant"], answer: 1 },
          { q: "Hva argumenterer teknologiselskaper for?", options: ["At digitale verktøy gir viktige pedagogiske fordeler", "At skjermer bør forbys helt", "At skolen er unødvendig", "At barn ikke bør lære noe"], answer: 0 },
        ] },
      { level: "B2", passage: "Et ytterligere aspekt ved debatten er sosioøkonomiske forskjeller i tilgang til og kontroll over skjermbruk. Familier med færre ressurser har ofte mindre mulighet til å følge opp barnas skjermvaner tett, noe som kan forsterke eksisterende ulikheter dersom ikke skolen tar et aktivt ansvar for veiledning.",
        questions: [
          { q: "Hva kan forsterke eksisterende ulikheter ifølge teksten?", options: ["Like muligheter for alle", "Mindre ressurser til å følge opp skjermvaner", "For mye kontroll fra foreldre", "For lite skjermtid"], answer: 1 },
          { q: "Hva bør skolen ta ansvar for ifølge teksten?", options: ["Å forby alle skjermer", "Aktiv veiledning om skjermbruk", "Å ignorere problemet", "Å øke skjermtiden"], answer: 1 },
        ] },
    ],
    listening: {
      dialogue: "A: I dag skal vi diskutere skjermtid for barn. Hva mener du om strenge regler i skolen?\nB: Jeg støtter et forbud i timene, men ikke et fullstendig forbud på skolen generelt.\nA: Hvorfor det skillet?\nB: Fordi digitale verktøy også kan brukes pedagogisk, i riktig kontekst og med veiledning.\nA: Men er det ikke lettere å bare forby alt?\nB: Kanskje enklere, men jeg tror det ville gå glipp av reelle fordeler ved teknologien.\nA: Hva med barn som har mindre oppfølging hjemme?\nB: Nettopp derfor mener jeg skolen har et ekstra ansvar for å gi god veiledning der.\nA: Det er et viktig poeng, ulikheten kan lett forsterkes ellers.",
      questions: [
        { q: "Hva støtter B?", options: ["Fullstendig forbud på hele skolen", "Forbud kun i timene, ikke generelt", "Ingen regler i det hele tatt", "Mer skjermtid overalt"], answer: 1 },
        { q: "Hvorfor mener B at digitale verktøy kan være bra?", options: ["De er gratis", "De kan brukes pedagogisk med veiledning", "De er raskere enn bøker alltid", "De krever ingen regler"], answer: 1 },
        { q: "Hva mener B om skolens ansvar?", options: ["Skolen har intet ansvar", "Skolen har et ekstra ansvar for veiledning", "Bare foreldre har ansvar", "Ansvar er unødvendig"], answer: 1 },
      ],
    },
    writing: { tasks: [
      { prompt: "Skriv en argumenterende tekst (150–200 ord) om følgende påstand: 'Mobiltelefoner bør forbys i grunnskolen i skoletiden.' Presenter din mening og støtt den med minst to argumenter. Du kan bruke ord som til tross for, følgelig, samtidig som og derimot.", minWords: 150 },
    ] },
  },
  {
    id: "b1b2-helsevesen", pair: "B1–B2", lower: "B1", upper: "B2", color: "#16324A", maxPlays: 1,
    reading: [
      { level: "B1", passage: "Det norske helsevesenet er i hovedsak offentlig finansiert, men det finnes også private helsetilbud som mange bruker for å unngå lange ventetider. Noen mener private alternativer avlaster det offentlige systemet, mens andre frykter at det skaper et todelt helsevesen.",
        questions: [
          { q: "Hvordan er det norske helsevesenet i hovedsak finansiert?", options: ["Privat", "Offentlig", "Av utlandet", "Ikke finansiert"], answer: 1 },
          { q: "Hva frykter noen at private tilbud skaper?", options: ["Et todelt helsevesen", "Lavere kvalitet overalt", "Ingen endring", "Kortere ventetider for alle"], answer: 0 },
        ] },
      { level: "B2", passage: "Til tross for at ventetidene i det offentlige helsevesenet varierer betydelig mellom regioner, viser statistikken en generell økning de siste årene. Følgelig velger stadig flere å tegne privat helseforsikring gjennom arbeidsgiver, samtidig som kritikere hevder at dette svekker det offentlige systemets legitimitet på lang sikt.",
        questions: [
          { q: "Hva viser statistikken om ventetider?", options: ["En generell nedgang", "En generell økning", "Ingen endring", "Ventetider finnes ikke"], answer: 1 },
          { q: "Hva hevder kritikere om privat forsikring?", options: ["At den styrker det offentlige systemet", "At den svekker det offentlige systemets legitimitet", "At den er irrelevant", "At den er gratis for alle"], answer: 1 },
        ] },
      { level: "B2", passage: "Et sentralt spørsmål er om ressursene bør styres sterkere mot forebygging fremfor behandling. Forskere peker på at investering i forebyggende helsearbeid kan redusere presset på sykehusene betydelig over tid, men politisk er det ofte vanskeligere å prioritere langsiktige tiltak fremfor umiddelbare kutt i ventelister.",
        questions: [
          { q: "Hva peker forskere på kan redusere presset på sykehusene?", options: ["Flere senger alene", "Investering i forebyggende helsearbeid", "Kortere åpningstider", "Ingenting"], answer: 1 },
          { q: "Hvorfor er langsiktige tiltak ofte vanskelige politisk?", options: ["De er for billige", "De er vanskeligere å prioritere fremfor umiddelbare kutt i ventelister", "Ingen bryr seg om helse", "De virker for raskt"], answer: 1 },
        ] },
    ],
    listening: {
      dialogue: "A: I dag skal vi diskutere offentlig versus privat helsevesen. Hva er ditt syn?\nB: Jeg mener det offentlige systemet bør være hovedpilaren, men private tilbud kan supplere det.\nA: Hvorfor supplere og ikke erstatte?\nB: Fordi et rent privat system ville skape ulikhet basert på hvem som har råd.\nA: Men avlaster ikke private tilbud det offentlige systemet i praksis?\nB: Delvis, men jeg tror ressursene heller burde gå til å styrke det offentlige direkte.\nA: Hva med forebygging fremfor behandling?\nB: Det er nøkkelen, egentlig. Vi bruker for mye penger på å reparere i stedet for å forebygge.\nA: Det er et sterkt poeng, men vanskelig å prioritere politisk på kort sikt.",
      questions: [
        { q: "Hva mener B bør være hovedpilaren?", options: ["Det private systemet", "Det offentlige systemet", "Ingen av delene", "Utenlandske sykehus"], answer: 1 },
        { q: "Hva tror B ressursene heller bør gå til?", options: ["Å styrke det offentlige direkte", "Kun private klinikker", "Ingenting spesielt", "Reklame"], answer: 0 },
        { q: "Hva mener B er nøkkelen?", options: ["Mer behandling", "Forebygging fremfor behandling", "Flere private sykehus", "Ingenting"], answer: 1 },
      ],
    },
    writing: { tasks: [
      { prompt: "Skriv en argumenterende tekst (150–200 ord) om følgende påstand: 'Private helsetilbud bør begrenses for å styrke det offentlige helsevesenet.' Presenter din mening og støtt den med minst to argumenter. Du kan bruke ord som til tross for, følgelig, samtidig som og derimot.", minWords: 150 },
    ] },
  },
];

const EVALUATIONS = {
  A2: {
    label: "A2-vurdering",
    blurb: "A diagnostic, not a curriculum test — mixes a few easier and harder items around the A2 core to locate your real level, the way an actual placement test would.",
    grammar: [
      { q: "Hvordan sier man 'Thank you' på norsk?", options: ["Ha det", "Takk", "Unnskyld", "Hei"], answer: 1, level: "A1" },
      { q: "Jeg ___ fra Norge.", options: ["har", "er", "bor", "heter"], answer: 1, level: "A1" },
      { q: "Hva er det motsatte av 'stor'?", options: ["liten", "fin", "ny", "god"], answer: 0, level: "A1" },
      { q: "Vi skal ___ til jobb med bussen.", options: ["reise", "reist", "reiser", "å reise"], answer: 0, level: "A2" },
      { q: "___ regnet det mye.", options: ["I dag", "I går", "I morgen", "Nå"], answer: 1, level: "A2" },
      { q: "Hva betyr 'billig'?", options: ["Expensive", "Cheap", "Heavy", "Light"], answer: 1, level: "A2" },
      { q: "Jeg ___ (jobbe) i går.", options: ["jobber", "jobbet", "jobbe", "jobbing"], answer: 1, level: "A2" },
      { q: "Vi ___ hjelpe deg i morgen.", options: ["kan", "kunne", "kanskje", "kan å"], answer: 0, level: "A2" },
      { q: "Hun bor ___ Bergen.", options: ["i", "på", "til", "fra"], answer: 0, level: "A2" },
      { q: "Det er et ___ hus.", options: ["fin", "fint", "fine", "fins"], answer: 1, level: "A2" },
      { q: "'Leilighet' betyr:", options: ["House", "Apartment", "Shop", "Office"], answer: 1, level: "A2" },
      { q: "Jeg har ___ (spise) middag allerede.", options: ["spist", "spiste", "spise", "spiser"], answer: 0, level: "B1" },
      { q: "___ jeg ikke forstår alt, følger jeg med.", options: ["Fordi", "Selv om", "Men", "Og"], answer: 1, level: "B1" },
      { q: "'Som' i 'Mannen som bor der' betyr:", options: ["And / but", "Who / which / that", "Because", "If"], answer: 1, level: "B1" },
    ],
    reading: [
      { level: "A2", passage: "Marte jobber deltid i en klesbutikk i sentrum. Hun liker jobben, men synes lørdager er slitsomme fordi det er mange kunder. På fritiden trener hun eller møter venner.",
        questions: [
          { q: "Hvor jobber Marte?", options: ["En skole", "En klesbutikk", "Et sykehus", "En restaurant"], answer: 1 },
          { q: "Hvorfor er lørdager slitsomme?", options: ["Hun jobber alene", "Mange kunder", "Hun er syk", "Butikken er stengt"], answer: 1 },
        ] },
      { level: "B1", passage: "Selv om mange nordmenn foretrekker å reise kollektivt til jobb, velger fortsatt en stor andel bilen, spesielt i distriktene der busstilbudet er dårligere.",
        questions: [
          { q: "Hva foretrekker mange nordmenn ifølge teksten?", options: ["Å alltid kjøre bil", "Å reise kollektivt", "Å sykle", "Å gå"], answer: 1 },
          { q: "Hvorfor velger noen bilen i distriktene?", options: ["De liker biler bedre", "Dårligere busstilbud", "Det er billigere", "Det er alltid raskere"], answer: 1 },
        ] },
    ],
    listening: {
      dialogue: "A: Hei! Har du sett værmeldingen for i morgen?\nB: Ja, det skal visst regne hele dagen.\nA: Å nei, jeg skulle jo gå tur i skogen.\nB: Du kan jo ta med paraply, eller vente til søndag. Da skal det bli sol.\nA: God idé, jeg venter til søndag da.",
      questions: [
        { q: "Hva skal skje med været i morgen?", options: ["Sol", "Regn", "Snø", "Vind"], answer: 1 },
        { q: "Hva skal A gjøre i skogen?", options: ["Jobbe", "Gå tur", "Sykle", "Fiske"], answer: 1 },
        { q: "Når skal det bli sol?", options: ["I morgen", "I dag", "På søndag", "På mandag"], answer: 2 },
      ],
      maxPlays: 2,
    },
    writing: { prompt: "Skriv en kort tekst (40–60 ord) om en vanlig helg for deg. Hva pleier du å gjøre?", minWords: 40 },
  },
};

async function loadProgress() {
  const fallback = { xp: 0, badges: [], quizBest: {}, sampleBest: {}, streak: 0, lastVisit: null, leitner: {}, quizMisses: {}, onboarded: false, targetPair: null, examDate: null, srsReviewCount: 0 };
  try {
    const res = await storage.get("progress", false);
    if (res && res.value) return { ...fallback, ...JSON.parse(res.value) };
  } catch (e) {}
  return fallback;
}
async function saveProgress(p) {
  try { await storage.set("progress", JSON.stringify(p), false); } catch (e) {}
}

async function loadPersonalPhrases(levelId) {
  try {
    const res = await storage.get(`personal-phrases-${levelId}`, false);
    if (res && res.value) return JSON.parse(res.value);
  } catch (e) {}
  return [];
}
async function savePersonalPhrases(levelId, list) {
  try { await storage.set(`personal-phrases-${levelId}`, JSON.stringify(list), false); } catch (e) {}
}

async function loadTheme() {
  try {
    const res = await storage.get("theme", false);
    if (res && res.value) return res.value;
  } catch (e) {}
  return "light";
}
async function saveTheme(theme) {
  try { await storage.set("theme", theme, false); } catch (e) {}
}

function detectPlatform() {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent || "";
  if (/Android/i.test(ua)) return "android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  // iPadOS 13+ reports its UA as desktop Safari/Macintosh; multi-touch is the tell.
  if (/Macintosh/i.test(ua) && typeof navigator.maxTouchPoints === "number" && navigator.maxTouchPoints > 1) return "ios";
  if (/Windows/i.test(ua)) return "windows";
  if (/Macintosh/i.test(ua)) return "mac";
  return "other";
}

function useNorwegianVoices() {
  const [voices, setVoices] = useState([]);
  const [refreshedAt, setRefreshedAt] = useState(0);
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    function load() { setVoices(window.speechSynthesis.getVoices()); }
    load();
    window.speechSynthesis.onvoiceschanged = load;
  }, [refreshedAt]);
  const norwegian = voices.find((v) => v.lang && /^(nb|nn|no)/i.test(v.lang));
  return {
    voices,
    norwegian,
    supported: typeof window !== "undefined" && "speechSynthesis" in window,
    platform: detectPlatform(),
    refresh: () => { setVoices(window.speechSynthesis ? window.speechSynthesis.getVoices() : []); setRefreshedAt(Date.now()); },
  };
}

function speakLine(text, voice, pitch = 1, onEnd) {
  const u = new SpeechSynthesisUtterance(text);
  if (voice) u.voice = voice;
  u.lang = "nb-NO";
  u.rate = 0.92;
  u.pitch = pitch;
  if (onEnd) u.onend = onEnd;
  window.speechSynthesis.speak(u);
}

function playDialogue(dialogue, voice) {
  window.speechSynthesis.cancel();
  const lines = dialogue.split("\n").filter(Boolean);
  lines.forEach((line) => {
    const isB = /^B:/.test(line.trim());
    const clean = line.replace(/^[AB]:\s*/, "");
    speakLine(clean, voice, isB ? 1.15 : 1.0);
  });
}

function SpeakButton({ text, voiceInfo, size = 14 }) {
  const [speaking, setSpeaking] = useState(false);
  if (!voiceInfo.supported) return null;
  function handle(e) {
    e.stopPropagation();
    window.speechSynthesis.cancel();
    speakLine(text, voiceInfo.norwegian, 1, () => setSpeaking(false));
    setSpeaking(true);
  }
  return (
    <button
      onClick={handle}
      title={voiceInfo.norwegian ? "Hør uttale" : "Hør uttale (bruker systemets standardstemme, ikke nødvendigvis norsk)"}
      style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "inline-flex", alignItems: "center", flexShrink: 0 }}
    >
      <Volume2 size={size} color={speaking ? C.navy : C.muted} />
    </button>
  );
}

function VoiceSetupBanner({ voiceInfo }) {
  const [checking, setChecking] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  if (!voiceInfo.supported || voiceInfo.norwegian || dismissed) return null;

  const steps = {
    android: {
      label: "Android",
      lines: [
        "Åpne Innstillinger → System → Språk og inndata → Tekst-til-tale.",
        "Trykk på tannhjulet ved siden av motoren din (ofte Google Tekst-til-tale) → Installer stemmedata.",
        "Finn Norsk (Bokmål) i listen og last den ned.",
        "Kom tilbake hit og trykk «Sjekk igjen» under.",
      ],
      deepLink: "intent:#Intent;action=android.settings.TTS_SETTINGS;end",
      deepLinkLabel: "Prøv å åpne tale-innstillinger direkte",
    },
    ios: {
      label: "iPhone / iPad",
      lines: [
        "Åpne Innstillinger → Tilgjengelighet → Opplest innhold → Stemmer.",
        "Velg Norsk og last ned en stemme (Bokmål).",
        "Kom tilbake hit og trykk «Sjekk igjen» under.",
      ],
    },
    windows: {
      label: "Windows",
      lines: [
        "Åpne Innstillinger → Tid og språk → Tale.",
        "Under «Administrer stemmer», velg Legg til stemmer og søk opp Norsk.",
        "Last ned, og last siden på nytt her.",
      ],
    },
    mac: {
      label: "Mac",
      lines: [
        "Åpne Systeminnstillinger → Tilgjengelighet → Opplest innhold.",
        "Velg System-stemme → Administrer stemmer, og last ned en norsk stemme.",
        "Kom tilbake hit og trykk «Sjekk igjen» under.",
      ],
    },
    other: {
      label: "enheten din",
      lines: [
        "Se etter tekst-til-tale eller «stemmer» i systeminnstillingene, og last ned et norsk (Bokmål) språkpakke der.",
        "Kom tilbake hit og trykk «Sjekk igjen» under.",
      ],
    },
  };
  const s = steps[voiceInfo.platform] || steps.other;

  function recheck() {
    setChecking(true);
    voiceInfo.refresh();
    setTimeout(() => setChecking(false), 600);
  }

  return (
    <div style={{ background: C.card, border: `1px solid ${C.gold}`, borderRadius: 12, padding: "16px 18px", marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: C.ink }}>Ingen norsk stemme funnet ({s.label})</div>
        <button onClick={() => setDismissed(true)} style={{ background: "none", border: "none", color: C.muted, fontSize: 12, cursor: "pointer", padding: 0 }}>Skjul</button>
      </div>
      <div style={{ fontSize: 12.5, color: C.muted, marginTop: 4, marginBottom: 10, lineHeight: 1.5 }}>
        Uttale-knappene fungerer, men bruker en annen stemme enn norsk til du installerer én. Dette tar ett par minutter:
      </div>
      <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: C.body, lineHeight: 1.9 }}>
        {s.lines.map((l, i) => <li key={i}>{l}</li>)}
      </ol>
      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        {s.deepLink && (
          <a href={s.deepLink} style={{ fontSize: 12.5, fontWeight: 600, color: C.navy, background: C.goldBg, border: `1px solid ${C.gold}`, borderRadius: 8, padding: "8px 14px", textDecoration: "none" }}>
            {s.deepLinkLabel}
          </a>
        )}
        <button onClick={recheck} style={{ fontSize: 12.5, fontWeight: 600, background: C.navy, color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}>
          {checking ? "Sjekker ..." : "Sjekk igjen"}
        </button>
      </div>
      {s.deepLink && (
        <div style={{ fontSize: 11, color: C.muted, marginTop: 8, lineHeight: 1.5 }}>
          Denne knappen åpner ikke alltid innstillinger direkte inne i Claude-appen — hvis ingenting skjer, følg trinnene manuelt over.
        </div>
      )}
    </div>
  );
}

function Contour({ color = C.border }) {
  return (
    <svg viewBox="0 0 400 16" style={{ width: "100%", height: 14, display: "block" }} preserveAspectRatio="none">
      <path d="M0,8 Q25,0 50,8 T100,8 T150,8 T200,8 T250,8 T300,8 T350,8 T400,8" fill="none" stroke={color} strokeWidth="1" />
    </svg>
  );
}

function StatBar({ progress }) {
  const rank = rankFor(progress.xp);
  const span = rank.next ? rank.next.min - rank.min : 1;
  const into = progress.xp - rank.min;
  const pct = rank.next ? Math.min(100, Math.round((into / span) * 100)) : 100;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Zap size={15} color={C.gold} />
          <span style={{ fontSize: 13.5, fontWeight: 700, color: C.ink }}>{rank.name}</span>
          <span style={{ fontSize: 12, color: C.muted }}>· {progress.xp} XP</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Flame size={15} color={progress.streak > 0 ? C.red : C.muted} />
          <span style={{ fontSize: 12.5, color: C.muted, fontWeight: 600 }}>{progress.streak} dager</span>
        </div>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: "#EFEDE4", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: C.gold, borderRadius: 3 }} />
      </div>
      {rank.next && (
        <div style={{ fontSize: 11, color: C.muted, marginTop: 5 }}>{rank.next.min - progress.xp} XP til {rank.next.name}</div>
      )}
    </div>
  );
}

const PAIR_OPTIONS = [
  { id: "A1-A2", label: "A1–A2", desc: "Just starting out" },
  { id: "A2-B1", label: "A2–B1", desc: "Permanent residence / citizenship" },
  { id: "B1-B2", label: "B1–B2", desc: "Higher proficiency" },
];

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target - startOfToday) / 86400000);
}

function ExamCountdown({ progress, onEdit }) {
  const days = daysUntil(progress.examDate);
  if (days === null) {
    return (
      <button onClick={onEdit} style={{ width: "100%", textAlign: "left", background: C.card, border: `1px dashed ${C.border}`, borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 12.5, color: C.muted, cursor: "pointer" }}>
        Sett en eksamensdato for å se nedtellingen din →
      </button>
    );
  }
  const label = days < 0 ? "Eksamensdatoen har passert" : days === 0 ? "Eksamen er i dag!" : `${days} ${days === 1 ? "dag" : "dager"} til Norskprøven`;
  const urgent = days >= 0 && days <= 14;
  return (
    <button
      onClick={onEdit}
      style={{
        width: "100%", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center",
        background: urgent ? C.goldBg : C.card, border: `1px solid ${urgent ? C.gold : C.border}`, borderRadius: 10,
        padding: "12px 16px", marginBottom: 16, cursor: "pointer",
      }}
    >
      <span style={{ fontSize: 13.5, fontWeight: 700, color: urgent ? "#5C4718" : C.ink }}>{label}</span>
      <span style={{ fontSize: 11.5, color: C.muted }}>Endre</span>
    </button>
  );
}

function OnboardingModal({ onComplete, initialPair = null, initialDate = "" }) {
  const [pair, setPair] = useState(initialPair);
  const [date, setDate] = useState(initialDate || "");

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(20,20,20,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 50 }}>
      <div style={{ background: C.bg, borderRadius: 14, padding: "26px 24px", maxWidth: 420, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ fontFamily: "ui-serif, Georgia, serif", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Velkommen til Dypdykk</div>
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 20 }}>
          Two quick questions so the app can focus on what actually matters for your test.
        </div>

        <div style={{ fontSize: 12, letterSpacing: 1, color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>Hvilket nivåpar tar du?</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {PAIR_OPTIONS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPair(p.id)}
              style={{ textAlign: "left", background: pair === p.id ? C.navy : C.card, color: pair === p.id ? "#fff" : C.ink, border: `1px solid ${pair === p.id ? C.navy : C.border}`, borderRadius: 10, padding: "10px 14px", cursor: "pointer" }}
            >
              <div style={{ fontSize: 14, fontWeight: 700 }}>{p.label}</div>
              <div style={{ fontSize: 11.5, color: pair === p.id ? "rgba(255,255,255,0.8)" : C.muted, marginTop: 2 }}>{p.desc}</div>
            </button>
          ))}
        </div>

        <div style={{ fontSize: 12, letterSpacing: 1, color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>Når er eksamen? (valgfritt)</div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", fontSize: 13.5, fontFamily: "inherit", marginBottom: 22 }}
        />

        <button
          onClick={() => onComplete({ targetPair: pair, examDate: date || null })}
          disabled={!pair}
          style={{ width: "100%", background: pair ? C.navy : "#EFEDE4", color: pair ? "#fff" : C.muted, border: "none", borderRadius: 10, padding: "12px 16px", fontSize: 14.5, fontWeight: 700, cursor: pair ? "pointer" : "default" }}
        >
          Kom i gang
        </button>
      </div>
    </div>
  );
}


function BadgeShelf({ progress }) {
  return (
    <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6, marginBottom: 20 }}>
      {BADGES.map((b) => {
        const earned = progress.badges.includes(b.id);
        return (
          <div key={b.id} title={b.desc} style={{
            flex: "0 0 auto", width: 84, textAlign: "center", padding: "10px 6px",
            borderRadius: 10, border: `1px solid ${earned ? C.gold : C.border}`,
            background: earned ? C.goldBg : "#F4F2EA", opacity: earned ? 1 : 0.55,
          }}>
            {earned ? <Award size={18} color={C.gold} /> : <Lock size={16} color={C.muted} />}
            <div style={{ fontSize: 10.5, fontWeight: 600, marginTop: 6, color: earned ? "#5C4718" : C.muted, lineHeight: 1.3 }}>{b.label}</div>
          </div>
        );
      })}
    </div>
  );
}

function FjordGauge({ levels, quizBest, activeId, onSelect }) {
  const H = 360, top = 30, bottom = 330, W = 620;
  const yFor = (depth) => top + ((depth - 1) / 3) * (bottom - top);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 620, display: "block", margin: "0 auto" }}>
      <defs>
        <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#DCE9F2" /><stop offset="100%" stopColor="#9FB9CC" />
        </linearGradient>
      </defs>
      <rect x={W / 2 - 90} y={top - 10} width="180" height={bottom - top + 40} fill="url(#water)" opacity="0.5" rx="4" />
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1={W / 2 - 90} x2={W / 2 + 90} y1={top + (i * (bottom - top)) / 3} y2={top + (i * (bottom - top)) / 3} stroke="#FFFFFF" strokeWidth="0.5" opacity="0.6" />
      ))}
      {levels.map((lv, i) => {
        const y = yFor(lv.depth);
        const isLeft = i % 2 === 0;
        const best = quizBest[lv.id];
        return (
          <g key={lv.id} style={{ cursor: "pointer" }} onClick={() => onSelect(lv.id)}>
            <circle cx={W / 2} cy={y} r={activeId === lv.id ? 11 : 9} fill={lv.color} stroke="#FFFFFF" strokeWidth="2" />
            {best !== undefined && <circle cx={W / 2} cy={y} r="15" fill="none" stroke={C.green} strokeWidth="2" opacity="0.7" />}
            <text x={isLeft ? W / 2 - 110 : W / 2 + 110} y={y + 5} textAnchor={isLeft ? "end" : "start"} fontSize="15" fontWeight="600" fill={C.ink} fontFamily="ui-serif, Georgia, serif">{lv.id}</text>
            <text x={isLeft ? W / 2 - 110 : W / 2 + 110} y={y + 21} textAnchor={isLeft ? "end" : "start"} fontSize="11" fill={C.muted}>{lv.name}{best !== undefined ? ` · best ${best}/8` : ""}</text>
          </g>
        );
      })}
      <text x={W / 2} y={top - 16} textAnchor="middle" fontSize="10" fill={C.muted} letterSpacing="1">OVERFLATE</text>
      <text x={W / 2} y={bottom + 26} textAnchor="middle" fontSize="10" fill={C.muted} letterSpacing="1">DYP</text>
    </svg>
  );
}

function VocabCard({ item, voiceInfo }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div onClick={() => setFlipped((f) => !f)} style={{ textAlign: "left", background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px", cursor: "pointer" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "space-between" }}>
        <div style={{ fontFamily: "ui-serif, Georgia, serif", fontSize: 17, color: C.ink, fontWeight: 600 }}>{item.no}</div>
        <SpeakButton text={item.no} voiceInfo={voiceInfo} />
      </div>
      <div style={{ fontSize: 13, color: flipped ? C.navy : C.muted, marginTop: 6, minHeight: 18 }}>{flipped ? (item.pret ? `${item.en} · preteritum: ${item.pret}` : item.en) : "Tap to reveal"}</div>
    </div>
  );
}

function dueWords(level, leitnerState) {
  const now = Date.now();
  return level.vocab
    .filter((v) => {
      const st = leitnerState[v.no];
      if (!st) return true;
      return new Date(st.due).getTime() <= now;
    })
    // Adaptive ordering: never-seen and low-box (weakest) words surface first,
    // while attention is freshest, instead of a fixed vocab-list order.
    .sort((a, b) => {
      const boxA = leitnerState[a.no] ? leitnerState[a.no].box : -1;
      const boxB = leitnerState[b.no] ? leitnerState[b.no].box : -1;
      return boxA - boxB;
    });
}

function VocabReview({ level, voiceInfo, progress, onRate }) {
  const leitnerState = progress.leitner[level.id] || {};
  const [queue] = useState(() => dueWords(level, leitnerState));
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  if (queue.length === 0) {
    return (
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "28px 20px", textAlign: "center" }}>
        <RotateCcw size={28} color={C.muted} style={{ marginBottom: 10 }} />
        <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 4 }}>Ingenting å repetere akkurat nå</div>
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, maxWidth: 320, marginInline: "auto" }}>
          Alle ord i {level.id} er nylig repetert. Kom tilbake senere, eller bla gjennom Ord-fanen i mellomtiden.
        </div>
      </div>
    );
  }

  if (pos >= queue.length) {
    return (
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "28px 20px", textAlign: "center" }}>
        <Award size={28} color={C.green} style={{ marginBottom: 10 }} />
        <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 4 }}>{reviewedCount} ord repetert</div>
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>Kom tilbake i morgen for neste runde — det er sånn spaced repetition fungerer best.</div>
      </div>
    );
  }

  const word = queue[pos];

  function rate(knew) {
    onRate(level.id, word.no, knew);
    setReviewedCount((c) => c + 1);
    setFlipped(false);
    setPos((p) => p + 1);
  }

  return (
    <div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>{pos + 1} / {queue.length}</div>
      <div
        onClick={() => setFlipped((f) => !f)}
        style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "36px 20px", textAlign: "center", cursor: "pointer", minHeight: 120, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "ui-serif, Georgia, serif", fontSize: 22, fontWeight: 700 }}>{word.no}</span>
          <SpeakButton text={word.no} voiceInfo={voiceInfo} size={16} />
        </div>
        <div style={{ fontSize: 14, color: flipped ? C.navy : C.muted }}>{flipped ? (word.pret ? `${word.en} · preteritum: ${word.pret}` : word.en) : "Trykk for å se oversettelsen"}</div>
      </div>

      {flipped ? (
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button onClick={() => rate(false)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: C.redBg, border: `1px solid ${C.red}`, color: "#6E2D29", borderRadius: 8, padding: "10px 14px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
            <X size={15} /> Visste ikke
          </button>
          <button onClick={() => rate(true)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: C.greenBg, border: `1px solid ${C.green}`, color: "#2E4A38", borderRadius: 8, padding: "10px 14px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
            <Check size={15} /> Visste det
          </button>
        </div>
      ) : (
        <div style={{ fontSize: 12, color: C.muted, textAlign: "center", marginTop: 12 }}>Trykk på kortet for å snu det</div>
      )}
    </div>
  );
}

function VerbPractice({ level, voiceInfo, progress, onRate }) {
  const [subTab, setSubTab] = useState("bla");
  const verbs = VERB_BUCKETS[level.id] || [];
  const verbLevel = { id: `${level.id}-verb`, vocab: verbs };
  const subtabs = [
    { id: "bla", label: "Bla" },
    { id: "repetisjon", label: "Repetisjon" },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {subtabs.map((s) => {
          const active = subTab === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setSubTab(s.id)}
              style={{
                padding: "6px 12px", borderRadius: 20, border: `1px solid ${active ? level.color : C.border}`,
                background: active ? level.color : "transparent", color: active ? "#fff" : C.muted,
                fontSize: 12.5, fontWeight: 600, cursor: "pointer",
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {subTab === "bla" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
          {verbs.map((v, i) => <VocabCard key={i} item={v} voiceInfo={voiceInfo} />)}
        </div>
      )}

      {subTab === "repetisjon" && (
        <div>
          <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.6, marginBottom: 16 }}>
            Samme spaced-repetition-system som Ord-fanen, men for verb og preteritumsformer.
          </div>
          <VocabReview level={verbLevel} voiceInfo={voiceInfo} progress={progress} onRate={onRate} />
        </div>
      )}
    </div>
  );
}

function GrammarCard({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
      <button onClick={() => setOpen((o) => !o)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>{item.title}</span>
        <ChevronDown size={18} color={C.muted} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 150ms ease", flexShrink: 0 }} />
      </button>
      {open && <div style={{ padding: "0 16px 16px", fontSize: 14, lineHeight: 1.6, color: C.body }}>{item.body}</div>}
    </div>
  );
}

function OptionButton({ opt, i, selected, answer, onClick }) {
  let bg = C.card, border = C.border, textColor = C.ink;
  if (selected !== null && selected !== undefined) {
    if (i === answer) { bg = C.greenBg; border = C.green; textColor = "#2E4A38"; }
    else if (i === selected) { bg = C.redBg; border = C.red; textColor = "#6E2D29"; }
  }
  return (
    <button onClick={onClick} style={{ textAlign: "left", padding: "12px 14px", borderRadius: 8, border: `1px solid ${border}`, background: bg, color: textColor, fontSize: 14, cursor: selected === null || selected === undefined ? "pointer" : "default", display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
      {opt}
      {selected !== null && selected !== undefined && i === answer && <Check size={16} color={C.green} />}
      {selected !== null && selected !== undefined && i === selected && i !== answer && <X size={16} color={C.red} />}
    </button>
  );
}

function Quiz({ level, onFinish, reviewIndices = null, order = null }) {
  const baseIndices = reviewIndices
    ? reviewIndices
    : (order && order.length === level.quiz.length ? order : level.quiz.map((_, i) => i));
  const questions = baseIndices.map((i) => ({ ...level.quiz[i], _origIndex: i }));
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState([]);
  const [done, setDone] = useState(false);
  const q = questions[idx];
  const isReview = !!reviewIndices;

  function choose(i) {
    if (selected !== null) return;
    setSelected(i);
    if (i === q.answer) setScore((s) => s + 1);
    else setMissed((m) => [...m, q._origIndex]);
  }
  function next() {
    if (idx + 1 < questions.length) { setIdx(idx + 1); setSelected(null); }
    else {
      setDone(true);
      onFinish(score, missed, questions.length, isReview, questions.map((qq) => qq._origIndex));
    }
  }

  if (done) {
    const passed = score >= Math.ceil(questions.length * 0.75);
    return (
      <div style={{ textAlign: "center", padding: "32px 16px" }}>
        <Award size={36} color={passed ? C.green : level.color} style={{ marginBottom: 12 }} />
        <div style={{ fontFamily: "ui-serif, Georgia, serif", fontSize: 28, fontWeight: 700, color: C.ink }}>{score} / {questions.length}</div>
        <div style={{ fontSize: 14, color: C.muted, marginTop: 6, maxWidth: 340, marginInline: "auto" }}>
          {isReview
            ? (missed.length === 0 ? "Alle svake punkter løst denne runden — bra jobbet." : "Fortsatt noen som sitter fast. De blir værende i svake-punkter-listen til du får dem riktig.")
            : (passed ? `Solid result for ${level.id}. That's the kind of accuracy Norskprøven is looking for at this level.` : `Worth another pass — Norskprøven typically expects strong, consistent accuracy at ${level.id} before moving on.`)}
        </div>
        <button onClick={() => { setIdx(0); setSelected(null); setScore(0); setMissed([]); setDone(false); }} style={{ marginTop: 20, display: "inline-flex", alignItems: "center", gap: 8, background: C.navy, color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          <RotateCcw size={15} /> Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {questions.map((_, i) => <div key={i} style={{ height: 4, flex: 1, borderRadius: 2, background: i < idx ? level.color : i === idx ? C.border : "#EFEDE4" }} />)}
      </div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>{isReview ? "Svakt punkt" : "Question"} {idx + 1} of {questions.length}</div>
      <div style={{ fontSize: 18, fontWeight: 600, color: C.ink, marginBottom: 18, lineHeight: 1.4 }}>{q.q}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {q.options.map((opt, i) => <OptionButton key={i} opt={opt} i={i} selected={selected} answer={q.answer} onClick={() => choose(i)} />)}
      </div>
      {selected !== null && (
        <button onClick={next} style={{ marginTop: 20, background: C.navy, color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          {idx + 1 < questions.length ? "Next question" : "See results"}
        </button>
      )}
    </div>
  );
}

function QuizSection({ level, progress, onFinish }) {
  const [mode, setMode] = useState("full");
  const misses = progress.quizMisses[level.id] || {};
  const weakIndices = Object.keys(misses).filter((k) => misses[k] > 0).map(Number).sort((a, b) => misses[b] - misses[a]);
  // Adaptive full-quiz order: questions you've historically missed more often
  // surface earlier, while still covering every question in the level.
  const adaptiveOrder = level.quiz
    .map((_, i) => i)
    .sort((a, b) => (misses[b] || 0) - (misses[a] || 0));

  return (
    <div>
      {weakIndices.length > 0 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          <button
            onClick={() => setMode("full")}
            style={{ padding: "6px 12px", borderRadius: 20, border: `1px solid ${mode === "full" ? level.color : C.border}`, background: mode === "full" ? level.color : "transparent", color: mode === "full" ? "#fff" : C.muted, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
          >
            Full prøve
          </button>
          <button
            onClick={() => setMode("review")}
            style={{ padding: "6px 12px", borderRadius: 20, border: `1px solid ${mode === "review" ? level.color : C.border}`, background: mode === "review" ? level.color : "transparent", color: mode === "review" ? "#fff" : C.muted, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
          >
            Svake punkter ({weakIndices.length})
          </button>
        </div>
      )}
      <Quiz
        key={`${level.id}-${mode}-${weakIndices.length}`}
        level={level}
        order={mode === "full" ? adaptiveOrder : null}
        reviewIndices={mode === "review" ? weakIndices : null}
        onFinish={(score, missed, total, isReview, attemptedIndices) => onFinish(level, score, missed, total, isReview, attemptedIndices)}
      />
    </div>
  );
}

function SectionQuestions({ questions, onSubmit, submitLabel }) {
  const [answers, setAnswers] = useState(Array(questions.length).fill(null));
  const [submitted, setSubmitted] = useState(false);
  const allAnswered = answers.every((a) => a !== null);
  function pick(qi, oi) {
    if (submitted) return;
    const next = [...answers]; next[qi] = oi; setAnswers(next);
  }
  function submit() {
    const score = answers.reduce((s, a, i) => s + (a === questions[i].answer ? 1 : 0), 0);
    setSubmitted(true);
    onSubmit(score, answers);
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {questions.map((q, qi) => (
        <div key={qi}>
          <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 10 }}>{q.q}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {q.options.map((opt, oi) => <OptionButton key={oi} opt={opt} i={oi} selected={submitted ? answers[qi] : answers[qi]} answer={q.answer} onClick={() => pick(qi, oi)} />)}
          </div>
        </div>
      ))}
      {!submitted && (
        <button disabled={!allAnswered} onClick={submit} style={{ alignSelf: "flex-start", background: allAnswered ? C.navy : "#C9C6BA", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: allAnswered ? "pointer" : "default" }}>
          {submitLabel}
        </button>
      )}
    </div>
  );
}

function ListeningSection({ data, onSubmit, voiceInfo, maxPlays = 2 }) {
  const [plays, setPlays] = useState(0);
  const [revealed, setRevealed] = useState(false);
  function play() {
    if (plays >= maxPlays) return;
    setPlays((p) => p + 1);
    if (voiceInfo.supported) playDialogue(data.dialogue, voiceInfo.norwegian);
    setRevealed(true);
  }
  const ruleNote = maxPlays === 1
    ? "The real Norskprøven plays B2-level listening only once — everything below B2 gets two plays. This section mirrors the B2 rule: one play only."
    : "The real Norskprøven plays listening audio twice for A1 through B1. Same rule here.";
  return (
    <div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 14, lineHeight: 1.5, display: "flex", gap: 6 }}>
        <Info size={13} style={{ flexShrink: 0, marginTop: 2 }} />
        <span>
          {voiceInfo.supported
            ? `${ruleNote}${!voiceInfo.norwegian ? " Your browser doesn't have a Norwegian voice installed, so this may play in a default accent — try covering the transcript below for a closer approximation." : " Try covering the transcript below and listening only, for a closer approximation of the real test."}`
            : "Your browser doesn't support text-to-speech, so this falls back to a capped transcript reveal instead of audio."}
        </span>
      </div>
      <button onClick={play} disabled={plays >= maxPlays} style={{ display: "flex", alignItems: "center", gap: 8, background: plays >= maxPlays ? "#EFEDE4" : C.navy, color: plays >= maxPlays ? C.muted : "#fff", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13.5, fontWeight: 600, cursor: plays >= maxPlays ? "default" : "pointer", marginBottom: 16 }}>
        <Play size={14} /> {plays === 0 ? (voiceInfo.supported ? "Spill av" : "Vis transkripsjon") : `Spill av igjen (${plays}/${maxPlays})`}
      </button>
      {revealed && (
        <div style={{ background: "#F4F2EA", border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px", marginBottom: 20, whiteSpace: "pre-line", fontSize: 14, lineHeight: 1.7 }}>
          {data.dialogue}
        </div>
      )}
      {plays > 0 && <SectionQuestions questions={data.questions} onSubmit={onSubmit} submitLabel="Submit listening section" />}
    </div>
  );
}

const WRITING_FEEDBACK_SYSTEM = `You are assessing pieces of Norwegian writing from learners preparing for Norskprøven (HK-dir's official Norwegian test, CEFR A1–B2). For each submission you'll receive the task prompt and the learner's response.

Give feedback in English, structured as plain text with exactly these labelled sections:
- Estimated level: a single CEFR estimate (A1, A2, B1, or B2) based on vocabulary range, sentence complexity, and accuracy.
- Strengths: 2-3 short, specific points — not generic praise.
- To improve: 2-3 concrete corrections, quoting the learner's own words where useful so they can see exactly what to fix (word order, verb conjugation, gender agreement, preposition choice, etc. are common Norwegian trouble spots).
- Model sentence: one improved sentence based on their writing, showing the fix in context.

Keep the whole response under 220 words. Be honest about the level and gaps, but encouraging in tone — these are self-directed exam candidates, not students in a classroom with a teacher to fall back on.`;

function WritingTask({ task, index }) {
  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const words = text.trim().split(/\s+/).filter(Boolean).length;

  async function getFeedback() {
    setLoading(true); setError(null); setFeedback(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: [
            { type: "text", text: WRITING_FEEDBACK_SYSTEM, cache_control: { type: "ephemeral" } },
          ],
          messages: [{
            role: "user",
            content: `Task: "${task.prompt}"\n\nLearner's response:\n\n"${text}"`,
          }],
        }),
      });
      const data = await res.json();
      const txt = (data.content || []).filter((c) => c.type === "text").map((c) => c.text).join("\n");
      if (!txt) throw new Error("empty");
      setFeedback(txt);
    } catch (e) {
      setError("Couldn't get feedback right now. You can still self-check against the grammar notes for this level pair.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 4 }}>Oppgave {index + 1}</div>
      <div style={{ fontSize: 13.5, color: C.body, lineHeight: 1.6, marginBottom: 10 }}>{task.prompt}</div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Skriv svaret ditt her ..."
        rows={6}
        style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", fontSize: 14, fontFamily: "inherit", resize: "vertical" }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
        <span style={{ fontSize: 12, color: words >= task.minWords ? C.green : C.muted }}>{words} / {task.minWords}+ ord</span>
        <button onClick={getFeedback} disabled={loading || words === 0} style={{ display: "flex", alignItems: "center", gap: 6, background: words === 0 ? "#EFEDE4" : C.navy, color: words === 0 ? C.muted : "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: words === 0 ? "default" : "pointer" }}>
          {loading ? <><Loader2 size={14} className="spin" /> Vurderer ...</> : "Få tilbakemelding"}
        </button>
      </div>
      {error && <div style={{ marginTop: 10, fontSize: 12.5, color: C.red }}>{error}</div>}
      {feedback && (
        <div style={{ marginTop: 12, background: C.greenBg, border: `1px solid ${C.green}`, borderRadius: 10, padding: "14px 16px", fontSize: 13.5, lineHeight: 1.6, whiteSpace: "pre-line", color: "#2E4A38" }}>
          {feedback}
        </div>
      )}
    </div>
  );
}

function SampleTest({ test, onExit, onXP, onComplete, voiceInfo }) {
  const [stage, setStage] = useState("intro");
  const [readingScore, setReadingScore] = useState(null);
  const [listeningScore, setListeningScore] = useState(null);
  const [examMode, setExamMode] = useState(false);
  const sw = useStopwatch();

  const readingQs = test.reading.flatMap((p) => p.questions);
  const readingMax = readingQs.length;
  const listeningMax = test.listening.questions.length;
  const inProgress = ["reading", "listening", "writing", "oral"].includes(stage);
  const locked = examMode && inProgress;

  function estimateLevel(pct) {
    if (pct >= 80) return test.upper;
    if (pct >= 50) return test.lower;
    return `under ${test.lower}`;
  }

  function startTest() {
    if (examMode) { sw.reset(); sw.start(); }
    setStage("reading");
  }

  function finishTest() {
    if (examMode) sw.stop();
    onXP(30);
    setStage("results");
    onComplete(test.id, { reading: readingScore, listening: listeningScore });
  }

  return (
    <div>
      {!locked ? (
        <button onClick={onExit} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: C.muted, fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 18 }}>
          <ArrowLeft size={15} /> Prøvesett
        </button>
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.goldBg, border: `1px solid ${C.gold}`, borderRadius: 8, padding: "8px 14px", marginBottom: 18 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#5C4718" }}>Eksamensmodus — ingen pause til alle deler er fullført</span>
          <span style={{ fontFamily: "ui-mono, monospace", fontSize: 13, fontWeight: 700, color: "#5C4718" }}>{sw.label}</span>
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: test.color, display: "inline-block" }} />
        <span style={{ fontSize: 12, letterSpacing: 1, color: C.muted, textTransform: "uppercase" }}>Prøvesett · {test.pair}</span>
      </div>
      <h2 style={{ fontFamily: "ui-serif, Georgia, serif", fontSize: 24, fontWeight: 700, margin: "0 0 16px" }}>
        {stage === "intro" && "Om testen"}
        {stage === "reading" && "Leseprøve"}
        {stage === "listening" && "Lytteprøve"}
        {stage === "writing" && "Skriveprøve"}
        {stage === "oral" && "Muntlig forberedelse"}
        {stage === "results" && "Resultat"}
      </h2>

      {stage === "intro" && (
        <div>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: C.body }}>
            This mirrors how Norskprøven is actually structured: you register for a level pair, and reading, listening, and writing are scored independently rather than combined into one grade. Three sections, in order — reading, listening, writing.
          </p>
          <ul style={{ fontSize: 13.5, color: C.body, lineHeight: 1.9, paddingLeft: 18 }}>
            <li>
              <FileText size={13} style={{ verticalAlign: -1, marginRight: 4 }} />Reading: {readingMax} questions across two short texts — the real test gives you 75 minutes and B2-level reading is what universities require for admission.{" "}
              <a href="https://prove.hkdir.no/en/norwegian-language-test-a1-b2/practice-for-test-norwegian-language-a1-b2/practice-for-the-reading-test" target="_blank" rel="noopener noreferrer" style={{ color: C.navy }}>Official examples ↗</a>
            </li>
            <li>
              <Headphones size={13} style={{ verticalAlign: -1, marginRight: 4 }} />Listening: a spoken dialogue (text-to-speech, {test.maxPlays === 1 ? "played once, matching the real B2 rule" : "played twice, matching the real A1–B1 rule"}) plus {listeningMax} questions.{" "}
              <a href="https://prove.hkdir.no/en/norwegian-language-test-a1-b2/practice-for-test-norwegian-language-a1-b2/practice-for-the-listening-test" target="_blank" rel="noopener noreferrer" style={{ color: C.navy }}>Official examples ↗</a>
            </li>
            <li>
              <PenLine size={13} style={{ verticalAlign: -1, marginRight: 4 }} />Writing: {test.writing.tasks.length} task{test.writing.tasks.length > 1 ? "s" : ""}, with optional AI feedback.{" "}
              <a href="https://prove.hkdir.no/en/norwegian-language-test-a1-b2/practice-for-test-norwegian-language-a1-b2/practise-for-the-writing-test" target="_blank" rel="noopener noreferrer" style={{ color: C.navy }}>Official examples ↗</a>
            </li>
          </ul>

          <div
            onClick={() => setExamMode((m) => !m)}
            style={{ display: "flex", alignItems: "flex-start", gap: 10, background: examMode ? C.goldBg : C.card, border: `1px solid ${examMode ? C.gold : C.border}`, borderRadius: 10, padding: "12px 14px", marginTop: 14, marginBottom: 4, cursor: "pointer" }}
          >
            <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${examMode ? C.gold : C.border}`, background: examMode ? C.gold : "transparent", flexShrink: 0, marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {examMode && <Check size={12} color="#fff" />}
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: examMode ? "#5C4718" : C.ink }}>Eksamensmodus</div>
              <div style={{ fontSize: 12, color: examMode ? "#5C4718" : C.muted, lineHeight: 1.6, marginTop: 2 }}>
                Runs all sections back-to-back with no pausing or exiting until you finish, plus a running clock — closer to actual exam-day conditions.
              </div>
            </div>
          </div>

          <button onClick={startTest} style={{ marginTop: 12, background: C.navy, color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Start prøve</button>
        </div>
      )}

      {stage === "reading" && (
        <div>
          {test.reading.map((p, pi) => (
            <div key={pi} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 18px", marginBottom: 16 }}>
              <div style={{ fontSize: 14, lineHeight: 1.7, color: C.body, marginBottom: 14, fontStyle: "italic" }}>{p.passage}</div>
            </div>
          ))}
          <SectionQuestions
            questions={readingQs}
            submitLabel="Submit reading section"
            onSubmit={(score) => { setReadingScore(score); onXP(score * 10); setStage("listening"); }}
          />
        </div>
      )}

      {stage === "listening" && (
        <ListeningSection
          data={test.listening}
          voiceInfo={voiceInfo}
          maxPlays={test.maxPlays}
          onSubmit={(score) => { setListeningScore(score); onXP(score * 10); setStage("writing"); }}
        />
      )}

      {stage === "writing" && (
        <div>
          {test.writing.tasks.map((t, i) => <WritingTask key={i} task={t} index={i} />)}
          <button onClick={() => { onXP(50); setStage("oral"); }} style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            Fortsett til muntlig forberedelse
          </button>
        </div>
      )}

      {stage === "oral" && (
        <div>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 16 }}>
            The real oral exam is live with a certified examiner, held on a separate day from the written test, and includes both solo and paired speaking — nothing in an app can substitute for that. This is optional practice for the {test.pair} topics, not a scored section.{" "}
            <a href="https://prove.hkdir.no/en/norwegian-language-test-a1-b2/practice-for-test-norwegian-language-a1-b2/practise-for-the-oral-test" target="_blank" rel="noopener noreferrer" style={{ color: C.navy, fontWeight: 600 }}>Official sample speaking tasks (PDF) ↗</a>
          </div>
          <SpeakingPractice level={{ id: test.upper, name: test.pair }} voiceInfo={voiceInfo} />
          <button onClick={finishTest} style={{ marginTop: 18, background: C.navy, color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            Fullfør prøvesett
          </button>
        </div>
      )}

      {stage === "results" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px" }}>
              <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>Lesing</div>
              <div style={{ fontFamily: "ui-serif, Georgia, serif", fontSize: 22, fontWeight: 700, margin: "4px 0" }}>{readingScore}/{readingMax}</div>
              <div style={{ fontSize: 12.5, color: C.green, fontWeight: 600 }}>≈ {estimateLevel((readingScore / readingMax) * 100)}</div>
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px" }}>
              <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>Lytting</div>
              <div style={{ fontFamily: "ui-serif, Georgia, serif", fontSize: 22, fontWeight: 700, margin: "4px 0" }}>{listeningScore}/{listeningMax}</div>
              <div style={{ fontSize: 12.5, color: C.green, fontWeight: 600 }}>≈ {estimateLevel((listeningScore / listeningMax) * 100)}</div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 16 }}>
            Writing isn't scored numerically here — check the feedback you got on each task above against these estimates. On the real test, each skill gets its own independent result the same way.
          </div>
          {examMode && (
            <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 16 }}>
              Total tid i eksamensmodus: <strong style={{ color: C.ink }}>{sw.label}</strong>
            </div>
          )}
          <button onClick={onExit} style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Tilbake til prøvesett</button>
        </div>
      )}
    </div>
  );
}

function verdictFor({ anchorPct, corePct, stretchPct }) {
  if (anchorPct < 0.66) {
    return { title: "Foundational gaps first", tone: C.red, body: "A couple of basic A1 items slipped — that's worth shoring up before A2 results mean much. Spend a few days back in the A1 tabs, then retake this." };
  }
  if (corePct >= 0.8 && stretchPct >= 0.5) {
    return { title: "Exceeding A2 — trending B1", tone: C.green, body: "Your A2 core is solid and you're already handling some B1-level material. Registering A2–B1 looks realistic — keep pushing B1 grammar and vocab." };
  }
  if (corePct >= 0.7) {
    return { title: "Solid A2", tone: C.green, body: "A2 is dependable. B1 material is still early, which is normal — that's exactly what the A2–B1 pair expects you to build over the coming weeks." };
  }
  if (corePct >= 0.5) {
    return { title: "Emerging A2", tone: C.gold, body: "The core is forming but not yet reliable under pressure. More repetition on A2 vocab and grammar before leaning on this for an A2–B1 attempt." };
  }
  return { title: "Not yet solid A2", tone: C.red, body: "A2 fundamentals need more work before B1 material will make sense. Focus back on the A2 tabs — Ord, Fraser, Grammatikk — for the next week or two." };
}

function ProficiencyEvaluation({ evalData, onExit, onXP, onComplete, voiceInfo }) {
  const [stage, setStage] = useState("intro");
  const [grammarAnswers, setGrammarAnswers] = useState(null);
  const [readingAnswers, setReadingAnswers] = useState(null);
  const [listeningScore, setListeningScore] = useState(null);
  const readingQs = evalData.reading.flatMap((p) => p.questions.map((q) => ({ ...q, level: p.level })));

  function tagPct(tagged, answers, level) {
    const items = tagged.filter((t) => t.level === level);
    if (items.length === 0) return 0;
    const correct = tagged.reduce((s, t, i) => s + (t.level === level && answers[i] === t.answer ? 1 : 0), 0);
    return correct / items.length;
  }

  return (
    <div>
      <button onClick={onExit} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: C.muted, fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 18 }}>
        <ArrowLeft size={15} /> Vurdering
      </button>
      <div style={{ fontSize: 12, letterSpacing: 1, color: C.muted, textTransform: "uppercase", marginBottom: 6 }}>Nivåvurdering</div>
      <h2 style={{ fontFamily: "ui-serif, Georgia, serif", fontSize: 24, fontWeight: 700, margin: "0 0 16px" }}>
        {stage === "intro" && evalData.label}
        {stage === "grammar" && "Ord og grammatikk"}
        {stage === "reading" && "Lesing"}
        {stage === "listening" && "Lytting"}
        {stage === "writing" && "Skriving"}
        {stage === "results" && "Resultat"}
      </h2>

      {stage === "intro" && (
        <div>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: C.body }}>{evalData.blurb}</p>
          <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
            {evalData.grammar.length} ord- og grammatikkoppgaver, {evalData.reading.reduce((s, p) => s + p.questions.length, 0)} leseoppgaver, en lytteoppgave, og én kort skriveoppgave. No score is a fixed number — you'll get a verdict on where you actually stand.
          </p>
          <button onClick={() => setStage("grammar")} style={{ marginTop: 8, background: C.navy, color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Start vurdering</button>
        </div>
      )}

      {stage === "grammar" && (
        <SectionQuestions
          questions={evalData.grammar}
          submitLabel="Neste: Lesing"
          onSubmit={(score, answers) => { setGrammarAnswers(answers); onXP(score * 8); setStage("reading"); }}
        />
      )}

      {stage === "reading" && (
        <div>
          {evalData.reading.map((p, pi) => (
            <div key={pi} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 18px", marginBottom: 16 }}>
              <div style={{ fontSize: 14, lineHeight: 1.7, color: C.body, fontStyle: "italic" }}>{p.passage}</div>
            </div>
          ))}
          <SectionQuestions
            questions={readingQs}
            submitLabel="Neste: Lytting"
            onSubmit={(score, answers) => { setReadingAnswers(answers); onXP(score * 8); setStage("listening"); }}
          />
        </div>
      )}

      {stage === "listening" && (
        <ListeningSection
          data={evalData.listening}
          voiceInfo={voiceInfo}
          maxPlays={evalData.listening.maxPlays}
          onSubmit={(score) => { setListeningScore(score); onXP(score * 8); setStage("writing"); }}
        />
      )}

      {stage === "writing" && (
        <div>
          <WritingTask task={evalData.writing} index={0} />
          <button onClick={() => { onXP(40); setStage("results"); onComplete(); }} style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            Se resultat
          </button>
        </div>
      )}

      {stage === "results" && (() => {
        const anchorPct = tagPct(evalData.grammar, grammarAnswers, "A1");
        const grammarCorePct = tagPct(evalData.grammar, grammarAnswers, "A2");
        const grammarStretchPct = tagPct(evalData.grammar, grammarAnswers, "B1");
        const readingA2Pct = tagPct(readingQs, readingAnswers, "A2");
        const readingB1Pct = tagPct(readingQs, readingAnswers, "B1");
        const listeningPct = evalData.listening.questions.length ? listeningScore / evalData.listening.questions.length : 0;
        const corePct = (grammarCorePct + readingA2Pct + listeningPct) / 3;
        const stretchPct = (grammarStretchPct + readingB1Pct) / 2;
        const v = verdictFor({ anchorPct, corePct, stretchPct });
        return (
          <div>
            <div style={{ background: C.card, border: `2px solid ${v.tone}`, borderRadius: 12, padding: "18px 20px", marginBottom: 18 }}>
              <div style={{ fontFamily: "ui-serif, Georgia, serif", fontSize: 20, fontWeight: 700, color: v.tone, marginBottom: 6 }}>{v.title}</div>
              <div style={{ fontSize: 13.5, color: C.body, lineHeight: 1.6 }}>{v.body}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: 16 }}>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 10.5, color: C.muted, textTransform: "uppercase" }}>A1-anker</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{Math.round(anchorPct * 100)}%</div>
              </div>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 10.5, color: C.muted, textTransform: "uppercase" }}>A2-kjerne</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{Math.round(corePct * 100)}%</div>
              </div>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 10.5, color: C.muted, textTransform: "uppercase" }}>B1-strekk</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{Math.round(stretchPct * 100)}%</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 16 }}>
              This is a diagnostic snapshot, not an official result — pair it with the writing feedback above and the A2–B1 Prøvesett for the fuller picture.
            </div>
            <button onClick={onExit} style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Tilbake</button>
          </div>
        );
      })()}
    </div>
  );
}

const TABS = [
  { id: "vocab", label: "Ord", icon: BookOpen },
  { id: "verb", label: "Verb", icon: Zap },
  { id: "repetisjon", label: "Repetisjon", icon: Repeat },
  { id: "phrases", label: "Fraser", icon: MessageCircle },
  { id: "grammar", label: "Grammatikk", icon: Sparkles },
  { id: "ovelser", label: "Øvelser", icon: Puzzle },
  { id: "snakk", label: "Snakk", icon: Mic },
  { id: "quiz", label: "Ordprøve", icon: GraduationCap },
];

const SPEAKING_PROMPTS = {
  A1: [
    "Presenter deg selv: Hva heter du, hvor bor du, og hvor kommer du fra?",
    "Beskriv familien din med noen enkle setninger.",
    "Fortell hva klokken er nå, og hva du skal gjøre resten av dagen.",
  ],
  A2: [
    "Fortell om en vanlig dag på jobben eller i hverdagen din.",
    "Beskriv været i dag, og hva du liker å gjøre når det er sånt vær.",
    "Du er i en butikk. Spør om prisen på noe, og takk for hjelpen.",
  ],
  B1: [
    "Fortell hva du synes om å jobbe hjemmefra. Bruk 'etter min mening' og gi minst to grunner.",
    "Beskriv en erfaring som var viktig for deg, og forklar hvorfor.",
    "Er utdanning viktigere enn erfaring? Bruk 'for det første ... for det andre ...'.",
  ],
  B2: [
    "Argumenter for eller mot: 'Alle bør redusere forbruket sitt for miljøets skyld.'",
    "Diskuter fordeler og ulemper ved mangfold på arbeidsplassen. Bruk 'på den ene siden ... på den andre siden ...'.",
    "Forklar en utfordring i samfunnet i dag, og foreslå en løsning.",
  ],
};

const REPAIR_PHRASES = [
  {
    id: "ask",
    group: "Spør på nytt",
    when: "When you didn't catch something",
    items: [
      { no: "Kan du gjenta det?", en: "Can you repeat that?" },
      { no: "Hva betyr det ordet?", en: "What does that word mean?" },
      { no: "Kan du si det på en annen måte?", en: "Can you say it another way?" },
      { no: "Kan du si det litt saktere?", en: "Can you say it a little slower?" },
    ],
  },
  {
    id: "buy",
    group: "Kjøp deg tid",
    when: "When your mind goes blank",
    items: [
      { no: "Hmm, la meg tenke litt ...", en: "Hmm, let me think..." },
      { no: "Det er et godt spørsmål.", en: "That's a good question." },
      { no: "Jeg er ikke helt sikker, men ...", en: "I'm not quite sure, but..." },
      { no: "Vent litt, jeg skal forklare.", en: "Wait a moment, I'll explain." },
    ],
  },
  {
    id: "flow",
    group: "Hold flyten",
    when: "To connect ideas and sound natural",
    items: [
      { no: "For eksempel ...", en: "For example..." },
      { no: "Som regel ...", en: "Usually..." },
      { no: "Etter min mening ...", en: "In my opinion..." },
      { no: "Dessuten ...", en: "Besides..." },
      { no: "På den ene siden ... på den andre siden ...", en: "On one hand... on the other hand..." },
    ],
  },
];

const GENERIC_DESCRIBE_PHRASES = [
  { no: "Til venstre ser jeg ...", en: "To the left I see..." },
  { no: "Til høyre er det ...", en: "To the right there is..." },
  { no: "I bakgrunnen kan jeg se ...", en: "In the background I can see..." },
  { no: "Det ser ut som ...", en: "It looks like..." },
  { no: "Jeg tror at ...", en: "I think that..." },
  { no: "Bildet viser ...", en: "The picture shows..." },
];

const PICTURE_SCENES = [
  { id: "park", icon: TreePine, no: "En vårdag i parken", en: "A spring day in the park", phrases: [
    { no: "Folk sitter på gresset og nyter solen.", en: "People are sitting on the grass enjoying the sun." },
    { no: "Noen går tur med hunden sin.", en: "Someone is walking their dog." },
    { no: "Det er mange trær og blomster.", en: "There are many trees and flowers." },
  ]},
  { id: "supermarket", icon: ShoppingCart, no: "I matbutikken", en: "At the supermarket", phrases: [
    { no: "En mann står i kassekøen.", en: "A man is standing in the checkout queue." },
    { no: "Hyllene er fulle av frukt og grønnsaker.", en: "The shelves are full of fruit and vegetables." },
    { no: "En kvinne sammenligner priser.", en: "A woman is comparing prices." },
  ]},
  { id: "train", icon: TramFront, no: "På togstasjonen", en: "At the train station", phrases: [
    { no: "Folk venter på perrongen.", en: "People are waiting on the platform." },
    { no: "Toget kommer inn på stasjonen.", en: "The train is arriving at the station." },
    { no: "En reisende sjekker rutetabellen.", en: "A traveler is checking the timetable." },
  ]},
  { id: "beach", icon: Waves, no: "Sommer på stranden", en: "Summer at the beach", phrases: [
    { no: "Barna bygger sandslott.", en: "The children are building sandcastles." },
    { no: "Noen svømmer i vannet.", en: "Someone is swimming in the water." },
    { no: "Solen skinner og himmelen er blå.", en: "The sun is shining and the sky is blue." },
  ]},
  { id: "birthday", icon: Cake, no: "Forberedelser til bursdag", en: "Getting ready for a birthday", phrases: [
    { no: "De pynter rommet med ballonger.", en: "They are decorating the room with balloons." },
    { no: "Kaken står klar på bordet.", en: "The cake is ready on the table." },
    { no: "Gjestene begynner å komme.", en: "The guests are starting to arrive." },
  ]},
  { id: "football", icon: Activity, no: "Fotballtrening", en: "Football practice", phrases: [
    { no: "Spillerne løper over banen.", en: "The players are running across the field." },
    { no: "Treneren roper instruksjoner.", en: "The coach is shouting instructions." },
    { no: "Noen scorer et mål.", en: "Someone scores a goal." },
  ]},
  { id: "ferry", icon: Ship, no: "Ved fergekaien", en: "At the ferry dock", phrases: [
    { no: "Fergen legger til kai.", en: "The ferry is docking." },
    { no: "Passasjerene venter på å gå om bord.", en: "The passengers are waiting to board." },
    { no: "Måker flyr over vannet.", en: "Seagulls are flying over the water." },
  ]},
  { id: "market", icon: Store, no: "På bondens marked", en: "At the farmers' market", phrases: [
    { no: "Bøndene selger grønnsaker og ost.", en: "The farmers are selling vegetables and cheese." },
    { no: "Det lukter nybakt brød.", en: "It smells like freshly baked bread." },
    { no: "Kundene går fra bod til bod.", en: "The customers are going from stall to stall." },
  ]},
  { id: "cabin", icon: Snowflake, no: "Vinterdag ved hytten", en: "A winter day at the cabin", phrases: [
    { no: "Snøen dekker taket og bakken.", en: "Snow covers the roof and the ground." },
    { no: "Familien går på ski i skogen.", en: "The family is skiing in the forest." },
    { no: "Det kommer røyk fra pipa.", en: "Smoke is coming from the chimney." },
  ]},
];

const SENTENCE_BUILDER = {
  A1: [
    { no: "Jeg heter Anna", en: "My name is Anna" },
    { no: "Jeg bor i Oslo", en: "I live in Oslo" },
    { no: "Hun snakker norsk hver dag", en: "She speaks Norwegian every day" },
    { no: "Vi spiser frokost klokka åtte", en: "We eat breakfast at eight o'clock" },
  ],
  A2: [
    { no: "I går gikk jeg på jobb", en: "Yesterday I went to work" },
    { no: "Han har bodd i Norge i tre år", en: "He has lived in Norway for three years" },
    { no: "Kan du hjelpe meg med dette", en: "Can you help me with this" },
    { no: "Neste uke skal vi reise til Bergen", en: "Next week we're going to travel to Bergen" },
  ],
  B1: [
    { no: "Selv om det regnet gikk vi en tur", en: "Even though it rained we went for a walk" },
    { no: "Jeg tror at dette er en god idé", en: "I think that this is a good idea" },
    { no: "Etter at hun hadde spist gikk hun hjem", en: "After she had eaten she went home" },
    { no: "Dersom du har tid kan vi møtes i morgen", en: "If you have time we can meet tomorrow" },
  ],
  B2: [
    { no: "På den ene siden er det dyrt men på den andre siden sparer det tid", en: "On one hand it's expensive but on the other hand it saves time" },
    { no: "Det er viktig at alle får si sin mening", en: "It's important that everyone gets to share their opinion" },
    { no: "Til tross for utfordringene fullførte de prosjektet i tide", en: "Despite the challenges they completed the project on time" },
    { no: "Jo mer man øver desto bedre blir man", en: "The more you practice the better you get" },
  ],
};

const DICTATION_SENTENCES = {
  A1: [
    { no: "Klokka er ti på morgenen.", en: "It's ten in the morning." },
    { no: "Jeg liker å drikke kaffe.", en: "I like to drink coffee." },
    { no: "Det er kaldt ute i dag.", en: "It's cold outside today." },
  ],
  A2: [
    { no: "Vi må handle mat før butikken stenger.", en: "We need to buy food before the shop closes." },
    { no: "Hun jobber på et sykehus i sentrum.", en: "She works at a hospital downtown." },
    { no: "Bussen kommer vanligvis presis klokka ni.", en: "The bus usually arrives right at nine." },
  ],
  B1: [
    { no: "Vi bør bestille bord på forhånd fordi restauranten ofte er full.", en: "We should book a table in advance because the restaurant is often full." },
    { no: "Han fortalte at han skulle flytte til en annen by neste år.", en: "He said he was going to move to another city next year." },
    { no: "Dersom det blir dårlig vær, avlyser vi turen.", en: "If the weather turns bad, we'll cancel the trip." },
  ],
  B2: [
    { no: "Myndighetene har innført nye regler for å redusere forurensning i storbyene.", en: "The authorities have introduced new rules to reduce pollution in the cities." },
    { no: "Selv de mest erfarne ekspertene var uenige om konsekvensene.", en: "Even the most experienced experts disagreed about the consequences." },
    { no: "Det er ikke alltid lett å skille mellom fakta og meninger i nyhetene.", en: "It's not always easy to distinguish between facts and opinions in the news." },
  ],
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalizeForCompare(s) {
  return s.toLowerCase().replace(/[.,!?]/g, "").replace(/\s+/g, " ").trim();
}

function SentenceBuilder({ level, voiceInfo }) {
  const items = SENTENCE_BUILDER[level.id] || [];
  const [idx, setIdx] = useState(0);
  const item = items[idx];
  const tokens = React.useMemo(() => shuffle(item.no.split(" ").map((w, i) => ({ w, key: `${idx}-${i}` }))), [idx]);
  const [pool, setPool] = useState(tokens);
  const [chosen, setChosen] = useState([]);
  const [checked, setChecked] = useState(null);

  useEffect(() => { setPool(tokens); setChosen([]); setChecked(null); }, [idx]);

  function pick(token) {
    if (checked === "correct") return;
    setPool((p) => p.filter((t) => t.key !== token.key));
    setChosen((c) => [...c, token]);
  }
  function unpick(token) {
    if (checked === "correct") return;
    setChosen((c) => c.filter((t) => t.key !== token.key));
    setPool((p) => [...p, token]);
  }
  function check() {
    const built = chosen.map((t) => t.w).join(" ");
    setChecked(normalizeForCompare(built) === normalizeForCompare(item.no) ? "correct" : "wrong");
  }
  function reset() {
    setPool(tokens); setChosen([]); setChecked(null);
  }
  function next() {
    setIdx((i) => (i + 1) % items.length);
  }

  return (
    <div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>Setning {idx + 1} / {items.length}</div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>{item.en}</div>

      <div style={{ minHeight: 52, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        {chosen.length === 0 && <span style={{ fontSize: 12.5, color: C.muted, fontStyle: "italic" }}>Trykk på ordene under i riktig rekkefølge</span>}
        {chosen.map((t) => (
          <button key={t.key} onClick={() => unpick(t)} style={{ background: checked === "correct" ? C.greenBg : C.bg, border: `1px solid ${checked === "correct" ? C.green : C.border}`, borderRadius: 8, padding: "6px 12px", fontSize: 14, cursor: "pointer", color: C.ink }}>
            {t.w}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
        {pool.map((t) => (
          <button key={t.key} onClick={() => pick(t)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 12px", fontSize: 14, cursor: "pointer", color: C.ink }}>
            {t.w}
          </button>
        ))}
      </div>

      {checked === "wrong" && (
        <div style={{ fontSize: 12.5, color: C.red, marginBottom: 12 }}>Ikke helt riktig ennå — prøv å bytte om på ordene.</div>
      )}
      {checked === "correct" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.green, fontWeight: 600, marginBottom: 12 }}>
          <Check size={15} /> Riktig! <SpeakButton text={item.no} voiceInfo={voiceInfo} />
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        {checked !== "correct" ? (
          <>
            <button onClick={check} disabled={chosen.length === 0} style={{ background: chosen.length ? C.navy : "#EFEDE4", color: chosen.length ? "#fff" : C.muted, border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13.5, fontWeight: 600, cursor: chosen.length ? "pointer" : "default" }}>Sjekk</button>
            <button onClick={reset} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: C.muted, cursor: "pointer" }}>Nullstill</button>
          </>
        ) : (
          <button onClick={next} style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>Neste setning →</button>
        )}
      </div>
    </div>
  );
}

function Dictation({ level, voiceInfo }) {
  const items = DICTATION_SENTENCES[level.id] || [];
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [checked, setChecked] = useState(null);
  const item = items[idx];

  function check() {
    setChecked(normalizeForCompare(input) === normalizeForCompare(item.no) ? "correct" : "wrong");
  }
  function next() {
    setIdx((i) => (i + 1) % items.length);
    setInput("");
    setChecked(null);
  }

  return (
    <div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>Setning {idx + 1} / {items.length}</div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 18px", textAlign: "center", marginBottom: 16 }}>
        <SpeakButton text={item.no} voiceInfo={voiceInfo} size={22} />
        <div style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>Trykk for å høre setningen — så mange ganger du trenger</div>
      </div>

      <textarea
        value={input}
        onChange={(e) => { setInput(e.target.value); setChecked(null); }}
        placeholder="Skriv det du hører ..."
        rows={2}
        style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${checked === "wrong" ? C.red : checked === "correct" ? C.green : C.border}`, borderRadius: 8, padding: "10px 12px", fontSize: 14, fontFamily: "inherit", resize: "vertical", marginBottom: 12 }}
      />

      {checked === "wrong" && (
        <div style={{ fontSize: 12.5, color: C.red, lineHeight: 1.6, marginBottom: 12 }}>
          Ikke helt riktig. Riktig setning: <strong style={{ color: C.ink }}>{item.no}</strong>
        </div>
      )}
      {checked === "correct" && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.green, fontWeight: 600, marginBottom: 12 }}>
          <Check size={15} /> Riktig!
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        {checked !== "correct" ? (
          <button onClick={check} disabled={!input.trim()} style={{ background: input.trim() ? C.navy : "#EFEDE4", color: input.trim() ? "#fff" : C.muted, border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13.5, fontWeight: 600, cursor: input.trim() ? "pointer" : "default" }}>Sjekk</button>
        ) : (
          <button onClick={next} style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>Neste setning →</button>
        )}
      </div>
    </div>
  );
}

function ExerciseSection({ level, voiceInfo }) {
  const [sub, setSub] = useState("bygg");
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
        {[{ id: "bygg", label: "Setningsbygging" }, { id: "diktat", label: "Diktat" }].map((s) => {
          const active = sub === s.id;
          return (
            <button key={s.id} onClick={() => setSub(s.id)} style={{ padding: "6px 12px", borderRadius: 20, border: `1px solid ${active ? level.color : C.border}`, background: active ? level.color : "transparent", color: active ? "#fff" : C.muted, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
              {s.label}
            </button>
          );
        })}
      </div>
      {sub === "bygg" && <SentenceBuilder level={level} voiceInfo={voiceInfo} />}
      {sub === "diktat" && <Dictation level={level} voiceInfo={voiceInfo} />}
    </div>
  );
}

function useStopwatch() {
  const [ms, setMs] = useState(0);
  const [running, setRunning] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (running) ref.current = setInterval(() => setMs((m) => m + 100), 100);
    else clearInterval(ref.current);
    return () => clearInterval(ref.current);
  }, [running]);
  function reset() { setMs(0); setRunning(false); }
  const label = `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;
  return { label, running, start: () => setRunning(true), stop: () => setRunning(false), reset };
}

function pickRecorderMimeType() {
  if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) return "";
  const candidates = ["audio/webm", "audio/mp4", "audio/ogg", "audio/wav"];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c;
  }
  return "";
}

function Recorder({ text = null, voiceInfo = null, label = "Ta opp deg selv" }) {
  const [status, setStatus] = useState("idle");
  const [url, setUrl] = useState(null);
  const [error, setError] = useState(null);
  const [comparing, setComparing] = useState(false);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const audioRef = useRef(null);

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickRecorderMimeType();
      const rec = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => chunksRef.current.push(e.data);
      rec.onstop = () => {
        // Use the recorder's own negotiated mimetype (Safari/iOS produces audio/mp4, not webm)
        // rather than hardcoding one, so playback doesn't silently fail on Apple devices.
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || mimeType || "audio/webm" });
        setUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      rec.start();
      mediaRef.current = rec;
      setStatus("recording");
    } catch (e) {
      setError("Couldn't access the microphone here — this sandbox may not allow it. Try recording with your phone's voice memo app instead, then play it back to check yourself.");
      setStatus("idle");
    }
  }
  function stop() {
    mediaRef.current && mediaRef.current.stop();
    setStatus("done");
  }

  function compare() {
    if (!url || !text || !voiceInfo || !voiceInfo.supported || comparing) return;
    setComparing(true);
    window.speechSynthesis.cancel();
    speakLine(text, voiceInfo.norwegian, 1, () => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        const p = audioRef.current.play();
        if (p && p.catch) p.catch(() => setComparing(false));
        audioRef.current.onended = () => setComparing(false);
      } else {
        setComparing(false);
      }
    });
  }

  const canCompare = !!(text && voiceInfo && voiceInfo.supported && url);

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {status !== "recording" ? (
          <button onClick={start} style={{ display: "flex", alignItems: "center", gap: 6, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: C.ink }}>
            <Mic size={14} color={C.red} /> {label}
          </button>
        ) : (
          <button onClick={stop} style={{ display: "flex", alignItems: "center", gap: 6, background: C.red, border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#fff" }}>
            <Square size={13} /> Stopp opptak
          </button>
        )}
        {canCompare && (
          <button onClick={compare} disabled={comparing} style={{ display: "flex", alignItems: "center", gap: 6, background: comparing ? "#EFEDE4" : C.navy, border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: comparing ? "default" : "pointer", color: comparing ? C.muted : "#fff" }}>
            <Repeat size={13} /> {comparing ? "Spiller ..." : "Sammenlign: norsk → deg"}
          </button>
        )}
      </div>
      {error && <div style={{ fontSize: 12, color: C.muted, marginTop: 8, lineHeight: 1.5 }}>{error}</div>}
      {url && (
        <div style={{ marginTop: 10 }}>
          <audio ref={audioRef} controls src={url} style={{ width: "100%", height: 36 }} />
        </div>
      )}
    </div>
  );
}

const SPEAKING_FEEDBACK_SYSTEM = `You are coaching Norwegian learners preparing for the Norskprøven oral exam (HK-dir's official spoken test, CEFR A1–B2, live with a human examiner). For each submission you'll receive the speaking prompt and a typed-up version of roughly what the learner said out loud.

Give feedback in English on this as SPOKEN Norwegian, not formal writing:
- Note where it sounds natural and conversational versus stiff or overly written (a common issue for learners who studied mostly from books).
- Flag 2-3 grammar or word-choice issues with quick, actionable fixes.
- Give one tip for sounding more confident and fluent when saying this aloud — pacing, connector words, or a specific phrase to lean on.

Keep the whole response under 180 words. Be encouraging but specific — vague praise doesn't help someone walking into a live exam.`;

function SpeakingFeedback({ prompt }) {
  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function getFeedback() {
    setLoading(true); setError(null); setFeedback(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 800,
          system: [
            { type: "text", text: SPEAKING_FEEDBACK_SYSTEM, cache_control: { type: "ephemeral" } },
          ],
          messages: [{
            role: "user",
            content: `Speaking prompt: "${prompt}"\n\nWhat they said (typed up):\n\n"${text}"`,
          }],
        }),
      });
      const data = await res.json();
      const txt = (data.content || []).filter((c) => c.type === "text").map((c) => c.text).join("\n");
      if (!txt) throw new Error("empty");
      setFeedback(txt);
    } catch (e) {
      setError("Couldn't get feedback right now — try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: 14 }}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Skriv omtrent det du sa høyt (valgfritt) ..."
        rows={3}
        style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", fontSize: 13.5, fontFamily: "inherit", resize: "vertical" }}
      />
      <button onClick={getFeedback} disabled={loading || text.trim().length === 0} style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, background: text.trim().length === 0 ? "#EFEDE4" : C.navy, color: text.trim().length === 0 ? C.muted : "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: text.trim().length === 0 ? "default" : "pointer" }}>
        {loading ? <><Loader2 size={14} className="spin" /> Vurderer ...</> : "Få tilbakemelding på det muntlige"}
      </button>
      {error && <div style={{ marginTop: 8, fontSize: 12.5, color: C.red }}>{error}</div>}
      {feedback && (
        <div style={{ marginTop: 10, background: C.greenBg, border: `1px solid ${C.green}`, borderRadius: 10, padding: "12px 14px", fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-line", color: "#2E4A38" }}>
          {feedback}
        </div>
      )}
    </div>
  );
}

function PhraseRow({ p, voiceInfo }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 14px" }}>
      <div>
        <div style={{ fontFamily: "ui-serif, Georgia, serif", fontSize: 14.5, fontWeight: 600 }}>{p.no}</div>
        <div style={{ fontSize: 12.5, color: C.muted, marginTop: 2 }}>{p.en}</div>
      </div>
      <SpeakButton text={p.no} voiceInfo={voiceInfo} />
    </div>
  );
}

function RepairBank({ voiceInfo }) {
  return (
    <div>
      <div style={{ background: C.goldBg, border: `1px solid ${C.gold}`, borderRadius: 10, padding: "14px 16px", marginBottom: 18, fontSize: 12.5, color: "#5C4718", lineHeight: 1.7 }}>
        <strong style={{ display: "block", marginBottom: 4 }}>Freezing isn't failing</strong>
        Everyone runs out of words in the exam. What separates a pass from a stumble is staying in the conversation — asking for a repeat, buying yourself a second to think, or looping back with a connector. Drill these until they're reflexes, not lookups.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {REPAIR_PHRASES.map((g) => (
          <div key={g.id}>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontFamily: "ui-serif, Georgia, serif", fontSize: 16, fontWeight: 700 }}>{g.group}</div>
              <div style={{ fontSize: 12, color: C.muted }}>{g.when}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {g.items.map((p, i) => <PhraseRow key={i} p={p} voiceInfo={voiceInfo} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PictureDescription({ voiceInfo }) {
  const [idx, setIdx] = useState(0);
  const scene = PICTURE_SCENES[idx];
  const Icon = scene.icon;

  return (
    <div>
      <div style={{ background: C.goldBg, border: `1px solid ${C.gold}`, borderRadius: 10, padding: "14px 16px", marginBottom: 18, fontSize: 12.5, color: "#5C4718", lineHeight: 1.7 }}>
        <strong style={{ display: "block", marginBottom: 4 }}>Oppgave B: describe a picture</strong>
        The examiner shows you a real photo and asks "Hva ser du på bildet?". These scenes are stand-ins for practice — the phrases below work on almost any everyday photo you actually get.
      </div>

      <div style={{ fontSize: 12, letterSpacing: 1, color: C.muted, textTransform: "uppercase", margin: "0 0 8px 2px" }}>Alltid nyttige</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        {GENERIC_DESCRIBE_PHRASES.map((p, i) => <PhraseRow key={i} p={p} voiceInfo={voiceInfo} />)}
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 20px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{ width: 56, height: 56, borderRadius: 12, background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon size={26} color={C.navy} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontFamily: "ui-serif, Georgia, serif", fontSize: 16.5, fontWeight: 700 }}>{scene.no}</span>
              <SpeakButton text={scene.no} voiceInfo={voiceInfo} />
            </div>
            <div style={{ fontSize: 12.5, color: C.muted }}>{scene.en}</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 600, marginBottom: 12 }}>
          «Hva ser du på bildet?» <SpeakButton text="Hva ser du på bildet?" voiceInfo={voiceInfo} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 4 }}>
          {scene.phrases.map((p, i) => <PhraseRow key={i} p={p} voiceInfo={voiceInfo} />)}
        </div>

        <Recorder text={scene.phrases[0].no} voiceInfo={voiceInfo} label="Beskriv bildet høyt" />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
          <span style={{ fontSize: 12, color: C.muted }}>{idx + 1} / {PICTURE_SCENES.length}</span>
          <button
            onClick={() => setIdx((i) => (i + 1) % PICTURE_SCENES.length)}
            style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 14px", fontSize: 13, color: C.ink, cursor: "pointer" }}
          >
            Neste bilde →
          </button>
        </div>
      </div>
    </div>
  );
}

function PersonalPhrasebook({ level, voiceInfo }) {
  const [phrases, setPhrases] = useState([]);
  const [input, setInput] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    (async () => {
      const list = await loadPersonalPhrases(level.id);
      if (!cancelled) { setPhrases(list); setLoaded(true); }
    })();
    return () => { cancelled = true; };
  }, [level.id]);

  function add() {
    const t = input.trim();
    if (!t) return;
    const next = [...phrases, t];
    setPhrases(next);
    savePersonalPhrases(level.id, next);
    setInput("");
  }
  function remove(i) {
    const next = phrases.filter((_, idx2) => idx2 !== i);
    setPhrases(next);
    savePersonalPhrases(level.id, next);
  }

  return (
    <div>
      <div style={{ background: C.goldBg, border: `1px solid ${C.gold}`, borderRadius: 10, padding: "14px 16px", marginBottom: 18, fontSize: 12.5, color: "#5C4718", lineHeight: 1.7 }}>
        <strong style={{ display: "block", marginBottom: 4 }}>Oppgave A is about your actual life</strong>
        Your job, your street, your family — not a textbook example. Type real sentences about yourself below; each one gets native pronunciation and stays here as your own drill deck for this level.
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") add(); }}
          placeholder="Skriv en setning om deg selv ..."
          style={{ flex: 1, boxSizing: "border-box", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", fontSize: 13.5, fontFamily: "inherit" }}
        />
        <button
          onClick={add}
          disabled={!input.trim()}
          style={{ display: "flex", alignItems: "center", gap: 6, background: input.trim() ? C.navy : "#EFEDE4", color: input.trim() ? "#fff" : C.muted, border: "none", borderRadius: 8, padding: "0 16px", fontSize: 13, fontWeight: 600, cursor: input.trim() ? "pointer" : "default" }}
        >
          <Plus size={14} /> Legg til
        </button>
      </div>

      {loaded && phrases.length === 0 && (
        <div style={{ fontSize: 12.5, color: C.muted, fontStyle: "italic" }}>Ingen egne setninger ennå — legg til den første over.</div>
      )}
      {phrases.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {phrases.map((p, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px" }}>
              <span style={{ fontSize: 14, flex: 1 }}>{p}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                <SpeakButton text={p} voiceInfo={voiceInfo} />
                <button onClick={() => remove(i)} title="Fjern" style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "inline-flex" }}>
                  <X size={14} color={C.muted} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function conversationSystemPrompt(level) {
  return `You are a friendly Norwegian conversation partner helping a learner at CEFR level ${level.id} practice for the Norskprøven oral exam's paired-conversation task. Speak ONLY in Norwegian Bokmål, at vocabulary and grammar complexity appropriate for ${level.id}. Keep every reply short — 1 to 3 sentences, like natural spoken dialogue, never a written essay. Ask a natural follow-up question after most replies, the way a real conversation partner would, about everyday topics (family, work, weekend, hobbies, hometown, plans, food). Don't correct the learner's grammar mid-conversation unless they explicitly ask if something was correct — a real exam conversation flows without interruption. Never break character, never switch to English.`;
}

const CONVERSATION_EVAL_SYSTEM = `You are assessing a transcript of a Norwegian learner's conversation practice for the Norskprøven oral exam, based on HK-dir's public grading criteria for the speaking test: fluency, pronunciation, vocabulary, and grammar. You only have the text transcript, not audio, so explicitly note that pronunciation can't be judged from text and should be checked separately (e.g. against native audio in this app). Give feedback in English as plain text, one short paragraph each for fluency, vocabulary, and grammar, based only on the learner's turns, plus one closing tip. Keep the whole response under 200 words. Be honest but encouraging.`;

function ConversationPartner({ level, voiceInfo }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [evaluating, setEvaluating] = useState(false);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const history = [...messages, { role: "user", content: text }];
    setMessages(history);
    setInput("");
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 300,
          system: [
            { type: "text", text: conversationSystemPrompt(level), cache_control: { type: "ephemeral" } },
          ],
          messages: history,
        }),
      });
      const data = await res.json();
      const txt = (data.content || []).filter((c) => c.type === "text").map((c) => c.text).join("\n");
      if (!txt) throw new Error("empty");
      setMessages((m) => [...m, { role: "assistant", content: txt }]);
    } catch (e) {
      setError("Samtalepartneren svarte ikke — prøv igjen om et øyeblikk.");
    } finally {
      setLoading(false);
    }
  }

  async function getEvaluation() {
    if (messages.filter((m) => m.role === "user").length === 0) return;
    setEvaluating(true);
    setError(null);
    try {
      const transcript = messages.map((m) => `${m.role === "user" ? "Learner" : "Partner"}: ${m.content}`).join("\n");
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 600,
          system: [
            { type: "text", text: CONVERSATION_EVAL_SYSTEM, cache_control: { type: "ephemeral" } },
          ],
          messages: [{ role: "user", content: `Level: ${level.id}\n\nTranscript:\n${transcript}` }],
        }),
      });
      const data = await res.json();
      const txt = (data.content || []).filter((c) => c.type === "text").map((c) => c.text).join("\n");
      if (!txt) throw new Error("empty");
      setEvaluation(txt);
    } catch (e) {
      setError("Couldn't get an evaluation right now — try again in a moment.");
    } finally {
      setEvaluating(false);
    }
  }

  function restart() {
    setMessages([]);
    setEvaluation(null);
    setError(null);
    setInput("");
  }

  return (
    <div>
      <div style={{ background: C.goldBg, border: `1px solid ${C.gold}`, borderRadius: 10, padding: "14px 16px", marginBottom: 16, fontSize: 12.5, color: "#5C4718", lineHeight: 1.7 }}>
        <strong style={{ display: "block", marginBottom: 4 }}>An open-ended conversation partner</strong>
        Unlike the fixed prompts above, this replies dynamically in Norwegian and asks natural follow-ups — closer to the live back-and-forth of the actual paired-conversation exam task. Type your replies; end whenever you like for a short evaluation.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14, maxHeight: 360, overflowY: "auto" }}>
        {messages.length === 0 && (
          <div style={{ fontSize: 12.5, color: C.muted, fontStyle: "italic" }}>Skriv noe for å starte samtalen — for eksempel "Hei! Hvordan går det?"</div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "80%", background: m.role === "user" ? C.navy : C.card, color: m.role === "user" ? "#fff" : C.ink,
              border: m.role === "user" ? "none" : `1px solid ${C.border}`, borderRadius: 12, padding: "9px 13px", fontSize: 14, lineHeight: 1.5,
            }}>
              {m.content}
              {m.role === "assistant" && <span style={{ marginLeft: 6, verticalAlign: -3 }}><SpeakButton text={m.content} voiceInfo={voiceInfo} /></span>}
            </div>
          </div>
        ))}
        {loading && <div style={{ fontSize: 12.5, color: C.muted, display: "flex", alignItems: "center", gap: 6 }}><Loader2 size={13} className="spin" /> Skriver ...</div>}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          placeholder="Skriv svaret ditt på norsk ..."
          style={{ flex: 1, boxSizing: "border-box", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", fontSize: 13.5, fontFamily: "inherit" }}
        />
        <button onClick={send} disabled={loading || !input.trim()} style={{ background: input.trim() && !loading ? C.navy : "#EFEDE4", color: input.trim() && !loading ? "#fff" : C.muted, border: "none", borderRadius: 8, padding: "0 16px", fontSize: 13, fontWeight: 600, cursor: input.trim() && !loading ? "pointer" : "default" }}>
          Send
        </button>
      </div>

      {error && <div style={{ fontSize: 12.5, color: C.red, marginBottom: 10 }}>{error}</div>}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          onClick={getEvaluation}
          disabled={evaluating || messages.filter((m) => m.role === "user").length === 0}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 14px", fontSize: 13, color: C.ink, cursor: "pointer" }}
        >
          {evaluating ? <><Loader2 size={13} className="spin" /> Vurderer ...</> : "Avslutt og få vurdering"}
        </button>
        {messages.length > 0 && (
          <button onClick={restart} style={{ background: "none", border: "none", color: C.muted, fontSize: 12.5, cursor: "pointer" }}>Start på nytt</button>
        )}
      </div>

      {evaluation && (
        <div style={{ marginTop: 14, background: C.greenBg, border: `1px solid ${C.green}`, borderRadius: 10, padding: "14px 16px", fontSize: 13.5, lineHeight: 1.6, whiteSpace: "pre-line", color: "#2E4A38" }}>
          {evaluation}
        </div>
      )}
    </div>
  );
}

const SNAKK_SUBTABS = [
  { id: "oppgave", label: "Øv på oppgave" },
  { id: "samtale", label: "Samtale" },
  { id: "bilde", label: "Beskriv bilde" },
  { id: "frys", label: "Hvis du fryser" },
  { id: "egne", label: "Egne setninger" },
];

function SpeakingPractice({ level, voiceInfo }) {
  const prompts = SPEAKING_PROMPTS[level.id] || [];
  const [idx, setIdx] = useState(0);
  const [subTab, setSubTab] = useState("oppgave");
  const sw = useStopwatch();
  const prompt = prompts[idx];

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {SNAKK_SUBTABS.map((s) => {
          const active = subTab === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setSubTab(s.id)}
              style={{
                padding: "6px 12px", borderRadius: 20, border: `1px solid ${active ? level.color : C.border}`,
                background: active ? level.color : "transparent", color: active ? "#fff" : C.muted,
                fontSize: 12.5, fontWeight: 600, cursor: "pointer",
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {subTab === "oppgave" && (
        <div>
          <div style={{ background: C.goldBg, border: `1px solid ${C.gold}`, borderRadius: 10, padding: "14px 16px", marginBottom: 18, fontSize: 12.5, color: "#5C4718", lineHeight: 1.7 }}>
            <strong style={{ display: "block", marginBottom: 4 }}>Building confidence for the oral exam</strong>
            The Norskprøven oral is live with an examiner, sometimes alongside another candidate — it rewards clear communication, not perfect grammar. Shadowing (listen to a line, repeat it immediately in the same rhythm) trains your mouth and ear together. Speak daily in short bursts rather than rarely in long ones, and treat mistakes as expected — that's literally what the level below in this app teaches: "ikke være redd for å gjøre feil."
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px 18px 20px" }}>
            <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Snakk høyt i 1–2 minutter</div>
            <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.5, marginBottom: 14, display: "flex", justifyContent: "space-between", gap: 10 }}>
              <span>{prompt}</span>
              <SpeakButton text={prompt} voiceInfo={voiceInfo} size={16} />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <div style={{ fontFamily: "ui-mono, monospace", fontSize: 20, fontWeight: 700, color: C.navy, minWidth: 56 }}>{sw.label}</div>
              {!sw.running ? (
                <button onClick={sw.start} style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Start</button>
              ) : (
                <button onClick={sw.stop} style={{ background: C.red, color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Stopp</button>
              )}
              <button onClick={sw.reset} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 12px", fontSize: 12.5, color: C.muted, cursor: "pointer" }}>Nullstill</button>
            </div>

            <Recorder text={prompt} voiceInfo={voiceInfo} />
            <SpeakingFeedback prompt={prompt} />

            <button
              onClick={() => { setIdx((i) => (i + 1) % prompts.length); sw.reset(); }}
              style={{ marginTop: 16, background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 14px", fontSize: 13, color: C.ink, cursor: "pointer" }}
            >
              Neste oppgave →
            </button>
          </div>
        </div>
      )}

      {subTab === "samtale" && <ConversationPartner level={level} voiceInfo={voiceInfo} />}
      {subTab === "bilde" && <PictureDescription voiceInfo={voiceInfo} />}
      {subTab === "frys" && <RepairBank voiceInfo={voiceInfo} />}
      {subTab === "egne" && <PersonalPhrasebook level={level} voiceInfo={voiceInfo} />}
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("home");
  const [levelId, setLevelId] = useState(null);
  const [testId, setTestId] = useState(null);
  const [evalId, setEvalId] = useState(null);
  const [tab, setTab] = useState("vocab");
  const [openPairs, setOpenPairs] = useState({});
  const [progress, setProgress] = useState({ xp: 0, badges: [], quizBest: {}, sampleBest: {}, streak: 0, lastVisit: null, leitner: {}, quizMisses: {}, onboarded: false, targetPair: null, examDate: null, srsReviewCount: 0 });
  const [showSetup, setShowSetup] = useState(false);
  const [ready, setReady] = useState(false);
  const [theme, setTheme] = useState("light");
  const voiceInfo = useNorwegianVoices();

  useEffect(() => {
    (async () => {
      const t = await loadTheme();
      setTheme(t);
    })();
  }, []);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    saveTheme(next);
  }

  useEffect(() => {
    (async () => {
      const p = await loadProgress();
      const today = new Date().toISOString().slice(0, 10);
      if (p.lastVisit !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        p.streak = p.lastVisit === yesterday ? p.streak + 1 : 1;
        p.lastVisit = today;
        if (p.streak >= 3 && !p.badges.includes("streak3")) p.badges = [...p.badges, "streak3"];
      }
      setProgress(p);
      setReady(true);
      saveProgress(p);
    })();
  }, []);

  function updateProgress(mutator) {
    setProgress((prev) => {
      const next = mutator({
        ...prev,
        badges: [...prev.badges],
        quizBest: { ...prev.quizBest },
        sampleBest: { ...prev.sampleBest },
        leitner: { ...(prev.leitner || {}) },
        quizMisses: { ...(prev.quizMisses || {}) },
      });
      saveProgress(next);
      return next;
    });
  }

  function addXP(amount) {
    updateProgress((p) => ({ ...p, xp: p.xp + amount }));
  }

  function awardBadge(id) {
    updateProgress((p) => (p.badges.includes(id) ? p : { ...p, badges: [...p.badges, id] }));
  }

  function handleQuizFinish(level, score, missed, total, isReview, attemptedIndices) {
    addXP(isReview ? score * 5 : score * 10);
    if (!isReview) {
      if (score === level.quiz.length) awardBadge("perfect");
      updateProgress((p) => {
        const cur = p.quizBest[level.id] ?? -1;
        const isFirst = Object.keys(p.quizBest).length === 0 && cur < 0;
        const next = { ...p, quizBest: { ...p.quizBest, [level.id]: Math.max(cur, score) } };
        if (isFirst) next.badges = [...next.badges, "first_dive"].filter((v, i, a) => a.indexOf(v) === i);
        if (score >= Math.ceil(level.quiz.length * 0.75)) {
          const badgeId = `${level.id.toLowerCase()}_mastered`;
          if (!next.badges.includes(badgeId)) next.badges = [...next.badges, badgeId];
        }
        return next;
      });
    }
    updateProgress((p) => {
      const levelMisses = { ...(p.quizMisses[level.id] || {}) };
      (attemptedIndices || []).forEach((i) => {
        if (missed.includes(i)) levelMisses[i] = (levelMisses[i] || 0) + 1;
        else delete levelMisses[i];
      });
      return { ...p, quizMisses: { ...p.quizMisses, [level.id]: levelMisses } };
    });
  }

  function recordLeitner(levelId, wordKey, knew) {
    updateProgress((p) => {
      const levelState = { ...(p.leitner[levelId] || {}) };
      const cur = levelState[wordKey] || { box: 0, due: new Date().toISOString() };
      const box = knew ? Math.min((cur.box || 0) + 1, 3) : 1;
      const days = knew ? [1, 3, 7][box - 1] : 0;
      const due = new Date(Date.now() + days * 86400000).toISOString();
      levelState[wordKey] = { box, due };
      const leitner = { ...p.leitner, [levelId]: levelState };
      const srsReviewCount = (p.srsReviewCount || 0) + 1;

      let badges = p.badges;
      if (srsReviewCount === 1 && !badges.includes("srs_first")) badges = [...badges, "srs_first"];
      if (srsReviewCount >= 10 && !badges.includes("srs_10")) badges = [...badges, "srs_10"];
      const masteredCount = Object.values(leitner).reduce(
        (sum, lvlState) => sum + Object.values(lvlState).filter((w) => w.box >= 3).length,
        0
      );
      if (masteredCount >= 10 && !badges.includes("srs_mastered10")) badges = [...badges, "srs_mastered10"];

      return { ...p, leitner, srsReviewCount, badges };
    });
  }

  function handleSampleComplete(id, results) {
    awardBadge("sample_test");
    updateProgress((p) => ({ ...p, sampleBest: { ...p.sampleBest, [id]: results } }));
  }

  function handleEvalComplete() {
    awardBadge("evaluated");
  }

  function openLevel(id) { setLevelId(id); setTab("vocab"); setScreen("level"); }
  function openTest(id) { setTestId(id); setScreen("test"); }
  function togglePair(pair) { setOpenPairs((p) => ({ ...p, [pair]: !p[pair] })); }
  function openEval(id) { setEvalId(id); setScreen("eval"); }

  function saveSetup({ targetPair, examDate }) {
    updateProgress((p) => ({ ...p, targetPair, examDate, onboarded: true }));
    setShowSetup(false);
  }

  const level = LEVELS.find((l) => l.id === levelId);
  const test = SAMPLE_TESTS.find((t) => t.id === testId);
  const evalData = evalId ? EVALUATIONS[evalId] : null;
  const dueCount = level ? dueWords(level, progress.leitner[level.id] || {}).length : 0;

  if (!ready) return null;

  applyTheme(theme);

  const needsOnboarding = !progress.onboarded || showSetup;

  return (
    <div style={{ fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif", background: C.bg, minHeight: 600, padding: "28px 20px 40px", color: C.ink }}>
      <style>{`.spin { animation: spin 0.8s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {needsOnboarding && (
        <OnboardingModal onComplete={saveSetup} initialPair={progress.targetPair} initialDate={progress.examDate || ""} />
      )}
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        {screen === "home" && (
          <>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: -6 }}>
              <button
                onClick={toggleTheme}
                title={theme === "light" ? "Bytt til mørk modus" : "Bytt til lys modus"}
                style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${C.border}`, borderRadius: 20, padding: "6px 12px", fontSize: 12, color: C.muted, cursor: "pointer" }}
              >
                {theme === "light" ? <Moon size={13} /> : <Sun size={13} />} {theme === "light" ? "Mørk" : "Lys"}
              </button>
            </div>
            <div style={{ textAlign: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 12, letterSpacing: 2, color: C.muted, textTransform: "uppercase", marginBottom: 6 }}>Norsk for Norskprøven</div>
              <h1 style={{ fontFamily: "ui-serif, Georgia, serif", fontSize: 34, fontWeight: 700, margin: 0, color: C.navyDeep }}>Dypdykk</h1>
              <p style={{ fontSize: 14, color: C.muted, maxWidth: 380, margin: "10px auto 0", lineHeight: 1.6 }}>
                Norskprøven grades reading, listening, writing, and speaking separately, each landing anywhere from A1 to B2.
              </p>
            </div>

            <ExamCountdown progress={progress} onEdit={() => setShowSetup(true)} />
            <StatBar progress={progress} />
            <VoiceSetupBanner voiceInfo={voiceInfo} />
            <BadgeShelf progress={progress} />

            <div style={{ margin: "8px 0 28px" }}>
              <FjordGauge levels={LEVELS} quizBest={progress.quizBest} activeId={levelId} onSelect={openLevel} />
            </div>

            <div style={{
              background: C.card, border: `1px solid ${C.gold}`, borderRadius: 10,
              padding: "13px 16px", marginBottom: 10, fontSize: 12.5, color: C.body, lineHeight: 1.6,
            }}>
              <strong style={{ color: C.ink }}>Official source:</strong>{" "}
              <a href="https://prove.hkdir.no/en/norwegian-language-test-a1-b2/practice-for-test-norwegian-language-a1-b2" target="_blank" rel="noopener noreferrer" style={{ color: C.navy, fontWeight: 600 }}>
                HK-dir's own practice page
              </a>{" "}
              has real sample tasks for each part of the exam, straight from the body that runs Norskprøven. Their sample tasks are Norwegian-only and only work on a computer, not mobile — this app is a mobile-friendly, bilingual complement, not a substitute.
            </div>

            <div style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
              padding: "13px 16px", marginBottom: 20, fontSize: 12.5, color: C.muted, lineHeight: 1.6,
            }}>
              For more listening audio specifically, pair this app with{" "}
              <a href="https://www.ntnu.edu/learnnow" target="_blank" rel="noopener noreferrer" style={{ color: C.navy, fontWeight: 600 }}>NTNU LearnNoW</a>,
              a free official beginner course (A1–A2) with dialogues and audio exercises.
            </div>

            <div style={{ fontSize: 12, letterSpacing: 1, color: C.muted, textTransform: "uppercase", margin: "0 0 10px 2px" }}>Nivåer</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 28 }}>
              {LEVELS.map((lv) => (
                <button key={lv.id} onClick={() => openLevel(lv.id)} style={{ textAlign: "left", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 16px", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: lv.color, display: "inline-block" }} />
                    <span style={{ fontSize: 11, letterSpacing: 1, color: C.muted, textTransform: "uppercase" }}>{lv.cefr}</span>
                  </div>
                  <div style={{ fontFamily: "ui-serif, Georgia, serif", fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{lv.name}</div>
                  <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.5 }}>{lv.blurb}</div>
                  {progress.quizBest[lv.id] !== undefined && <div style={{ marginTop: 8, fontSize: 11.5, color: C.green, fontWeight: 600 }}>Best quiz: {progress.quizBest[lv.id]}/8</div>}
                </button>
              ))}
            </div>

            <div style={{ fontSize: 12, letterSpacing: 1, color: C.muted, textTransform: "uppercase", margin: "0 0 10px 2px" }}>Prøvesett</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[...new Set(SAMPLE_TESTS.map((t) => t.pair))].map((pair) => {
                const testsInPair = SAMPLE_TESTS.filter((t) => t.pair === pair);
                const isOpen = !!openPairs[pair];
                return (
                  <div key={pair}>
                    <button onClick={() => togglePair(pair)} style={{ width: "100%", textAlign: "left", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: testsInPair[0].color, display: "inline-block" }} />
                        <span style={{ fontFamily: "ui-serif, Georgia, serif", fontSize: 16, fontWeight: 700 }}>{pair}</span>
                        <span style={{ fontSize: 12, color: C.muted }}>({testsInPair.length})</span>
                      </span>
                      <ChevronDown size={16} color={C.muted} style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                    </button>
                    {isOpen && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8, marginLeft: 4 }}>
                        {testsInPair.map((t, i) => {
                          const res = progress.sampleBest[t.id];
                          return (
                            <button key={t.id} onClick={() => openTest(t.id)} style={{ textAlign: "left", background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div>
                                <div style={{ fontSize: 13.5, fontWeight: 600 }}>Prøve {i + 1}</div>
                                <div style={{ fontSize: 12, color: C.muted }}>Lesing, lytting og skriving — samme oppsett som Norskprøven</div>
                              </div>
                              {res && <div style={{ fontSize: 11.5, color: C.green, fontWeight: 700, textAlign: "right" }}>L {res.reading}/{t.reading.reduce((s, p) => s + p.questions.length, 0)}<br />Ly {res.listening}/{t.listening.questions.length}</div>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ fontSize: 12, letterSpacing: 1, color: C.muted, textTransform: "uppercase", margin: "24px 0 10px 2px" }}>Vurdering</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {Object.entries(EVALUATIONS).map(([id, ev]) => (
                <button key={id} onClick={() => openEval(id)} style={{ textAlign: "left", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", cursor: "pointer" }}>
                  <div style={{ fontFamily: "ui-serif, Georgia, serif", fontSize: 16, fontWeight: 700, marginBottom: 3 }}>{ev.label}</div>
                  <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{ev.blurb}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {screen === "level" && level && (
          <>
            <button onClick={() => setScreen("home")} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: C.muted, fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 18 }}>
              <ArrowLeft size={15} /> All levels
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: level.color, display: "inline-block" }} />
              <span style={{ fontSize: 12, letterSpacing: 1, color: C.muted, textTransform: "uppercase" }}>{level.cefr}</span>
            </div>
            <h2 style={{ fontFamily: "ui-serif, Georgia, serif", fontSize: 26, fontWeight: 700, margin: "0 0 4px" }}>{level.name}</h2>
            <p style={{ fontSize: 13.5, color: C.muted, margin: "0 0 18px", lineHeight: 1.5 }}>{level.blurb}</p>
            <Contour color={level.color} />
            <div style={{ display: "flex", gap: 6, margin: "18px 0 20px", flexWrap: "wrap" }}>
              {TABS.map((t) => {
                const Icon = t.icon; const active = tab === t.id;
                const label = t.id === "repetisjon" && dueCount > 0 ? `${t.label} (${dueCount})` : t.label;
                return (
                  <button key={t.id} onClick={() => setTab(t.id)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 20, border: `1px solid ${active ? level.color : C.border}`, background: active ? level.color : "transparent", color: active ? "#fff" : C.ink, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    <Icon size={14} /> {label}
                  </button>
                );
              })}
            </div>
            {tab === "vocab" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>{level.vocab.map((v, i) => <VocabCard key={i} item={v} voiceInfo={voiceInfo} />)}</div>}
            {tab === "verb" && <VerbPractice level={level} voiceInfo={voiceInfo} progress={progress} onRate={recordLeitner} />}
            {tab === "repetisjon" && (
              <div>
                <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.6, marginBottom: 16 }}>
                  Ord du sier du kunne dukker sjeldnere opp igjen; ord du ikke visste kommer raskt tilbake. Det er hele poenget med spaced repetition.
                </div>
                <VocabReview level={level} voiceInfo={voiceInfo} progress={progress} onRate={recordLeitner} />
              </div>
            )}
            {tab === "phrases" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {level.phrases.map((p, i) => (
                  <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "13px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                    <div>
                      <div style={{ fontFamily: "ui-serif, Georgia, serif", fontSize: 15.5, fontWeight: 600 }}>{p.no}</div>
                      <div style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>{p.en}</div>
                    </div>
                    <SpeakButton text={p.no} voiceInfo={voiceInfo} />
                  </div>
                ))}
              </div>
            )}
            {tab === "grammar" && <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{level.grammar.map((g, i) => <GrammarCard key={i} item={g} />)}</div>}
            {tab === "ovelser" && <ExerciseSection level={level} voiceInfo={voiceInfo} />}
            {tab === "snakk" && <SpeakingPractice level={level} voiceInfo={voiceInfo} />}
            {tab === "quiz" && (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 20px 22px" }}>
                <QuizSection level={level} progress={progress} onFinish={handleQuizFinish} />
              </div>
            )}
          </>
        )}

        {screen === "test" && test && (
          <SampleTest
            test={test}
            onExit={() => setScreen("home")}
            onXP={addXP}
            onComplete={handleSampleComplete}
            voiceInfo={voiceInfo}
          />
        )}

        {screen === "eval" && evalData && (
          <ProficiencyEvaluation
            evalData={evalData}
            onExit={() => setScreen("home")}
            onXP={addXP}
            onComplete={handleEvalComplete}
            voiceInfo={voiceInfo}
          />
        )}
      </div>
    </div>
  );
}
