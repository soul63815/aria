import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { FallingTiles } from "@/components/FallingTiles";
import { ScriptBook } from "@/components/ScriptBook";
import { SONGS, type Song } from "@/lib/songs";
import { ensureAudio, preloadForSong } from "@/lib/piano-engine";
import { useCustomSongs, removeCustomSong } from "@/lib/custom-songs";
import { addCustomSong } from "@/lib/custom-songs";
import { ONLINE_CATALOG } from "@/lib/online-catalog";
import { useSettings } from "@/lib/settings-store";
import { useAuth } from "@/lib/auth-store";
import { saveSongToCloud, downloadSongJson } from "@/lib/saved-songs";
import { Link } from "@tanstack/react-router";
import goldenBrownCover from "@/assets/golden-brown-cover.png";

export const Route = createFileRoute("/songs")({
  head: () => ({
    meta: [
      { title: "Song Hall — Aria" },
      { name: "description", content: "Listen or practice Golden Brown, Night Drive (phonk), House of the Rising Sun, Für Elise, Moonlight Sonata, Ode to Joy, Canon in D and more — falling-tile guidance, themed rooms." },
      { property: "og:title", content: "Song Hall — Falling tiles & themed rooms" },
      { property: "og:description", content: "Pick a piece. The room reshapes around it. Beloved tracks shake the hall." },
    ],
  }),
  component: SongsPage,
});

function SongsPage() {
  const [active, setActive] = useState<{ song: Song; mode: "auto" | "practice" } | null>(null);
  const [hoveredTheme, setHoveredTheme] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [instrumentFilter, setInstrumentFilter] = useState<"all" | "piano" | "guitar">("all");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const custom = useCustomSongs();
  const settings = useSettings();
  const { user } = useAuth();
  const allSongs: Song[] = [...custom, ...SONGS];

  const allTags = useMemo(() => {
    const set = new Set<string>();
    allSongs.forEach((s) => s.tags?.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [allSongs]);

  const visibleSongs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allSongs.filter((s) => {
      if (instrumentFilter !== "all") {
        const insts = s.instruments ?? ["piano"];
        if (!insts.includes(instrumentFilter)) return false;
      }
      if (activeTag && !s.tags?.includes(activeTag)) return false;
      if (!q) return true;
      return (
        s.title.toLowerCase().includes(q) ||
        s.composer.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags?.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [allSongs, query, instrumentFilter, activeTag]);

  useEffect(() => {
    if (active) document.documentElement.setAttribute("data-theme", active.song.theme);
    else if (hoveredTheme) document.documentElement.setAttribute("data-theme", hoveredTheme);
    else document.documentElement.removeAttribute("data-theme");
  }, [active, hoveredTheme]);

  const start = async (song: Song, mode: "auto" | "practice") => {
    setActive({ song, mode });
    const insts = Array.from(new Set(["piano", ...song.notes.map((n) => n.instrument).filter(Boolean) as string[]]));
    void preloadForSong(insts as any).then(() => ensureAudio("piano")).catch(() => undefined);
    if (song.beloved) {
      setShake(true);
      setTimeout(() => setShake(false), 950);
    }
  };

  const handleSave = async (song: Song) => {
    if (!user) return;
    setSavingId(song.id);
    try {
      await saveSongToCloud(song);
      setSavedFlash(song.id);
      setTimeout(() => setSavedFlash(null), 1600);
    } catch (e) { console.error(e); }
    finally { setSavingId(null); }
  };

  return (
    <main className={`min-h-screen ${shake ? "beloved-shake" : ""}`}>
      <SiteHeader />
      <section className="max-w-7xl mx-auto px-4 md:px-6 pt-10 md:pt-12 pb-6 text-center animate-float-up">
        <p className="text-[10px] uppercase tracking-[0.4em] text-primary mb-3">— The Song Hall —</p>
        <h1 className="font-serif text-3xl md:text-6xl">Hover to taste the room.</h1>
        <p className="mt-3 max-w-xl mx-auto text-muted-foreground text-sm md:text-base">
          Each piece carries its own color of light. <em>Listen</em> opens an automatic performance with falling tiles; <em>Practice</em> waits for your tap. Beloved tracks shake the hall.
        </p>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-6 pb-6 animate-float-up">
        <ScriptBook />
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
              aria-label="Search songs"
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
          <p className="text-[11px] text-muted-foreground">
            {visibleSongs.length} of {allSongs.length} songs · <Link to="/online" className="text-primary hover:underline">Browse the online catalog →</Link>
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-6 pb-8 animate-float-up">
        <div className="rounded-2xl border border-border bg-card/30 backdrop-blur p-5 md:p-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Browse online catalog</p>
              <h2 className="font-serif text-xl md:text-2xl mt-1">Add a new song with one tap</h2>
            </div>
            <p className="text-xs text-muted-foreground">Free traditional & public-domain melodies. Imports save to your library.</p>
          </div>
          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ONLINE_CATALOG.map((c) => {
              const already = allSongs.some((s) => s.id === `import-${c.id}`);
              return (
                <div key={c.id} className="rounded-xl border border-border p-3 hover:border-primary/60 transition">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-primary">{c.composer}</p>
                  <h3 className="font-serif text-lg mt-0.5">{c.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.description}</p>
                  <button disabled={already} onClick={() => addCustomSong(c.build())}
                    className="mt-3 w-full px-3 py-1.5 rounded-md text-xs font-medium transition disabled:opacity-50 disabled:cursor-not-allowed bg-primary text-primary-foreground hover:opacity-90">
                    {already ? "✓ Added" : "+ Add to library"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-6 pb-16 animate-float-up">
        <div className="grid md:grid-cols-2 gap-4 md:gap-5">
          {visibleSongs.length === 0 && (
            <p className="md:col-span-2 text-center text-sm text-muted-foreground py-12">No songs match your filters.</p>
          )}
          {visibleSongs.map((song) => {
            const isGB = song.id === "golden-brown";
            const isCustom = song.id.startsWith("import-");
            return (
              <article key={song.id}
                onMouseEnter={() => setHoveredTheme(song.theme)} onMouseLeave={() => setHoveredTheme(null)}
                className={`group relative overflow-hidden bg-card/40 backdrop-blur border ${song.beloved ? "border-primary/60" : "border-border"} rounded-2xl p-5 md:p-6 hover:border-primary transition-all hover:shadow-[var(--shadow-warm)] ${isGB ? "md:col-span-2" : ""}`}>
                <div className="flex gap-4 md:gap-5 items-start">
                  {isGB && (
                    <img src={goldenBrownCover} alt="Golden Brown by The Stranglers — single cover"
                         className="w-24 h-24 md:w-32 md:h-32 rounded-md object-cover border border-border shadow-lg flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-primary truncate">{song.composer}{isCustom && " · yours"}</p>
                        <h3 className="font-serif text-xl md:text-3xl mt-1 flex items-center gap-2">
                          {song.title}
                          {song.beloved && <span className="text-xs text-primary">★</span>}
                        </h3>
                      </div>
                      <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">{song.bpm} BPM</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 md:mt-3 leading-relaxed">{song.description}</p>
                    <div className="flex gap-2 mt-4 md:mt-5">
                      <button onClick={() => start(song, "auto")}
                        className="flex-1 px-3 md:px-4 py-2 md:py-2.5 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition">▶ Listen</button>
                      <button onClick={() => start(song, "practice")}
                        className="flex-1 px-3 md:px-4 py-2 md:py-2.5 rounded-md border border-primary/60 text-primary hover:bg-primary/10 font-medium text-sm transition">✦ Practice</button>
                      {isCustom && (
                        <button onClick={() => removeCustomSong(song.id)}
                          className="px-3 py-2 rounded-md border border-border text-xs text-muted-foreground hover:border-destructive hover:text-destructive">Delete</button>
                      )}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => downloadSongJson(song)}
                        className="flex-1 px-3 py-1.5 rounded-md border border-border text-xs text-muted-foreground hover:border-primary hover:text-primary">
                        ⇩ Download .json
                      </button>
                      {user ? (
                        <button disabled={savingId === song.id} onClick={() => handleSave(song)}
                          className="flex-1 px-3 py-1.5 rounded-md border border-primary/40 text-xs text-primary hover:bg-primary/10 disabled:opacity-60">
                          {savedFlash === song.id ? "✓ Saved to cloud" : savingId === song.id ? "Saving…" : "☁ Save to cloud"}
                        </button>
                      ) : (
                        <Link to="/login" className="flex-1 text-center px-3 py-1.5 rounded-md border border-border text-xs text-muted-foreground hover:border-primary hover:text-primary">
                          Sign in to save & download from any device
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {active && (
        <FallingTiles song={active.song} mode={active.mode} speed={settings.tempo} onClose={() => setActive(null)} />
      )}
    </main>
  );
}
