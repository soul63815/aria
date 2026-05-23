import type { Song } from "./songs";

/** Curated, royalty-free song templates that users can browse and import with one tap. */
export interface CatalogEntry {
  id: string;
  title: string;
  composer: string;
  bpm: number;
  theme: string;
  description: string;
  tags?: string[];
  instruments?: Array<"piano" | "guitar">;
  build: () => Song;
}

const seq = (notes: Array<[string, number]>, theme: string, meta: Omit<Song, "notes" | "theme" | "script">): Song => {
  let t = 0;
  const out = [] as Song["notes"];
  for (let r = 0; r < 3; r++) notes.forEach(([n, d]) => { out.push({ note: n, time: t, duration: d * 0.9 }); t += d; });
  return { ...meta, theme, notes: out, script: notes.map(([n]) => n).join(" ") };
};

export const ONLINE_CATALOG: CatalogEntry[] = [
  {
    id: "online-greensleeves",
    title: "Greensleeves",
    composer: "Traditional, 1580",
    bpm: 90,
    theme: "canon",
    description: "Renaissance ballad — gentle minor melody, perfect for slow practice.",
    build: () => seq(
      [["A4",1],["C5",2],["D5",1],["E5",1.5],["F5",0.5],["E5",1],["D5",2],
       ["B4",1],["G4",1.5],["A4",0.5],["B4",1],["C5",2],["A4",1],["A4",1.5],["G#4",0.5],["A4",1],["B4",2]],
      "canon",
      { id: "import-online-greensleeves", title: "Greensleeves", composer: "Traditional", bpm: 90, description: "Renaissance ballad in A minor." },
    ),
  },
  {
    id: "online-happy-birthday",
    title: "Happy Birthday",
    composer: "Patty & Mildred Hill",
    bpm: 110,
    theme: "ode-to-joy",
    description: "The friendliest 16 bars in music.",
    build: () => seq(
      [["C4",0.75],["C4",0.25],["D4",1],["C4",1],["F4",1],["E4",2],
       ["C4",0.75],["C4",0.25],["D4",1],["C4",1],["G4",1],["F4",2],
       ["C4",0.75],["C4",0.25],["C5",1],["A4",1],["F4",1],["E4",1],["D4",2],
       ["A#4",0.75],["A#4",0.25],["A4",1],["F4",1],["G4",1],["F4",2]],
      "ode-to-joy",
      { id: "import-online-happy-birthday", title: "Happy Birthday", composer: "Patty & Mildred Hill", bpm: 110, description: "Classic celebration melody." },
    ),
  },
  {
    id: "online-jingle-bells",
    title: "Jingle Bells",
    composer: "J. L. Pierpont",
    bpm: 120,
    theme: "moonlight",
    description: "Bright winter standard — easy chorus for any keyboardist.",
    build: () => seq(
      [["E4",1],["E4",1],["E4",2],["E4",1],["E4",1],["E4",2],
       ["E4",1],["G4",1],["C4",1.5],["D4",0.5],["E4",3],
       ["F4",1],["F4",1],["F4",1.5],["F4",0.5],["F4",1],["E4",1],["E4",1],["E4",0.5],["E4",0.5],
       ["E4",1],["D4",1],["D4",1],["E4",1],["D4",2],["G4",2]],
      "moonlight",
      { id: "import-online-jingle-bells", title: "Jingle Bells", composer: "J. L. Pierpont", bpm: 120, description: "Holiday classic." },
    ),
  },
  {
    id: "online-amazing-grace",
    title: "Amazing Grace",
    composer: "John Newton",
    bpm: 70,
    theme: "fur-elise",
    description: "Hymn in 3/4 — slow, warm, healing.",
    build: () => seq(
      [["G4",1],["C5",2],["E5",0.5],["C5",0.5],["E5",2],["D5",1],
       ["C5",2],["A4",1],["G4",3],
       ["G4",1],["C5",2],["E5",0.5],["C5",0.5],["E5",2],["D5",1],
       ["G5",3],["E5",3]],
      "fur-elise",
      { id: "import-online-amazing-grace", title: "Amazing Grace", composer: "John Newton", bpm: 70, description: "Hymn in 3/4." },
    ),
  },
  {
    id: "online-scarborough",
    title: "Scarborough Fair",
    composer: "Traditional, English",
    bpm: 86,
    theme: "rising-sun",
    description: "Dorian folk ballad — haunting and patient.",
    build: () => seq(
      [["A4",2],["E5",2],["E5",2],["B4",2],["C5",2],["B4",1],["A4",1],
       ["A4",2],["G4",1],["E4",1],["G4",2],["A4",4]],
      "rising-sun",
      { id: "import-online-scarborough", title: "Scarborough Fair", composer: "Traditional", bpm: 86, description: "Dorian folk ballad." },
    ),
  },
  {
    id: "online-clair-de-lune",
    title: "Clair de Lune (theme)",
    composer: "Claude Debussy",
    bpm: 60,
    theme: "moonlight",
    description: "Opening motif — floating, weightless, moonlit.",
    build: () => seq(
      [["D#5",2],["F5",1],["D#5",1],["A#4",2],["G#4",1],["F4",1],["D#4",4],
       ["D#5",2],["F5",1],["G#5",1],["A#5",2],["G#5",1],["F5",1],["D#5",4]],
      "moonlight",
      { id: "import-online-clair-de-lune", title: "Clair de Lune (theme)", composer: "Claude Debussy", bpm: 60, description: "Opening motif." },
    ),
  },
  {
    id: "online-canon-d",
    title: "Canon in D (theme)",
    composer: "Johann Pachelbel",
    bpm: 80,
    theme: "canon",
    description: "The most-played wedding melody — gentle baroque cascade.",
    build: () => seq(
      [["F#5",1],["E5",1],["D5",1],["C#5",1],["B4",1],["A4",1],["B4",1],["C#5",1],
       ["D5",1],["C#5",1],["B4",1],["A4",1],["G4",1],["F#4",1],["G4",1],["E4",1]],
      "canon",
      { id: "import-online-canon-d", title: "Canon in D (theme)", composer: "Johann Pachelbel", bpm: 80, description: "Baroque cascade theme." },
    ),
  },
  {
    id: "online-ode-joy",
    title: "Ode to Joy",
    composer: "Ludwig van Beethoven",
    bpm: 110,
    theme: "ode-to-joy",
    description: "The 9th Symphony anthem — bright, communal, easy to play.",
    build: () => seq(
      [["E4",1],["E4",1],["F4",1],["G4",1],["G4",1],["F4",1],["E4",1],["D4",1],
       ["C4",1],["C4",1],["D4",1],["E4",1],["E4",1.5],["D4",0.5],["D4",2]],
      "ode-to-joy",
      { id: "import-online-ode-joy", title: "Ode to Joy", composer: "Ludwig van Beethoven", bpm: 110, description: "Symphony No. 9 anthem." },
    ),
  },
  {
    id: "online-fur-elise",
    title: "Für Elise (theme)",
    composer: "Ludwig van Beethoven",
    bpm: 96,
    theme: "fur-elise",
    description: "Iconic A-minor figure — the first piece every pianist learns.",
    build: () => seq(
      [["E5",0.5],["D#5",0.5],["E5",0.5],["D#5",0.5],["E5",0.5],["B4",0.5],["D5",0.5],["C5",0.5],
       ["A4",1.5],["C4",0.5],["E4",0.5],["A4",0.5],["B4",1.5],["E4",0.5],["G#4",0.5],["B4",0.5],["C5",2]],
      "fur-elise",
      { id: "import-online-fur-elise", title: "Für Elise (theme)", composer: "Ludwig van Beethoven", bpm: 96, description: "Iconic A-minor figure." },
    ),
  },
  {
    id: "online-house-rising-sun",
    title: "House of the Rising Sun",
    composer: "Traditional folk",
    bpm: 76,
    theme: "rising-sun",
    description: "Smoky New Orleans ballad — perfect arpeggio practice.",
    build: () => seq(
      [["A3",1.5],["C4",0.5],["E4",1],["A4",1],["C5",1.5],["B4",0.5],
       ["D4",1.5],["F4",0.5],["A4",1],["E4",1.5],["G4",0.5],["B4",2]],
      "rising-sun",
      { id: "import-online-house-rising-sun", title: "House of the Rising Sun", composer: "Traditional", bpm: 76, description: "New Orleans ballad." },
    ),
  },
  {
    id: "online-twinkle",
    title: "Twinkle, Twinkle Little Star",
    composer: "Traditional / Mozart variation",
    bpm: 100,
    theme: "moonlight",
    description: "The friendliest first lesson on Earth.",
    build: () => seq(
      [["C4",1],["C4",1],["G4",1],["G4",1],["A4",1],["A4",1],["G4",2],
       ["F4",1],["F4",1],["E4",1],["E4",1],["D4",1],["D4",1],["C4",2]],
      "moonlight",
      { id: "import-online-twinkle", title: "Twinkle, Twinkle Little Star", composer: "Traditional", bpm: 100, description: "First lesson favorite." },
    ),
  },
  {
    id: "online-lofi-rain",
    title: "Lo-Fi Rain",
    composer: "Aria original",
    bpm: 72,
    theme: "night-drive",
    description: "Mellow late-night chord loop with a slow swing.",
    build: () => seq(
      [["F4",2],["A4",1],["C5",1],["E5",2],["D5",2],
       ["C5",1],["A4",1],["G4",2],["F4",2],["E4",2],["D4",4]],
      "night-drive",
      { id: "import-online-lofi-rain", title: "Lo-Fi Rain", composer: "Aria", bpm: 72, description: "Late-night chord loop." },
    ),
  },
  {
    id: "online-phonk-shadow",
    title: "Shadow Phonk",
    composer: "Aria original",
    bpm: 140,
    theme: "night-drive",
    description: "Distorted phonk groove — dark bass, half-time bounce.",
    build: () => seq(
      [["A2",0.5],["A2",0.5],["E3",1],["A2",0.5],["G2",0.5],["A2",1],
       ["F2",0.5],["F2",0.5],["C3",1],["F2",0.5],["E2",0.5],["F2",1]],
      "night-drive",
      { id: "import-online-phonk-shadow", title: "Shadow Phonk", composer: "Aria", bpm: 140, description: "Distorted phonk bass groove." },
    ),
  },
  {
    id: "online-ave-maria",
    title: "Ave Maria (Bach/Gounod)",
    composer: "J.S. Bach / C. Gounod",
    bpm: 60,
    theme: "fur-elise",
    description: "A reverent melody floating above arpeggios.",
    build: () => seq(
      [["G4",2],["A4",1],["G4",1],["F#4",2],["E4",2],
       ["D5",2],["C5",1],["B4",1],["A4",2],["G4",4]],
      "fur-elise",
      { id: "import-online-ave-maria", title: "Ave Maria", composer: "Bach/Gounod", bpm: 60, description: "Sacred melody." },
    ),
  },
  {
    id: "online-when-saints",
    title: "When the Saints Go Marching In",
    composer: "Traditional gospel",
    bpm: 130,
    theme: "ode-to-joy",
    description: "Joyful New Orleans parade — easy major triads.",
    build: () => seq(
      [["C4",1],["E4",1],["F4",1],["G4",2],["C4",1],["E4",1],["F4",1],["G4",2],
       ["C4",1],["E4",1],["F4",1],["G4",1],["E4",1],["C4",1],["E4",1],["D4",2]],
      "ode-to-joy",
      { id: "import-online-when-saints", title: "When the Saints Go Marching In", composer: "Traditional", bpm: 130, description: "New Orleans parade." },
    ),
  },
];

/** Tag & instrument metadata for the curated catalog, keyed by id. */
const META: Record<string, { tags: string[]; instruments: Array<"piano" | "guitar"> }> = {
  "online-greensleeves":       { tags: ["folk", "classical"],            instruments: ["piano", "guitar"] },
  "online-happy-birthday":     { tags: ["beginner", "celebration"],      instruments: ["piano"] },
  "online-jingle-bells":       { tags: ["holiday", "beginner"],          instruments: ["piano"] },
  "online-amazing-grace":      { tags: ["hymn", "ballad"],               instruments: ["piano", "guitar"] },
  "online-scarborough":        { tags: ["folk", "ballad"],               instruments: ["guitar"] },
  "online-clair-de-lune":      { tags: ["classical", "ambient"],         instruments: ["piano"] },
  "online-canon-d":            { tags: ["classical", "baroque"],         instruments: ["piano", "guitar"] },
  "online-ode-joy":            { tags: ["classical", "anthem"],          instruments: ["piano"] },
  "online-fur-elise":          { tags: ["classical", "beginner"],        instruments: ["piano"] },
  "online-house-rising-sun":   { tags: ["folk", "ballad"],               instruments: ["guitar"] },
  "online-twinkle":            { tags: ["beginner", "kids"],             instruments: ["piano"] },
  "online-lofi-rain":          { tags: ["lo-fi", "ambient", "chill"],    instruments: ["piano"] },
  "online-phonk-shadow":       { tags: ["phonk", "electronic", "dark"],  instruments: ["piano"] },
  "online-ave-maria":          { tags: ["classical", "hymn"],            instruments: ["piano"] },
  "online-when-saints":        { tags: ["gospel", "folk"],               instruments: ["piano", "guitar"] },
};

ONLINE_CATALOG.forEach((entry) => {
  const m = META[entry.id];
  if (m) { entry.tags = m.tags; entry.instruments = m.instruments; }
});