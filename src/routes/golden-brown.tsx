import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { FallingTiles } from "@/components/FallingTiles";
import { ScriptBook } from "@/components/ScriptBook";
import { ensureAudio } from "@/lib/piano-engine";
import { getSong } from "@/lib/songs";
import goldenBrownCover from "@/assets/golden-brown-cover.png";

export const Route = createFileRoute("/golden-brown")({
  head: () => ({
    meta: [
      { title: "Golden Brown — Aria" },
      { name: "description", content: "The Stranglers' Golden Brown in full — Listen mode auto-plays with falling tiles, Practice mode waits for your tap. Adjust tempo and feel the room shake." },
      { property: "og:title", content: "Golden Brown — Listen & Practice in Aria" },
      { property: "og:description", content: "Amber-lit room, harpsichord arpeggio, your fingers." },
    ],
  }),
  component: GoldenBrownPage,
});

function GoldenBrownPage() {
  const song = getSong("golden-brown")!;
  const [mode, setMode] = useState<"auto" | "practice">("auto");
  const [tempo, setTempo] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "golden-brown");
    return () => document.documentElement.removeAttribute("data-theme");
  }, []);

  const launch = async () => {
    setPlaying(true);
    setLoading(true);
    void Promise.all([ensureAudio("piano"), ensureAudio("bass")]).finally(() => setLoading(false));
    setShake(true);
    setTimeout(() => setShake(false), 950);
  };

  return (
    <main className={`min-h-screen ${shake ? "beloved-shake" : ""}`}>
      <SiteHeader />
      <section className="max-w-5xl mx-auto px-4 md:px-6 pt-10 pb-6 animate-float-up">
        <div className="grid md:grid-cols-[260px_1fr] gap-6 items-center">
          <img src={goldenBrownCover} alt="Golden Brown by The Stranglers — single cover"
               className="w-48 md:w-full mx-auto rounded-xl object-cover border border-border shadow-[var(--shadow-warm)]" />
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-primary">The Stranglers · 1981</p>
            <h1 className="font-serif text-4xl md:text-6xl mt-1">Golden Brown</h1>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              The hypnotic 6/8 → 7/8 harpsichord arpeggio over Am · Dm · C · G.
              A track loved enough that the whole hall shakes when it starts.
            </p>

            {/* Mode toggle */}
            <div className="mt-6 inline-flex rounded-full border border-border bg-card/40 p-1">
              {(["auto", "practice"] as const).map((m) => (
                <button key={m} onClick={() => setMode(m)}
                  className={`px-5 py-1.5 text-sm rounded-full transition ${mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {m === "auto" ? "Listen" : "Practice"}
                </button>
              ))}
            </div>

            {/* Tempo */}
            <div className="mt-5 flex items-center gap-3">
              <span className="text-xs uppercase tracking-[0.3em] text-primary">Tempo</span>
              <input type="range" min={0.5} max={1.5} step={0.05} value={tempo}
                     onChange={(e) => setTempo(parseFloat(e.target.value))}
                     className="flex-1 accent-[var(--amber)]" />
              <span className="font-mono text-sm w-16 text-right">{Math.round(song.bpm * tempo)} BPM</span>
            </div>

            <button onClick={launch} disabled={loading}
                    className="mt-7 px-8 py-3.5 rounded-full bg-gradient-to-r from-[var(--amber)] to-[var(--amber-glow)] text-[var(--ebony)] font-medium animate-glow disabled:opacity-60">
              {loading ? "Lighting the candles…" : mode === "auto" ? "▶ Listen" : "✦ Practice"}
            </button>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 md:px-6 pb-16 animate-float-up">
        <ScriptBook filterIds={["golden-brown"]} />
      </section>

      {playing && (
        <FallingTiles song={song} mode={mode} speed={tempo} onClose={() => setPlaying(false)} />
      )}
    </main>
  );
}
