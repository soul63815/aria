import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { FallingTiles } from "@/components/FallingTiles";
import { useAuth } from "@/lib/auth-store";
import { useSavedSongs, deleteSavedSong, downloadSongJson } from "@/lib/saved-songs";
import { addCustomSong } from "@/lib/custom-songs";
import type { Song } from "@/lib/songs";

export const Route = createFileRoute("/library")({
  head: () => ({ meta: [
    { title: "Your Library — Aria Music" },
    { name: "description", content: "Saved songs synced to your account. Download or play any composition from any device." },
  ] }),
  component: LibraryPage,
});

function LibraryPage() {
  const { user, loading } = useAuth();
  const { rows, reload } = useSavedSongs(user?.id);
  const [active, setActive] = useState<Song | null>(null);

  useEffect(() => { reload(); }, [user, reload]);

  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="max-w-5xl mx-auto px-4 md:px-6 pt-10 pb-16 animate-float-up">
        <p className="text-[10px] uppercase tracking-[0.4em] text-primary">— Your Library —</p>
        <h1 className="font-serif text-3xl md:text-5xl mt-2">Saved compositions</h1>
        <p className="text-muted-foreground text-sm mt-2 max-w-xl">
          Cloud-synced to your account. Download a song file to keep, or load it back into Aria on any device.
        </p>

        {loading ? (
          <p className="mt-10 text-muted-foreground text-sm">Loading…</p>
        ) : !user ? (
          <div className="mt-10 rounded-2xl border border-border bg-card/40 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              You aren't signed in yet. Sign in to save songs to the cloud and download them directly from here.
            </p>
            <Link to="/login" className="inline-block mt-4 px-5 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium">
              Sign in
            </Link>
          </div>
        ) : rows.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-border bg-card/40 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Nothing saved yet. Head to the <Link to="/songs" className="text-primary">Song Hall</Link> or the <Link to="/studio" className="text-primary">Studio</Link> and hit “Save to cloud”.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid md:grid-cols-2 gap-4">
            {rows.map((r) => (
              <article key={r.id} className="rounded-2xl border border-border bg-card/40 p-5 hover:border-primary transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-primary truncate">{r.data.composer}</p>
                    <h3 className="font-serif text-xl mt-1 truncate">{r.title}</h3>
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(r.created_at).toLocaleString()}</p>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">{r.data.bpm} BPM</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <button onClick={() => setActive(r.data)}
                    className="flex-1 px-3 py-2 rounded-md bg-primary text-primary-foreground text-xs font-medium">▶ Play</button>
                  <button onClick={() => downloadSongJson(r.data)}
                    className="flex-1 px-3 py-2 rounded-md border border-primary/60 text-primary text-xs font-medium hover:bg-primary/10">⇩ Download</button>
                  <button onClick={() => addCustomSong(r.data)}
                    className="px-3 py-2 rounded-md border border-border text-xs text-muted-foreground hover:border-primary">+ Library</button>
                  <button onClick={async () => { await deleteSavedSong(r.id); reload(); }}
                    className="px-3 py-2 rounded-md border border-border text-xs text-muted-foreground hover:border-destructive hover:text-destructive">Delete</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      {active && <FallingTiles song={active} mode="auto" onClose={() => setActive(null)} />}
    </main>
  );
}