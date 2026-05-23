import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { ScriptBook } from "@/components/ScriptBook";
import { ensureAudio, playNote, type InstrumentId } from "@/lib/piano-engine";

export const Route = createFileRoute("/instruments")({
  head: () => ({
    meta: [
      { title: "The Parlor — Violin, Flute, Drums, Bass | Aria" },
      { name: "description", content: "Violin pads, breathy flute, sub bass, and a deep drum kick — the rest of Aria's chamber. Script book above with notation." },
      { property: "og:title", content: "The Parlor — Aria" },
      { property: "og:description", content: "Violin, flute, bass, drums and a script book of songs." },
    ],
  }),
  component: InstrumentsPage,
});

type Pad = { label: string; note: string };
type Inst = { id: InstrumentId; name: string; eyebrow: string; body: string; glyph: string; duration: string; pads: Pad[] };

const VIOLIN: Inst = {
  id: "violin", name: "Violin", eyebrow: "Warm bowed strings",
  body: "Sustained pads in C major. Hold to layer harmonies.", glyph: "𝄢", duration: "2n",
  pads: [{label:"C",note:"C4"},{label:"D",note:"D4"},{label:"E",note:"E4"},{label:"F",note:"F4"},{label:"G",note:"G4"},{label:"A",note:"A4"},{label:"B",note:"B4"},{label:"C",note:"C5"}],
};
const FLUTE: Inst = {
  id: "flute", name: "Flute", eyebrow: "Breathy & weightless",
  body: "Pentatonic pads — every combination sounds peaceful.", glyph: "♭", duration: "4n",
  pads: [{label:"A",note:"A4"},{label:"C",note:"C5"},{label:"D",note:"D5"},{label:"E",note:"E5"},{label:"G",note:"G5"},{label:"A",note:"A5"}],
};
const BASS: Inst = {
  id: "bass", name: "Sub Bass", eyebrow: "Phonk · sub-heavy",
  body: "Pitched FM bass with light grit — anchors any beat.", glyph: "𝄐", duration: "4n",
  pads: [{label:"A",note:"A1"},{label:"C",note:"C2"},{label:"D",note:"D2"},{label:"E",note:"E2"},{label:"F",note:"F1"},{label:"G",note:"G1"}],
};
const DRUMS: Inst = {
  id: "drums", name: "Percussion", eyebrow: "Heartbeat of the hall",
  body: "Membrane voice tuned across pitches — kick, tom, low boom.", glyph: "●", duration: "8n",
  pads: [{label:"Kick",note:"C1"},{label:"Tom",note:"F2"},{label:"Hi",note:"A2"},{label:"Boom",note:"C2"}],
};
const ORGAN: Inst = {
  id: "organ", name: "Cathedral Organ", eyebrow: "Sustained · majestic",
  body: "Layered sines like pipe organ stops — hold for hymns.", glyph: "‡", duration: "2n",
  pads: [{label:"C",note:"C4"},{label:"E",note:"E4"},{label:"G",note:"G4"},{label:"C",note:"C5"},{label:"D",note:"D4"},{label:"F",note:"F4"},{label:"A",note:"A4"},{label:"B",note:"B4"}],
};
const HARP: Inst = {
  id: "harp", name: "Concert Harp", eyebrow: "Plucked · cascading",
  body: "Soft attack, long sustain — glissandos by tapping in order.", glyph: "𝄞", duration: "2n",
  pads: [{label:"C",note:"C4"},{label:"E",note:"E4"},{label:"G",note:"G4"},{label:"A",note:"A4"},{label:"C",note:"C5"},{label:"E",note:"E5"},{label:"G",note:"G5"},{label:"A",note:"A5"}],
};
const MARIMBA: Inst = {
  id: "marimba", name: "Marimba", eyebrow: "Wooden · warm percussion",
  body: "FM-modeled wooden bars — quick decay, sweet tone.", glyph: "▥", duration: "8n",
  pads: [{label:"C",note:"C4"},{label:"D",note:"D4"},{label:"E",note:"E4"},{label:"G",note:"G4"},{label:"A",note:"A4"},{label:"C",note:"C5"},{label:"D",note:"D5"},{label:"E",note:"E5"}],
};
const LEAD: Inst = {
  id: "synthlead", name: "Synth Lead", eyebrow: "Retro · saw-wave",
  body: "Fat saw lead for solos and phonk hooks.", glyph: "∿", duration: "4n",
  pads: [{label:"A",note:"A3"},{label:"C",note:"C4"},{label:"D",note:"D4"},{label:"E",note:"E4"},{label:"G",note:"G4"},{label:"A",note:"A4"},{label:"C",note:"C5"},{label:"E",note:"E5"}],
};

function Panel({ inst }: { inst: Inst }) {
  const [last, setLast] = useState<string | null>(null);
  const hit = async (note: string) => {
    await ensureAudio(inst.id);
    playNote(note, inst.duration, undefined, 0.85, inst.id);
    setLast(note); setTimeout(() => setLast(null), 250);
  };
  return (
    <article className="relative overflow-hidden bg-card/40 backdrop-blur border border-border rounded-2xl p-5 md:p-6 hover:border-primary/60 transition-all hover:shadow-[var(--shadow-warm)]">
      <div className="absolute -top-6 -right-4 font-serif text-[7rem] text-primary/10 leading-none select-none">{inst.glyph}</div>
      <p className="text-[10px] uppercase tracking-[0.3em] text-primary">{inst.eyebrow}</p>
      <h3 className="font-serif text-2xl md:text-3xl mt-1">{inst.name}</h3>
      <p className="text-sm text-muted-foreground mt-2">{inst.body}</p>
      <div className="grid grid-cols-4 gap-2 mt-4">
        {inst.pads.map((p, i) => {
          const active = last === p.note;
          return (
            <button key={i} onMouseDown={() => hit(p.note)} onTouchStart={(e) => { e.preventDefault(); hit(p.note); }}
              className={`aspect-square rounded-md border transition-all flex flex-col items-center justify-center font-serif ${active ? "border-primary bg-gradient-to-br from-[var(--amber-glow)] to-[var(--amber)] text-[var(--ebony)] shadow-[0_0_20px_var(--amber)]" : "border-border bg-secondary/40 text-foreground hover:border-primary/50"}`}>
              <span className="text-base">{p.label}</span>
              <span className="text-[9px] font-mono opacity-70 mt-0.5">{p.note}</span>
            </button>
          );
        })}
      </div>
    </article>
  );
}

function InstrumentsPage() {
  useEffect(() => { document.documentElement.removeAttribute("data-theme"); }, []);
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="max-w-7xl mx-auto px-4 md:px-6 pt-10 md:pt-12 pb-6 text-center animate-float-up">
        <p className="text-[10px] uppercase tracking-[0.4em] text-primary mb-3">— The Parlor —</p>
        <h1 className="font-serif text-3xl md:text-6xl">More voices for the room.</h1>
        <p className="mt-3 max-w-xl mx-auto text-muted-foreground">
          The script book sits above. Open it, read the notation, then tap any pad. Audio wakes the moment you do.
        </p>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-6 pb-6">
        <ScriptBook />
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-6 pb-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-float-up">
        <Panel inst={VIOLIN} />
        <Panel inst={FLUTE} />
        <Panel inst={BASS} />
        <Panel inst={DRUMS} />
        <Panel inst={ORGAN} />
        <Panel inst={HARP} />
        <Panel inst={MARIMBA} />
        <Panel inst={LEAD} />
      </section>
    </main>
  );
}
