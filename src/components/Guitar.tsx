import { useEffect, useRef, useState } from "react";
import { ensureAudio, playNote } from "@/lib/piano-engine";

// Standard tuning, low to high: E2 A2 D3 G3 B3 E4
const DEFAULT_STRINGS = ["E2", "A2", "D3", "G3", "B3", "E4"];
const STRING_LABELS = ["E", "A", "D", "G", "B", "e"];
const FRETS = 15;

const NOTE_ORDER = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function transpose(note: string, semitones: number): string {
  const m = note.match(/^([A-G]#?)(\d+)$/);
  if (!m) return note;
  const idx = NOTE_ORDER.indexOf(m[1]);
  const total = idx + parseInt(m[2], 10) * 12 + semitones;
  return NOTE_ORDER[total % 12] + Math.floor(total / 12);
}

const TUNING_PRESETS: Record<string, number[]> = {
  Standard: [0, 0, 0, 0, 0, 0],
  "Drop D": [-2, 0, 0, 0, 0, 0],
  "Half-step down": [-1, -1, -1, -1, -1, -1],
  "Open G": [-2, -2, 0, 0, 0, -2],
  "Open D": [-2, 0, 0, -1, -2, -2],
  DADGAD: [-2, 0, 0, 0, -2, -2],
};

export function Guitar() {
  const [active, setActive] = useState<string | null>(null);
  const [stringPulse, setStringPulse] = useState<number | null>(null);
  const [tuningName, setTuningName] = useState<keyof typeof TUNING_PRESETS | string>("Standard");
  const [offsets, setOffsets] = useState<number[]>(TUNING_PRESETS.Standard);
  const [capo, setCapo] = useState(0);
  const strumLockRef = useRef(false);
  const lastStringRef = useRef<number | null>(null);

  const STRINGS = DEFAULT_STRINGS.map((n, i) => transpose(n, offsets[i] + capo));

  const pluck = async (stringIdx: number, fret: number) => {
    await ensureAudio("guitar");
    const open = STRINGS[stringIdx];
    const note = transpose(open, fret);
    playNote(note, "2n", undefined, 0.9, "guitar");
    setActive(`${stringIdx}-${fret}`);
    setStringPulse(stringIdx);
    setTimeout(() => setActive(null), 220);
    setTimeout(() => setStringPulse(null), 600);
  };

  const strumAll = async (direction: "down" | "up", fret = 0) => {
    await ensureAudio("guitar");
    const order = direction === "down" ? [0, 1, 2, 3, 4, 5] : [5, 4, 3, 2, 1, 0];
    order.forEach((i, k) => setTimeout(() => {
      playNote(transpose(STRINGS[i], fret), "2n", undefined, 0.8, "guitar");
      setStringPulse(i);
      setTimeout(() => setStringPulse((p) => (p === i ? null : p)), 320);
    }, k * 28));
  };

  // Pointer-based slide across strings: drag finger/mouse over the strum pad
  const onStrumPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const idx = Math.max(0, Math.min(5, Math.floor((y / rect.height) * 6)));
    if (lastStringRef.current === idx) return;
    lastStringRef.current = idx;
    pluck(idx, 0);
  };

  const fretMarkers = [3, 5, 7, 9, 12, 15];

  return (
    <div className="w-full pb-4">
      {/* Tuning controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4 px-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.3em] text-primary">Tuning</span>
          <select
            value={tuningName}
            onChange={(e) => {
              const v = e.target.value;
              setTuningName(v);
              setOffsets(TUNING_PRESETS[v] ?? TUNING_PRESETS.Standard);
            }}
            className="bg-secondary/40 border border-border rounded text-xs px-2 py-1"
          >
            {Object.keys(TUNING_PRESETS).map((k) => <option key={k}>{k}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1">
          {offsets.map((o, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="text-[9px] font-mono text-muted-foreground">{STRINGS[i].replace(/\d/, "")}</span>
              <div className="flex">
                <button
                  onClick={() => { const n = offsets.slice(); n[i] = Math.max(-5, n[i] - 1); setOffsets(n); setTuningName("Custom"); }}
                  className="w-5 h-5 rounded-l bg-secondary/60 hover:bg-primary/20 text-xs">−</button>
                <button
                  onClick={() => { const n = offsets.slice(); n[i] = Math.min(5, n[i] + 1); setOffsets(n); setTuningName("Custom"); }}
                  className="w-5 h-5 rounded-r bg-secondary/60 hover:bg-primary/20 text-xs">+</button>
              </div>
              <span className="text-[8px] font-mono text-primary">{o > 0 ? "+" : ""}{o}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.3em] text-primary">Capo</span>
          <input type="range" min={0} max={9} value={capo} onChange={(e) => setCapo(+e.target.value)} className="w-24 accent-[var(--amber)]" />
          <span className="text-xs font-mono w-6">{capo}</span>
        </div>
        <div className="flex-1" />
        <button onClick={() => strumAll("down")} className="px-3 py-1.5 rounded-md border border-primary/50 text-xs text-primary hover:bg-primary/10">↓ Strum down</button>
        <button onClick={() => strumAll("up")} className="px-3 py-1.5 rounded-md border border-primary/50 text-xs text-primary hover:bg-primary/10">↑ Strum up</button>
      </div>

      <div className="overflow-x-auto">
      <div className="min-w-[960px] relative flex gap-2">
        <div className="flex-1">
        {/* Headstock area */}
        <div className="grid mb-2" style={{ gridTemplateColumns: `80px repeat(${FRETS}, 1fr)` }}>
          <div />
          {Array.from({ length: FRETS }).map((_, i) => (
            <div key={i} className="text-center text-[10px] font-mono text-muted-foreground">
              {fretMarkers.includes(i + 1) ? i + 1 : ""}
            </div>
          ))}
        </div>

        {/* Fretboard */}
        <div
          className="rounded-md p-3 relative"
          style={{
            background: "linear-gradient(180deg, oklch(0.22 0.04 45) 0%, oklch(0.14 0.03 40) 100%)",
            boxShadow: "inset 0 0 30px oklch(0 0 0 / 50%), 0 12px 40px oklch(0 0 0 / 40%)",
          }}
        >
          {STRINGS.map((open, sIdx) => (
            <div
              key={sIdx}
              className="grid items-center relative"
              style={{ gridTemplateColumns: `80px repeat(${FRETS}, 1fr)`, height: 38 }}
            >
              {/* Open string button */}
              <button
                onMouseDown={() => pluck(sIdx, 0)}
                onTouchStart={(e) => { e.preventDefault(); pluck(sIdx, 0); }}
                className="h-8 mr-2 rounded-sm border border-primary/40 bg-card/60 text-xs font-mono text-primary hover:bg-primary/10 transition flex items-center justify-center"
              >
                {STRING_LABELS[sIdx]} ({open})
              </button>

              {/* String line (visual) */}
              <div
                className="absolute pointer-events-none"
                style={{
                  left: 80,
                  right: 0,
                  top: "50%",
                  height: sIdx < 3 ? 2.5 - sIdx * 0.3 : 1.4 - (sIdx - 3) * 0.2,
                  background: "linear-gradient(180deg, oklch(0.85 0.04 80), oklch(0.6 0.05 70))",
                  boxShadow: stringPulse === sIdx ? "0 0 12px var(--amber)" : "0 1px 2px oklch(0 0 0 / 60%)",
                  transform: stringPulse === sIdx ? "translateY(-50%) scaleY(2)" : "translateY(-50%)",
                  transition: "all 200ms ease",
                }}
              />

              {/* Frets */}
              {Array.from({ length: FRETS }).map((_, f) => {
                const fret = f + 1;
                const id = `${sIdx}-${fret}`;
                const isActive = active === id;
                const isMarker = fretMarkers.includes(fret) && sIdx === 2; // dots on middle strings
                const isDouble = fret === 12 && (sIdx === 1 || sIdx === 4);
                return (
                  <button
                    key={f}
                    onMouseDown={() => pluck(sIdx, fret)}
                    onTouchStart={(e) => { e.preventDefault(); pluck(sIdx, fret); }}
                    className="relative h-full border-r border-l border-l-transparent flex items-center justify-center"
                    style={{
                      borderRightColor: "oklch(0.75 0.06 70 / 50%)",
                      borderRightWidth: fret === 0 ? 3 : 1.5,
                    }}
                  >
                    {(isMarker || isDouble) && (
                      <span className="absolute w-2 h-2 rounded-full bg-[var(--amber)]/40" />
                    )}
                    <span className="absolute text-[8px] font-mono text-ivory/40 top-0.5">
                      {transpose(open, fret).replace(/\d/, "")}
                    </span>
                    {isActive && (
                      <span
                        className="absolute w-7 h-7 rounded-full bg-gradient-to-br from-[var(--amber-glow)] to-[var(--amber)] flex items-center justify-center text-[10px] font-mono text-[var(--ebony)] animate-glow"
                      >
                        {transpose(open, fret).replace(/\d/, "")}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        </div>

        {/* Strum/Slide pad */}
        <div
          onPointerDown={(e) => { strumLockRef.current = true; lastStringRef.current = null; onStrumPointer(e); }}
          onPointerMove={(e) => { if (strumLockRef.current) onStrumPointer(e); }}
          onPointerUp={() => { strumLockRef.current = false; lastStringRef.current = null; }}
          onPointerLeave={() => { strumLockRef.current = false; lastStringRef.current = null; }}
          className="w-20 rounded-md border-2 border-dashed border-primary/40 bg-card/40 flex flex-col items-center justify-center select-none touch-none mt-7"
          style={{ background: "linear-gradient(180deg, oklch(0.22 0.04 45) 0%, oklch(0.14 0.03 40) 100%)" }}
          role="button"
          aria-label="Strum pad — drag to slide across strings"
        >
          <p className="text-[9px] uppercase tracking-[0.25em] text-primary writing-mode-vertical" style={{ writingMode: "vertical-rl" as any }}>
            Drag to strum
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}