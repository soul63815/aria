import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Piano } from "@/components/Piano";
import { ensureAudio, playNote } from "@/lib/piano-engine";

export const Route = createFileRoute("/piano")({
  head: () => ({
    meta: [
      { title: "The Grand Piano — Aria" },
      { name: "description", content: "A full 88-key sampled grand piano. Play with mouse, touch, or computer keyboard." },
      { property: "og:title", content: "The Grand Piano — Aria" },
      { property: "og:description", content: "Full keyboard, real samples, warm hall reverb." },
    ],
  }),
  component: PianoPage,
});

function PianoPage() {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState<"full" | "mid" | "treble">("mid");

  const awaken = async () => {
    setLoading(true);
    await ensureAudio("piano");
    [["C4", 0], ["E4", 160], ["G4", 320], ["C5", 480]].forEach(([n, d]) =>
      setTimeout(() => playNote(n as string, "8n"), d as number),
    );
    setReady(true);
    setLoading(false);
  };

  useEffect(() => {
    document.documentElement.removeAttribute("data-theme");
  }, []);

  const [start, end] =
    range === "full" ? [1, 7] :
    range === "mid" ? [3, 5] :
    [4, 6];

  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="max-w-7xl mx-auto px-6 pt-12 pb-6 text-center animate-float-up">
        <p className="text-xs uppercase tracking-[0.4em] text-primary mb-3">— Free Play · Grand Piano —</p>
        <h1 className="font-serif text-4xl md:text-6xl">A full keyboard, candlelit.</h1>
        <p className="mt-4 max-w-xl mx-auto text-muted-foreground">
          Tap any key, or use your QWERTY row. The wider the range, the more strings to wake.
        </p>
        {!ready && (
          <button
            onClick={awaken}
            disabled={loading}
            className="mt-7 px-8 py-3.5 rounded-full bg-gradient-to-r from-[var(--amber)] to-[var(--amber-glow)] text-[var(--ebony)] font-medium animate-glow disabled:opacity-60"
          >
            {loading ? "Tuning the strings…" : "Awaken the Piano"}
          </button>
        )}
        {ready && (
          <div className="mt-7 inline-flex rounded-full border border-border bg-card/40 p-1">
            {(["treble", "mid", "full"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-4 py-1.5 text-sm rounded-full transition ${range === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {r === "treble" ? "Treble (2 oct)" : r === "mid" ? "Middle (3 oct)" : "Full (7 oct · 88)"}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-6 pb-12 animate-float-up">
        <div className="bg-card/40 backdrop-blur rounded-3xl border border-border p-3 md:p-6 shadow-[var(--shadow-warm)] overflow-x-auto">
          <div className={range === "full" ? "min-w-[1400px]" : ""}>
            <Piano startOctave={start} endOctave={end} />
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          QWERTY: <kbd className="px-1.5 py-0.5 border border-border rounded">A S D F G H J K L</kbd> white ·
          <kbd className="ml-2 px-1.5 py-0.5 border border-border rounded">W E T Y U O P</kbd> black
        </p>
      </section>
    </main>
  );
}