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

const SAMPLE_TESTS = [
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
      <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: "#3A3F47", lineHeight: 1.9 }}>
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
      <div style={{ fontSize: 13, color: flipped ? C.navy : C.muted, marginTop: 6, minHeight: 18 }}>{flipped ? item.en : "Tap to reveal"}</div>
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
        <div style={{ fontSize: 14, color: flipped ? C.navy : C.muted }}>{flipped ? word.en : "Trykk for å se oversettelsen"}</div>
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

function GrammarCard({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
      <button onClick={() => setOpen((o) => !o)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>{item.title}</span>
        <ChevronDown size={18} color={C.muted} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 150ms ease", flexShrink: 0 }} />
      </button>
      {open && <div style={{ padding: "0 16px 16px", fontSize: 14, lineHeight: 1.6, color: "#3A3F47" }}>{item.body}</div>}
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
      <div style={{ fontSize: 13.5, color: "#3A3F47", lineHeight: 1.6, marginBottom: 10 }}>{task.prompt}</div>
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
          <p style={{ fontSize: 14, lineHeight: 1.7, color: "#3A3F47" }}>
            This mirrors how Norskprøven is actually structured: you register for a level pair, and reading, listening, and writing are scored independently rather than combined into one grade. Three sections, in order — reading, listening, writing.
          </p>
          <ul style={{ fontSize: 13.5, color: "#3A3F47", lineHeight: 1.9, paddingLeft: 18 }}>
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
              <div style={{ fontSize: 14, lineHeight: 1.7, color: "#3A3F47", marginBottom: 14, fontStyle: "italic" }}>{p.passage}</div>
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
          <p style={{ fontSize: 14, lineHeight: 1.7, color: "#3A3F47" }}>{evalData.blurb}</p>
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
              <div style={{ fontSize: 14, lineHeight: 1.7, color: "#3A3F47", fontStyle: "italic" }}>{p.passage}</div>
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
              <div style={{ fontSize: 13.5, color: "#3A3F47", lineHeight: 1.6 }}>{v.body}</div>
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
              padding: "13px 16px", marginBottom: 10, fontSize: 12.5, color: "#3A3F47", lineHeight: 1.6,
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
              {SAMPLE_TESTS.map((t) => {
                const res = progress.sampleBest[t.id];
                return (
                  <button key={t.id} onClick={() => openTest(t.id)} style={{ textAlign: "left", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: t.color, display: "inline-block" }} />
                        <span style={{ fontFamily: "ui-serif, Georgia, serif", fontSize: 16, fontWeight: 700 }}>{t.pair}</span>
                      </div>
                      <div style={{ fontSize: 12, color: C.muted }}>Lesing, lytting og skriving — samme oppsett som Norskprøven</div>
                    </div>
                    {res && <div style={{ fontSize: 11.5, color: C.green, fontWeight: 700, textAlign: "right" }}>L {res.reading}/4<br />Ly {res.listening}/3</div>}
                  </button>
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
