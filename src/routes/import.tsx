import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { transcribeAudioFile } from "@/lib/mp3-to-song";
import { addCustomSong, useCustomSongs, removeCustomSong } from "@/lib/custom-songs";

export const Route = createFileRoute("/import")({
  head: () => ({
    meta: [
      { title: "Import a song — Aria" },
      { name: "description", content: "Drop an MP3 or WAV. Aria sketches a melody script and adds it to your Song Hall." },
    ],
  }),
  component: ImportPage,
});

function ImportPage() {
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const songs = useCustomSongs();

  const handleFiles = async (files: FileList | null) => {
    if (!files || !files[0]) return;
    setBusy(true); setError(null); setProgress(0); setPhase("Reading file");
    try {
      const song = await transcribeAudioFile(files[0], (p) => {
        setProgress(p.progress); setPhase(p.phase);
      });
      addCustomSong(song);
    } catch (e: any) {
      setError(e?.message || "Could not read that file.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="max-w-3xl mx-auto px-4 md:px-6 pt-10 md:pt-16 pb-10 text-center animate-float-up">
        <p className="text-[10px] uppercase tracking-[0.4em] text-primary mb-3">— The transcribing booth —</p>
        <h1 className="font-serif text-4xl md:text-6xl">Bring your own song.</h1>
        <p className="mt-4 max-w-xl mx-auto text-muted-foreground text-sm md:text-base leading-relaxed">
          Drop an <strong>MP3</strong> or <strong>WAV</strong>. Aria listens for the dominant melody and writes a script
          you can play on the piano. Best results: solo vocal, piano, or guitar; under three minutes.
        </p>
      </section>

      <section className="max-w-3xl mx-auto px-4 md:px-6 pb-12 animate-float-up">
        <label
          onDragOver={(e) => { e.preventDefault(); }}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          className="block border-2 border-dashed border-primary/50 rounded-3xl p-10 md:p-14 text-center bg-card/30 hover:bg-card/50 transition cursor-pointer">
          <input ref={inputRef} type="file" accept="audio/*,.mp3,.wav,.m4a,.ogg"
                 onChange={(e) => handleFiles(e.target.files)} className="hidden" disabled={busy} />
          {!busy ? (
            <>
              <p className="text-6xl">↓</p>
              <p className="font-serif text-2xl mt-3">Drop audio here</p>
              <p className="text-muted-foreground text-sm mt-1">or tap to browse</p>
            </>
          ) : (
            <>
              <p className="font-serif text-xl">{phase}…</p>
              <div className="h-2 bg-secondary rounded-full mt-4 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[var(--amber)] to-[var(--amber-glow)] transition-all"
                     style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-2 font-mono">{Math.round(progress * 100)}%</p>
            </>
          )}
        </label>
        {error && <p className="mt-4 text-sm text-destructive text-center">{error}</p>}
      </section>

      <section className="max-w-3xl mx-auto px-4 md:px-6 pb-20">
        <h2 className="font-serif text-2xl mb-4">Your imported songs</h2>
        {songs.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nothing yet. Imported tracks appear in the Song Hall too.</p>
        ) : (
          <div className="space-y-3">
            {songs.map((s) => (
              <article key={s.id} className="rounded-xl border border-border bg-card/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-serif text-lg truncate">{s.title}</h3>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-primary mt-1">{s.notes.length} notes · {s.bpm} BPM</p>
                  </div>
                  <div className="flex gap-2">
                    <Link to="/songs" className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs">Open in Hall</Link>
                    <button onClick={() => removeCustomSong(s.id)} className="px-3 py-1.5 rounded-md border border-border text-xs hover:border-destructive">Delete</button>
                  </div>
                </div>
                {s.script && (
                  <pre className="mt-3 p-3 rounded-md bg-background/60 text-xs font-mono whitespace-pre-wrap max-h-40 overflow-auto">{s.script}</pre>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}