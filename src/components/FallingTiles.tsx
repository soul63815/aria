import { useEffect, useMemo, useRef, useState } from "react";
import type { Song } from "@/lib/songs";
import { ensureAudio, playNote } from "@/lib/piano-engine";

interface FallingTilesProps {
  song: Song;
  mode: "auto" | "practice";
  /** tempo multiplier, defaults to 1 */
  speed?: number;
  onClose: () => void;
}

export function FallingTiles({ song, mode, speed = 1, onClose }: FallingTilesProps) {
  // Only piano-instrument notes form lanes (bass/drums play in background)
  const melodyNotes = useMemo(
    () => song.notes.filter((n) => !n.instrument || n.instrument === "piano"),
    [song]
  );
  const lanes = useMemo(() => {
    const set = new Set(melodyNotes.map((n) => n.note));
    return Array.from(set).sort((a, b) => noteRank(a) - noteRank(b)).slice(0, 8);
  }, [melodyNotes]);
  const safeLanes = lanes.length > 0 ? lanes : ["C4"];

  const beatDuration = (60 / song.bpm) / speed;
  const fallSeconds = 2.4;
  const totalBeats = useMemo(
    () => Math.max(4, ...song.notes.map((n) => n.time + n.duration)) + 4,
    [song]
  );
  const totalDurationSec = totalBeats * beatDuration;

  const [elapsed, setElapsed] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const triggeredRef = useRef<Set<number>>(new Set());
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [bursts, setBursts] = useState<Array<{ id: number; lane: number }>>([]);
  const [barFlash, setBarFlash] = useState(0);
  const burstId = useRef(0);

  // Start loop + always play background instruments in auto OR practice
  useEffect(() => {
    let raf = 0; let mounted = true;
    (async () => {
      await ensureAudio("piano");
      // preload background
      const bgInsts = new Set(song.notes.map((n) => n.instrument).filter(Boolean) as string[]);
      await Promise.all(Array.from(bgInsts).map((i) => ensureAudio(i as any)));
      const t0 = performance.now() / 1000;
      setStartedAt(t0);
      const loop = () => {
        if (!mounted) return;
        setElapsed(performance.now() / 1000 - t0);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    })();
    return () => { mounted = false; cancelAnimationFrame(raf); };
  }, [song, speed]);

  // Auto: trigger melody. Always: trigger background instruments.
  useEffect(() => {
    if (startedAt == null) return;
    song.notes.forEach((n, i) => {
      const isMelody = !n.instrument || n.instrument === "piano";
      if (mode === "practice" && isMelody) return; // user plays melody in practice
      const start = n.time * beatDuration;
      if (elapsed >= start && !triggeredRef.current.has(i)) {
        triggeredRef.current.add(i);
        playNote(n.note, Math.max(0.2, n.duration * beatDuration), undefined, 0.85, (n.instrument as any) ?? "piano");
      }
    });
  }, [elapsed, mode, song.notes, beatDuration, startedAt]);

  const visibleNotes = melodyNotes
    .map((n, i) => {
      const targetSec = n.time * beatDuration;
      const start = targetSec - fallSeconds;
      const end = targetSec + n.duration * beatDuration;
      if (elapsed < start - 0.1 || elapsed > end + 0.3) return null;
      const lane = safeLanes.indexOf(n.note);
      if (lane < 0) return null;
      const progress = (elapsed - start) / fallSeconds;
      const heightFrac = (n.duration * beatDuration) / fallSeconds;
      // melody index in full notes
      const fullIdx = song.notes.indexOf(n);
      return { i: fullIdx, lane, progress, heightFrac, note: n.note };
    })
    .filter(Boolean) as Array<{ i: number; lane: number; progress: number; heightFrac: number; note: string }>;

  const handleLaneTap = (lane: number) => {
    const noteStr = safeLanes[lane];
    playNote(noteStr, "8n", undefined, 0.9, "piano");
    const hit = visibleNotes.find((t) => t.lane === lane && Math.abs(t.progress - 1) < 0.22 && !triggeredRef.current.has(t.i));
    if (hit) {
      triggeredRef.current.add(hit.i);
      setHits((h) => h + 1);
      setBarFlash((x) => x + 1);
      const id = ++burstId.current;
      setBursts((b) => [...b, { id, lane }]);
      setTimeout(() => setBursts((b) => b.filter((x) => x.id !== id)), 500);
    } else {
      setMisses((m) => m + 1);
    }
  };

  const finished = startedAt != null && elapsed > totalDurationSec;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col animate-float-up">
      <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary">{mode === "auto" ? "Listening" : "Practice"}</p>
          <h2 className="text-lg md:text-2xl font-serif truncate">{song.title} <span className="text-muted-foreground text-sm">— {song.composer}</span></h2>
        </div>
        <div className="flex items-center gap-3 md:gap-6 flex-shrink-0">
          {mode === "practice" && (
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">Hits / Misses</p>
              <p className="font-mono"><span className="text-primary">{hits}</span> / <span className="text-destructive">{misses}</span></p>
            </div>
          )}
          <button onClick={onClose} className="px-3 py-1.5 rounded-md border border-border hover:bg-secondary text-sm">Close</button>
        </div>
      </header>

      <div className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${safeLanes.length}, 1fr)` }}>
          {safeLanes.map((_, idx) => (
            <div key={idx} className="border-l border-border/40 first:border-l-0 relative">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-primary/5" />
            </div>
          ))}
        </div>

        <div key={barFlash} className={`absolute left-0 right-0 bottom-24 h-1 bg-primary/80 shadow-[0_0_30px_var(--amber)] ${barFlash ? "bar-flash" : ""}`} />

        {visibleNotes.map((t) => {
          const laneWidth = 100 / safeLanes.length;
          const tileHeight = Math.max(8, t.heightFrac * 100);
          const bottomPct = (1 - t.progress) * 80;
          return (
            <div
              key={`${t.i}-${t.note}`}
              className="absolute rounded-md bg-gradient-to-b from-[var(--amber-glow)] to-[var(--amber)] shadow-[0_0_20px_var(--amber)]"
              style={{
                left: `${t.lane * laneWidth + 0.5}%`,
                width: `${laneWidth - 1}%`,
                bottom: `calc(6rem + ${bottomPct}%)`,
                height: `${tileHeight}%`,
                opacity: t.progress > 1.25 ? 0 : 1,
                transition: "opacity 200ms",
              }}
            >
              <div className="absolute bottom-1 left-0 right-0 text-center text-[10px] font-mono text-[var(--ebony)]">{t.note}</div>
            </div>
          );
        })}

        {/* hit bursts */}
        {bursts.map((b) => {
          const laneWidth = 100 / safeLanes.length;
          return (
            <div
              key={b.id}
              className="absolute pointer-events-none rounded-full bg-[var(--amber-glow)] hit-burst"
              style={{
                left: `${b.lane * laneWidth + laneWidth / 2}%`,
                bottom: "6rem",
                width: 60, height: 60,
                transform: "translate(-50%, 50%)",
              }}
            />
          );
        })}

        <div className="absolute left-0 right-0 bottom-0 h-24 grid" style={{ gridTemplateColumns: `repeat(${safeLanes.length}, 1fr)` }}>
          {safeLanes.map((n, idx) => (
            <button
              key={n}
              onMouseDown={() => handleLaneTap(idx)}
              onTouchStart={(e) => { e.preventDefault(); handleLaneTap(idx); }}
              className="piano-key-white mx-[2px] flex items-end justify-center pb-3 text-[10px] font-mono text-muted-foreground/80"
            >
              {n}
            </button>
          ))}
        </div>

        {finished && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/85 backdrop-blur-sm animate-float-up">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-primary">Finale</p>
              <h3 className="text-4xl font-serif mt-2">Bravo.</h3>
              <p className="text-muted-foreground mt-2">{song.title} — performed.</p>
              {mode === "practice" && <p className="text-muted-foreground mt-1">{hits} clean · {misses} missed</p>}
              <button onClick={onClose} className="mt-6 px-6 py-2 rounded-md bg-primary text-primary-foreground">Return to library</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function noteRank(n: string): number {
  const m = n.match(/^([A-G])(#|b)?(-?\d+)$/);
  if (!m) return 0;
  const order: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  let v = order[m[1]];
  if (m[2] === "#") v++;
  if (m[2] === "b") v--;
  return v + parseInt(m[3], 10) * 12;
}
