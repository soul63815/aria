import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { ONLINE_CATALOG, type CatalogEntry } from "@/lib/online-catalog";
import { addCustomSong, useCustomSongs } from "@/lib/custom-songs";
import { SONGS } from "@/lib/songs";
import { ensureAudio, playNote, stopAll } from "@/lib/piano-engine";
import * as Tone from "tone";

export const Route = createFileRoute("/online")({
  head: () => ({
    meta: [
      { title: "Online Catalog — Aria Music" },
      { name: "description", content: "Browse a free online catalog of public-domain melodies. Preview each piece in your browser and add it to your library with one tap." },
      { property: "og:title", content: "Online Catalog — Aria Music" },
      { property: "og:description", content: "Hear before you import. Curated classical, folk, lo-fi & phonk motifs ready to play." },
    ],
  }),
  component: OnlinePage,
});

function OnlinePage() {
  const custom = useCustomSongs();
  const [query, setQuery] = useState("");
  const [instrumentFilter, setInstrumentFilter] = useState<"all" | "piano" | "guitar">("all");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    ONLINE_CATALOG.forEach((e) => e.tags?.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, []);

  const owned = useMemo(() => {
    const ids = new Set<string>([...custom.map((s) => s.id), ...SONGS.map((s) => s.id)]);
    return ids;
  }, [custom]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ONLINE_CATALOG.filter((e) => {
      if (instrumentFilter !== "all" && !(e.instruments ?? []).includes(instrumentFilter)) return false;
      if (activeTag && !(e.tags ?? []).includes(activeTag)) return false;
      if (!q) return true;
      return (
        e.title.toLowerCase().includes(q) ||
        e.composer.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        (e.tags ?? []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [query, instrumentFilter, activeTag]);

  useEffect(() => () => { try { stopAll(); } catch {} }, []);

  const preview = async (entry: CatalogEntry) => {
    if (previewing === entry.id) {
      try { stopAll(); } catch {}
      setPreviewing(null);
      return;
    }
    setPreviewing(entry.id);
    try { stopAll(); } catch {}
    await ensureAudio("piano");
    const song = entry.build();
    const secPerBeat = 60 / entry.bpm;
    const start = Tone.now() + 0.05;
    // Cap preview to ~10s of audio for snappy browsing
    const limit = 10;
    let lastEnd = 0;
    song.notes.forEach((n) => {
      const t = n.time * secPerBeat;
      if (t > limit) return;
      const d = Math.max(0.08, n.duration * secPerBeat);
      lastEnd = Math.max(lastEnd, t + d);
      try { playNote(n.note, d, start + t, 0.85, "piano"); } catch {}
    });
    window.setTimeout(() => {
      setPreviewing((cur) => (cur === entry.id ? null : cur));
    }, Math.min(limit, lastEnd + 0.4) * 1000);
  };

  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="max-w-7xl mx-auto px-4 md:px-6 pt-10 md:pt-12 pb-6 text-center animate-float-up">
        <p className="text-[10px] uppercase tracking-[0.4em] text-primary mb-3">— Online Catalog —</p>
        <h1 className="font-serif text-3xl md:text-5xl">Hear it. Then keep it.</h1>
        <p className="mt-3 max-w-xl mx-auto text-muted-foreground text-sm md:text-base">
          A growing library of free, public-domain melodies. Tap <em>Preview</em> for a short in-browser performance, then <em>Add</em> to drop it into your <Link to="/songs" className="text-primary hover:underline">song hall</Link>.
        </p>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-6 pb-4 animate-float-up">
        <div className="rounded-2xl border border-border bg-card/30 backdrop-blur p-4 md:p-5 flex flex-col gap-3">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, composer, mood…"
              className="flex-1 h-10 px-3 rounded-md bg-background/60 border border-border focus:border-primary outline-none text-sm"
              aria-label="Search online catalog"
            />
            <div className="flex items-center gap-1 rounded-full border border-border p-1 bg-background/40">
              {(["all", "piano", "guitar"] as const).map((inst) => (
                <button key={inst} onClick={() => setInstrumentFilter(inst)}
                  className={`px-3 py-1 text-xs rounded-full capitalize transition ${
                    instrumentFilter === inst ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}>
                  {inst === "all" ? "All instruments" : inst}
                </button>
              ))}
            </div>
          </div>
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setActiveTag(null)}
                className={`px-2.5 py-1 text-[11px] uppercase tracking-wider rounded-full border transition ${
                  !activeTag ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:border-primary/60"
                }`}>All</button>
              {allTags.map((t) => (
                <button key={t} onClick={() => setActiveTag(activeTag === t ? null : t)}
                  className={`px-2.5 py-1 text-[11px] uppercase tracking-wider rounded-full border transition ${
                    activeTag === t ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:border-primary/60"
                  }`}>#{t}</button>
              ))}
            </div>
          )}
          <p className="text-[11px] text-muted-foreground">{visible.length} of {ONLINE_CATALOG.length} pieces</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-6 pb-16 animate-float-up">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {visible.length === 0 && (
            <p className="sm:col-span-2 lg:col-span-3 text-center text-sm text-muted-foreground py-12">Nothing matches those filters.</p>
          )}
          {visible.map((entry) => {
            const already = owned.has(`import-${entry.id}`);
            const isPlaying = previewing === entry.id;
            return (
              <article key={entry.id} className="rounded-xl border border-border bg-card/30 p-4 hover:border-primary/60 transition flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-primary truncate">{entry.composer}</p>
                    <h2 className="font-serif text-lg mt-0.5 truncate">{entry.title}</h2>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">{entry.bpm} BPM</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2lh]">{entry.description}</p>
                <div className="flex flex-wrap gap-1">
                  {(entry.tags ?? []).map((t) => (
                    <span key={t} className="px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-border text-muted-foreground">#{t}</span>
                  ))}
                  {(entry.instruments ?? []).map((i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-primary/40 text-primary capitalize">{i}</span>
                  ))}
                </div>
                <div className="flex gap-2 mt-1">
                  <button onClick={() => preview(entry)}
                    className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition border ${
                      isPlaying ? "bg-primary text-primary-foreground border-primary" : "border-primary/60 text-primary hover:bg-primary/10"
                    }`}>
                    {isPlaying ? "■ Stop preview" : "▶ Preview"}
                  </button>
                  <button disabled={already} onClick={() => addCustomSong(entry.build())}
                    className="flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition disabled:opacity-50 disabled:cursor-not-allowed bg-primary text-primary-foreground hover:opacity-90">
                    {already ? "✓ In library" : "+ Add"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}