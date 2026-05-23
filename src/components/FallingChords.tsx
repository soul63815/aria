import { useEffect, useMemo, useRef, useState } from "react";
import type { Song, ChordHit } from "@/lib/songs";
import { ensureAudio, playNote } from "@/lib/piano-engine";

const STRINGS = ["E2", "A2", "D3", "G3", "B3", "E4"];
const NOTE_ORDER = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
function transpose(note: string, semitones: number): string {
  const m = note.match(/^([A-G]#?)(\d+)$/); if (!m) return note;
  const idx = NOTE_ORDER.indexOf(m[1]);
  const total = idx + parseInt(m[2],10)*12 + semitones;
  return NOTE_ORDER[total%12] + Math.floor(total/12);
}

interface Props {
  song: Song;
  mode: "auto" | "practice";
  bpm: number;
  onClose: () => void;
}

export function FallingChords({ song, mode, bpm, onClose }: Props) {
  const chords: ChordHit[] = song.chords ?? [];
  const beatDur = 60 / bpm;
  const fallSec = 2.8;
  const totalSec = (Math.max(...chords.map((c) => c.time)) + 4) * beatDur;
  const [elapsed, setElapsed] = useState(0);
  const [perfect, setPerfect] = useState(0);
  const [missed, setMissed] = useState(0);
  const playedRef = useRef<Set<number>>(new Set());

  const strum = (c: ChordHit) => {
    c.frets.forEach((f, sIdx) => {
      if (f < 0) return;
      const note = transpose(STRINGS[sIdx], f);
      setTimeout(() => playNote(note, "1n", undefined, 0.85, "guitar"), sIdx * 30);
    });
  };

  useEffect(() => {
    let raf = 0; let mounted = true;
    (async () => {
      await ensureAudio("guitar");
      const t0 = performance.now() / 1000;
      const loop = () => {
        if (!mounted) return;
        setElapsed(performance.now() / 1000 - t0);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    })();
    return () => { mounted = false; cancelAnimationFrame(raf); };
  }, []);

  // Auto mode triggers strum
  useEffect(() => {
    if (mode !== "auto") return;
    chords.forEach((c, i) => {
      const at = c.time * beatDur;
      if (elapsed >= at && !playedRef.current.has(i)) {
        playedRef.current.add(i);
        strum(c);
      }
    });
  }, [elapsed, mode, chords, beatDur]);

  // Practice miss detection
  useEffect(() => {
    if (mode !== "practice") return;
    chords.forEach((c, i) => {
      const at = c.time * beatDur;
      if (elapsed > at + 0.35 && !playedRef.current.has(i)) {
        playedRef.current.add(i);
        setMissed((m) => m + 1);
      }
    });
  }, [elapsed, mode, chords, beatDur]);

  const visible = chords.map((c, i) => {
    const target = c.time * beatDur;
    const progress = 1 - (target - elapsed) / fallSec;
    if (progress < -0.1 || progress > 1.4) return null;
    return { ...c, i, progress };
  }).filter(Boolean) as Array<ChordHit & { i: number; progress: number }>;

  const tap = (i: number) => {
    const c = chords[i];
    if (!c) return;
    strum(c);
    if (mode === "practice") {
      const target = c.time * beatDur;
      const diff = Math.abs(elapsed - target);
      if (diff < 0.4 && !playedRef.current.has(i)) {
        playedRef.current.add(i);
        setPerfect((p) => p + 1);
      }
    }
  };

  const next = visible.find((v) => v.progress > 0.4 && !playedRef.current.has(v.i));
  const finished = elapsed > totalSec;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col animate-float-up">
      <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary">{mode === "auto" ? "Listen" : "Practice"} · Guitar</p>
          <h2 className="text-xl md:text-2xl font-serif">{song.title}</h2>
        </div>
        <div className="flex items-center gap-4">
          {mode === "practice" && (
            <p className="font-mono text-sm"><span className="text-primary">{perfect}</span> · <span className="text-destructive">{missed}</span></p>
          )}
          <button onClick={onClose} className="px-3 py-1.5 rounded-md border border-border text-sm hover:bg-secondary">Close</button>
        </div>
      </header>

      <div className="relative flex-1 overflow-hidden">
        {/* Lane backdrop */}
        <div className="absolute inset-x-0 top-0 bottom-28 grid grid-cols-6 gap-px">
          {STRINGS.map((s, i) => (
            <div key={i} className="border-l border-border/30 first:border-l-0 relative">
              <div className="absolute inset-x-0 top-0 text-center text-[10px] font-mono text-muted-foreground/60 py-1">{s.replace(/\d/, "")}</div>
            </div>
          ))}
        </div>

        {/* Hit bar */}
        <div className="absolute left-0 right-0 bottom-28 h-1 bg-primary shadow-[0_0_30px_var(--amber-glow)]" />

        {/* Falling chord cards */}
        {visible.map((v) => {
          const bottomPct = (1 - v.progress) * 75;
          return (
            <button
              key={v.i}
              onClick={() => tap(v.i)}
              className="absolute left-1/2 -translate-x-1/2 rounded-xl bg-gradient-to-b from-[var(--amber-glow)] to-[var(--amber)] text-[var(--ebony)] px-5 py-3 shadow-[0_0_30px_var(--amber)] flex flex-col items-center"
              style={{
                bottom: `calc(7rem + ${bottomPct}%)`,
                width: "min(82%, 380px)",
                opacity: v.progress > 1.1 ? 0.2 : 1,
                transition: "opacity 200ms",
              }}
            >
              <p className="font-serif text-3xl leading-none">{v.name}</p>
              <div className="flex gap-1 mt-2">
                {v.frets.map((f, i) => (
                  <span key={i} className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-mono ${f < 0 ? "bg-black/30 text-black/40" : "bg-[var(--ebony)]/80 text-[var(--ivory)]"}`}>{f < 0 ? "×" : f}</span>
                ))}
              </div>
              {v.flavor && <p className="text-[10px] uppercase tracking-widest mt-1 opacity-70">{v.flavor}</p>}
            </button>
          );
        })}

        {/* Bottom: full-width strum bar */}
        <div className="absolute bottom-0 left-0 right-0 h-28 p-3">
          <button
            onClick={() => next && tap(next.i)}
            onTouchStart={(e) => { e.preventDefault(); next && tap(next.i); }}
            className="w-full h-full rounded-xl border-2 border-primary/60 bg-card/60 hover:bg-card/80 flex flex-col items-center justify-center transition"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-primary">Strum</p>
            <p className="font-serif text-2xl mt-1">{next ? next.name : "—"}</p>
          </button>
        </div>

        {finished && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/85 backdrop-blur-sm">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-primary">Set ends</p>
              <h3 className="text-4xl font-serif mt-2">Encore?</h3>
              {mode === "practice" && <p className="text-muted-foreground mt-2">{perfect} clean · {missed} missed</p>}
              <button onClick={onClose} className="mt-5 px-6 py-2 rounded-md bg-primary text-primary-foreground">Return</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
