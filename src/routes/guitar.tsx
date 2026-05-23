import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Guitar } from "@/components/Guitar";
import { ScriptBook } from "@/components/ScriptBook";
import { FallingChords } from "@/components/FallingChords";
import { ensureAudio, playNote } from "@/lib/piano-engine";
import { SONGS, type Song } from "@/lib/songs";

export const Route = createFileRoute("/guitar")({
  head: () => ({
    meta: [
      { title: "Acoustic Guitar — Aria" },
      { name: "description", content: "Full sampled fretboard, falling-chord practice, and a script book of songs. Includes Golden Brown, House of the Rising Sun, and more." },
      { property: "og:title", content: "Acoustic Guitar — Aria" },
      { property: "og:description", content: "Pluck. Strum. Practice with falling chord cards." },
    ],
  }),
  component: GuitarPage,
});

const CHORDS: Array<{ name: string; frets: Array<[number, number]> }> = [
  { name: "Em", frets: [[0, 0], [1, 2], [2, 2], [3, 0], [4, 0], [5, 0]] },
  { name: "G",  frets: [[0, 3], [1, 2], [2, 0], [3, 0], [4, 0], [5, 3]] },
  { name: "C",  frets: [[1, 3], [2, 2], [3, 0], [4, 1], [5, 0]] },
  { name: "D",  frets: [[2, 0], [3, 2], [4, 3], [5, 2]] },
  { name: "Am", frets: [[1, 0], [2, 2], [3, 2], [4, 1], [5, 0]] },
];
const NOTE_ORDER = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const STRINGS = ["E2","A2","D3","G3","B3","E4"];
function transpose(note: string, semitones: number): string {
  const m = note.match(/^([A-G]#?)(\d+)$/); if (!m) return note;
  const idx = NOTE_ORDER.indexOf(m[1]);
  const total = idx + parseInt(m[2],10)*12 + semitones;
  return NOTE_ORDER[total%12] + Math.floor(total/12);
}

const GUITAR_SONGS = SONGS.filter((s) => !!s.chords);

function GuitarPage() {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState<{ song: Song; mode: "auto" | "practice" } | null>(null);

  useEffect(() => { document.documentElement.removeAttribute("data-theme"); }, []);

  const awaken = async () => {
    setLoading(true);
    try { await ensureAudio("guitar"); } catch {}
    ["E3","G3","B3","E4"].forEach((n, i) =>
      setTimeout(() => playNote(n, "2n", undefined, 0.85, "guitar"), i * 140),
    );
    setReady(true);
    setLoading(false);
  };

  const strum = async (chord: typeof CHORDS[number]) => {
    await ensureAudio("guitar");
    chord.frets.forEach(([stringIdx, fret], i) => {
      const note = transpose(STRINGS[stringIdx], fret);
      setTimeout(() => playNote(note, "1n", undefined, 0.85, "guitar"), i * 35);
    });
  };

  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="max-w-7xl mx-auto px-4 md:px-6 pt-10 md:pt-12 pb-6 text-center animate-float-up">
        <p className="text-[10px] uppercase tracking-[0.4em] text-primary mb-3">— Acoustic · Steel-string —</p>
        <h1 className="font-serif text-3xl md:text-6xl">Six strings. Real plucks.</h1>
        <p className="mt-3 max-w-xl mx-auto text-muted-foreground text-sm md:text-base">
          Tap an open string, any fret, or run a falling-chord set below. Sound falls back to a warm synth if samples are slow.
        </p>
        {!ready && (
          <button onClick={awaken} disabled={loading}
                  className="mt-7 px-8 py-3.5 rounded-full bg-gradient-to-r from-[var(--amber)] to-[var(--amber-glow)] text-[var(--ebony)] font-medium animate-glow disabled:opacity-60">
            {loading ? "Stringing the guitar…" : "Pick up the Guitar"}
          </button>
        )}
      </section>

      {ready && (
        <>
          <section className="max-w-7xl mx-auto px-3 md:px-6 pb-6 animate-float-up">
            <div className="bg-card/40 backdrop-blur rounded-2xl md:rounded-3xl border border-border p-2 md:p-6 shadow-[var(--shadow-warm)]">
              <Guitar />
            </div>
          </section>

          <section className="max-w-7xl mx-auto px-4 md:px-6 pb-6">
            <ScriptBook filterIds={GUITAR_SONGS.map((s) => s.id)} />
          </section>

          <section className="max-w-7xl mx-auto px-4 md:px-6 pb-6">
            <div className="bg-card/40 backdrop-blur rounded-2xl border border-border p-5">
              <p className="text-[10px] uppercase tracking-[0.3em] text-primary mb-3">Quick chords</p>
              <div className="flex flex-wrap gap-2">
                {CHORDS.map((c) => (
                  <button key={c.name} onClick={() => strum(c)}
                    className="px-4 py-2.5 rounded-md border border-primary/40 hover:bg-primary/10 hover:border-primary transition font-serif text-lg text-primary">
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="max-w-7xl mx-auto px-4 md:px-6 pb-16">
            <p className="text-[10px] uppercase tracking-[0.3em] text-primary mb-3">Falling-chords practice</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {GUITAR_SONGS.map((s) => (
                <article key={s.id} className="bg-card/40 border border-border rounded-2xl p-5 hover:border-primary/60 hover:shadow-[var(--shadow-warm)] transition">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-primary">{s.composer}</p>
                  <h3 className="font-serif text-2xl mt-1">{s.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2">{s.description}</p>
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => setActive({ song: s, mode: "auto" })}
                      className="flex-1 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm">▶ Listen</button>
                    <button onClick={() => setActive({ song: s, mode: "practice" })}
                      className="flex-1 px-3 py-2 rounded-md border border-primary/60 text-primary text-sm hover:bg-primary/10">✦ Practice</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}

      {active && (
        <FallingChords song={active.song} mode={active.mode} bpm={active.song.bpm} onClose={() => setActive(null)} />
      )}
    </main>
  );
}
