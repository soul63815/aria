export interface SongNote {
  note: string;
  time: number;
  duration: number;
  /** optional instrument override per-note (e.g. bass under melody) */
  instrument?: "piano" | "guitar" | "bass" | "drums" | "violin" | "flute";
}

export interface ChordHit {
  /** Time in beats */
  time: number;
  /** Chord name shown to user */
  name: string;
  /** Frets per string, low E (0) → high e (5). -1 = mute */
  frets: number[];
  /** Optional vibe label */
  flavor?: string;
}

export interface Song {
  id: string;
  title: string;
  composer: string;
  bpm: number;
  theme: string;
  description: string;
  notes: SongNote[];
  /** True for "fan-loved" tracks → triggers shake-on-launch */
  beloved?: boolean;
  /** Optional guitar chord track for falling-chords practice */
  chords?: ChordHit[];
  /** Plain-text "script" / tab for the script book */
  script?: string;
  /** Genre / mood tags for filtering & search */
  tags?: string[];
  /** Primary instruments this piece is written for */
  instruments?: Array<"piano" | "guitar">;
}

// ---------- Golden Brown (extended) ----------
const gb = (): SongNote[] => {
  const bars: Array<string[]> = [
    ["A3","C4","E4","A4","E4","C4"],
    ["A3","C4","E4","A4","E4","C4"],
    ["D4","F4","A4","D5","A4","F4"],
    ["D4","F4","A4","D5","C5","A4","F4"],
    ["C4","E4","G4","C5","G4","E4"],
    ["G3","B3","D4","G4","D4","B3"],
    ["A3","C4","E4","A4","E4","C4"],
    ["A3","C4","E4","A4","E4","C4"],
  ];
  const notes: SongNote[] = [];
  let t = 0;
  // Play arpeggio chorus 4× for full-length performance
  for (let rep = 0; rep < 4; rep++) {
    bars.forEach((group) => {
      group.forEach((n) => { notes.push({ note: n, time: t, duration: 0.42 }); t += 0.5; });
    });
  }
  // Sustained bass under verse
  const bassLine: Array<[string, number, number]> = [
    ["A2", 0, 3], ["A2", 3, 3], ["D3", 6, 3], ["D3", 9, 3],
    ["C3", 12, 3], ["G2", 15, 3], ["A2", 18, 3], ["A2", 21, 3],
  ];
  bassLine.forEach(([n, time, d]) => notes.push({ note: n, time, duration: d, instrument: "bass" }));

  // Vocal sketch — "Golden brown, texture like sun…"
  const melody: Array<[string, number, number]> = [
    ["E5", t + 0.5, 1], ["E5", t + 1.5, 0.5], ["D5", t + 2, 0.5], ["C5", t + 2.5, 1.5],
    ["A4", t + 4.5, 1], ["B4", t + 5.5, 0.5], ["C5", t + 6, 0.5], ["A4", t + 6.5, 2],
    ["E5", t + 9, 1], ["D5", t + 10, 0.5], ["C5", t + 10.5, 0.5], ["B4", t + 11, 1],
    ["A4", t + 12, 1], ["G4", t + 13, 1], ["A4", t + 14, 2],
  ];
  melody.forEach(([n, time, d]) => notes.push({ note: n, time, duration: d }));
  return notes;
};

const gbChords: ChordHit[] = (() => {
  // Loops twice in sync with arpeggio bars (each bar = ~3 beats)
  const pattern = [
    { name: "Am", frets: [-1, 0, 2, 2, 1, 0] },
    { name: "Am", frets: [-1, 0, 2, 2, 1, 0] },
    { name: "Dm", frets: [-1, -1, 0, 2, 3, 1] },
    { name: "Dm7", frets: [-1, -1, 0, 2, 1, 1], flavor: "+C top" },
    { name: "C",  frets: [-1, 3, 2, 0, 1, 0] },
    { name: "G",  frets: [3, 2, 0, 0, 0, 3] },
    { name: "Am", frets: [-1, 0, 2, 2, 1, 0] },
    { name: "Am", frets: [-1, 0, 2, 2, 1, 0] },
  ];
  const out: ChordHit[] = [];
  for (let rep = 0; rep < 4; rep++) {
    pattern.forEach((c, i) => out.push({ ...c, time: rep * 24 + i * 3 }));
  }
  return out;
})();

// ---------- Phonk: Night Drive (original) ----------
// Dark Am loop with sub bass and cowbell-style kicks
const phonk = (): SongNote[] => {
  const notes: SongNote[] = [];
  // 32 bars × 4 beats = 128 beats (extended drive)
  const bassPattern = ["A1", "A1", "G1", "F1"]; // per bar root
  for (let bar = 0; bar < 32; bar++) {
    const root = bassPattern[bar % 4];
    // Sub bass on beats 1 & 2.5
    notes.push({ note: root, time: bar * 4, duration: 1.5, instrument: "bass" });
    notes.push({ note: root, time: bar * 4 + 2.5, duration: 1, instrument: "bass" });
    // Kick on 1 & 3
    notes.push({ note: "C1", time: bar * 4, duration: 0.2, instrument: "drums" });
    notes.push({ note: "C1", time: bar * 4 + 2, duration: 0.2, instrument: "drums" });
    notes.push({ note: "F2", time: bar * 4 + 1, duration: 0.15, instrument: "drums" });
    notes.push({ note: "F2", time: bar * 4 + 3, duration: 0.15, instrument: "drums" });
  }
  // Eerie piano melody floating over
  const mel: Array<[string, number, number]> = [
    ["E5", 0, 1], ["A4", 1, 0.5], ["C5", 1.5, 0.5], ["B4", 2, 1], ["E5", 3, 1],
    ["A4", 4, 0.5], ["E5", 4.5, 0.5], ["G5", 5, 1], ["F5", 6, 1], ["E5", 7, 1],
    ["D5", 8, 1], ["C5", 9, 1], ["B4", 10, 1], ["A4", 11, 1],
    ["E5", 12, 0.5], ["G5", 12.5, 0.5], ["A5", 13, 2], ["E5", 15, 1],
  ];
  // play melody four times across the extended drive
  for (let r = 0; r < 4; r++) mel.forEach(([n, t, d]) => notes.push({ note: n, time: r * 32 + t, duration: d }));
  return notes;
};

// ---------- Für Elise ----------
const furElise = (): SongNote[] => {
  const seq: Array<[string, number]> = [
    ["E5",0.5],["D#5",0.5],["E5",0.5],["D#5",0.5],["E5",0.5],["B4",0.5],
    ["D5",0.5],["C5",0.5],["A4",1],
    ["C4",0.5],["E4",0.5],["A4",0.5],["B4",1],
    ["E4",0.5],["G#4",0.5],["B4",0.5],["C5",1],
    ["E4",0.5],["E5",0.5],["D#5",0.5],["E5",0.5],["D#5",0.5],["E5",0.5],
    ["B4",0.5],["D5",0.5],["C5",0.5],["A4",1],
    ["C4",0.5],["E4",0.5],["A4",0.5],["B4",1],
    ["E4",0.5],["C5",0.5],["B4",0.5],["A4",2],
  ];
  const notes: SongNote[] = []; let t = 0;
  for (let r = 0; r < 3; r++) seq.forEach(([n, d]) => { notes.push({ note: n, time: t, duration: (d as number) * 0.9 }); t += d as number; });
  return notes;
};

// ---------- Moonlight Sonata ----------
const moonlight = (): SongNote[] => {
  const triplets = [
    ["C#4","E4","G#4"],["C#4","E4","G#4"],["C#4","E4","G#4"],["C#4","E4","G#4"],
    ["C#4","E4","A4"],["C#4","E4","A4"],["D4","F#4","A4"],["D4","F#4","A4"],
    ["C#4","E4","G#4"],["C#4","E4","G#4"],["B3","D#4","F#4"],["B3","D#4","F#4"],
    ["C#4","E4","G#4"],["C#4","E4","G#4"],["C#4","E4","G#4"],["C#4","E4","G#4"],
  ];
  const notes: SongNote[] = []; let t = 0;
  for (let r = 0; r < 3; r++) triplets.forEach((g) => { g.forEach((n) => { notes.push({ note: n, time: t, duration: 0.32 }); t += 0.33; }); });
  return notes;
};

// ---------- Ode to Joy ----------
const odeToJoy = (): SongNote[] => {
  const seq: Array<[string, number]> = [
    ["E4",1],["E4",1],["F4",1],["G4",1],["G4",1],["F4",1],["E4",1],["D4",1],
    ["C4",1],["C4",1],["D4",1],["E4",1],["E4",1.5],["D4",0.5],["D4",2],
    ["E4",1],["E4",1],["F4",1],["G4",1],["G4",1],["F4",1],["E4",1],["D4",1],
    ["C4",1],["C4",1],["D4",1],["E4",1],["D4",1.5],["C4",0.5],["C4",2],
  ];
  const notes: SongNote[] = []; let t = 0;
  for (let r = 0; r < 3; r++) seq.forEach(([n, d]) => { notes.push({ note: n, time: t, duration: (d as number) * 0.9 }); t += d as number; });
  return notes;
};

// ---------- Canon in D ----------
const canon = (): SongNote[] => {
  const seq: Array<[string, number]> = [
    ["F#5",2],["E5",2],["D5",2],["C#5",2],
    ["B4",2],["A4",2],["B4",2],["C#5",2],
    ["D5",2],["C#5",2],["B4",2],["A4",2],
    ["G4",2],["F#4",2],["G4",2],["E4",2],
  ];
  const notes: SongNote[] = []; let t = 0;
  for (let r = 0; r < 3; r++) seq.forEach(([n, d]) => { notes.push({ note: n, time: t, duration: (d as number) * 0.95 }); t += d as number; });
  return notes;
};

// ---------- Twinkle Twinkle (beginner) ----------
const twinkle = (): SongNote[] => {
  const seq: Array<[string, number]> = [
    ["C4",1],["C4",1],["G4",1],["G4",1],["A4",1],["A4",1],["G4",2],
    ["F4",1],["F4",1],["E4",1],["E4",1],["D4",1],["D4",1],["C4",2],
  ];
  const notes: SongNote[] = []; let t = 0;
  for (let r = 0; r < 3; r++) seq.forEach(([n, d]) => { notes.push({ note: n, time: t, duration: (d as number) * 0.9 }); t += d as number; });
  return notes;
};

// ---------- House of the Rising Sun (guitar arpeggio) ----------
const risingSun = (): SongNote[] => {
  // Am C D F Am E Am E
  const arp = (chord: string[], start: number) => chord.map((n, i) => ({ note: n, time: start + i * 0.5, duration: 0.45 }));
  const shapes: Array<string[]> = [
    ["A2","E3","A3","C4","E4","A3"],
    ["C3","E3","G3","C4","E4","G3"],
    ["D3","A3","D4","F#4","A4","F#4"],
    ["F2","C3","F3","A3","C4","A3"],
    ["A2","E3","A3","C4","E4","A3"],
    ["E2","B2","E3","G#3","B3","G#3"],
    ["A2","E3","A3","C4","E4","A3"],
    ["E2","B2","E3","G#3","B3","E3"],
  ];
  const notes: SongNote[] = [];
  // 3 full verses
  for (let rep = 0; rep < 3; rep++) {
    shapes.forEach((c, i) => arp(c, rep * 24 + i * 3).forEach((n) => notes.push({ ...n, instrument: "guitar" })));
  }
  return notes;
};

const risingSunChords: ChordHit[] = [
  { name: "Am", frets: [-1, 0, 2, 2, 1, 0], time: 0 },
  { name: "C",  frets: [-1, 3, 2, 0, 1, 0], time: 3 },
  { name: "D",  frets: [-1, -1, 0, 2, 3, 2], time: 6 },
  { name: "F",  frets: [1, 3, 3, 2, 1, 1], time: 9 },
  { name: "Am", frets: [-1, 0, 2, 2, 1, 0], time: 12 },
  { name: "E",  frets: [0, 2, 2, 1, 0, 0], time: 15 },
  { name: "Am", frets: [-1, 0, 2, 2, 1, 0], time: 18 },
  { name: "E",  frets: [0, 2, 2, 1, 0, 0], time: 21 },
];

export const SONGS: Song[] = [
  {
    id: "golden-brown",
    title: "Golden Brown",
    composer: "The Stranglers",
    bpm: 84,
    theme: "golden-brown",
    description: "Hypnotic 6/8 harpsichord arpeggio — amber-lit and timeless.",
    notes: gb(),
    chords: gbChords,
    beloved: true,
    tags: ["rock", "classic", "mellow"],
    instruments: ["piano", "guitar"],
    script: `Verse loop (6/8 → 7/8 bars)
Am | Am | Dm | Dm(+C) | C | G | Am | Am

Right hand arpeggio: root-3-5-octave ascending, then descend.
Left hand: hold the root through each bar.

Lyric cue: "Golden brown, texture like sun…"`,
  },
  {
    id: "night-drive",
    title: "Night Drive (Phonk)",
    composer: "Aria Sessions",
    bpm: 130,
    theme: "phonk",
    description: "Sub bass, cowbell kicks, eerie minor melody — drive slow.",
    notes: phonk(),
    beloved: true,
    tags: ["phonk", "electronic", "dark"],
    instruments: ["piano"],
    script: `Am – Am – G – F  (loop ×4)
Bass on 1 and the "and" of 2.
Kick on every quarter, snare-ish hit on 2 and 4.`,
  },
  {
    id: "rising-sun",
    title: "House of the Rising Sun",
    composer: "Traditional",
    bpm: 78,
    theme: "rising-sun",
    description: "Six-string arpeggio of the most-played folk standard.",
    notes: risingSun(),
    chords: risingSunChords,
    tags: ["folk", "ballad"],
    instruments: ["guitar"],
    script: `Am  C  D   F
Am  C  E   E
Am  C  D   F
Am  E  Am  E

Fingerpick: T-i-m-a-m-i (thumb on bass, alternating).`,
  },
  {
    id: "fur-elise",
    title: "Für Elise",
    composer: "Ludwig van Beethoven",
    bpm: 72,
    theme: "fur-elise",
    description: "Tender opening bagatelle — the most loved melody in piano.",
    notes: furElise(),
    tags: ["classical", "beginner"],
    instruments: ["piano"],
    script: `RH: E D# E D# E B D C A …
LH: A2 E3 A3 chord, then E2 E3 G#3.`,
  },
  {
    id: "moonlight",
    title: "Moonlight Sonata",
    composer: "Ludwig van Beethoven",
    bpm: 56,
    theme: "moonlight",
    description: "Quiet triplets drifting like moonlight on still water.",
    notes: moonlight(),
    tags: ["classical", "ambient"],
    instruments: ["piano"],
    script: `RH triplets, pianissimo:
C#-E-G# (×4)   C#-E-A (×2)   D-F#-A (×2)   C#-E-G# (×2)   B-D#-F# (×2)`,
  },
  {
    id: "ode-to-joy",
    title: "Ode to Joy",
    composer: "Ludwig van Beethoven",
    bpm: 100,
    theme: "ode-to-joy",
    description: "Triumphant and luminous — a hymn to shared joy.",
    notes: odeToJoy(),
    tags: ["classical", "anthem", "beginner"],
    instruments: ["piano"],
    script: `E E F G | G F E D | C C D E | E. D D
E E F G | G F E D | C C D E | D. C C`,
  },
  {
    id: "canon",
    title: "Canon in D",
    composer: "Johann Pachelbel",
    bpm: 64,
    theme: "canon",
    description: "Endless, weaving lines — pure baroque serenity.",
    notes: canon(),
    tags: ["classical", "baroque"],
    instruments: ["piano", "guitar"],
    script: `Descant: F# E D C# | B A B C# | D C# B A | G F# G E`,
  },
  {
    id: "twinkle",
    title: "Twinkle Twinkle Little Star",
    composer: "Traditional",
    bpm: 90,
    theme: "fur-elise",
    description: "Beginner-friendly — perfect first piece on any instrument.",
    notes: twinkle(),
    tags: ["beginner", "kids"],
    instruments: ["piano"],
    script: `C C G G A A G | F F E E D D C`,
  },
];

export const getSong = (id: string) => SONGS.find((s) => s.id === id);
