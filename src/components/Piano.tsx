import { useEffect, useMemo, useRef, useState } from "react";
import { playNote, ensureAudio, type InstrumentId } from "@/lib/piano-engine";

/**
 * Build keys across `startOctave`..`endOctave`.
 * Returns array of { note, isBlack, whiteIndex } so we can absolute-position black keys.
 */
function buildKeys(startOctave: number, endOctave: number) {
  const whites = ["C", "D", "E", "F", "G", "A", "B"];
  const blackAfter: Record<string, string> = { C: "C#", D: "D#", F: "F#", G: "G#", A: "A#" };
  const keys: { note: string; isBlack: boolean; whiteIndex: number }[] = [];
  let whiteIdx = 0;
  for (let o = startOctave; o <= endOctave; o++) {
    for (const w of whites) {
      keys.push({ note: `${w}${o}`, isBlack: false, whiteIndex: whiteIdx });
      if (blackAfter[w]) {
        keys.push({ note: `${blackAfter[w]}${o}`, isBlack: true, whiteIndex: whiteIdx });
      }
      whiteIdx++;
    }
  }
  return { keys, whiteCount: whiteIdx };
}

// Computer keyboard mapping (two rows = two octaves)
const KEY_MAP: Record<string, string> = {
  a: "C4", w: "C#4", s: "D4", e: "D#4", d: "E4", f: "F4", t: "F#4",
  g: "G4", y: "G#4", h: "A4", u: "A#4", j: "B4",
  k: "C5", o: "C#5", l: "D5", p: "D#5", ";": "E5",
};

interface PianoProps {
  startOctave?: number;
  endOctave?: number;
  /** Notes that should be visually highlighted (e.g., from falling tiles) */
  highlightedNotes?: Set<string>;
  onNotePlayed?: (note: string) => void;
  instrument?: InstrumentId;
}

export function Piano({ startOctave = 3, endOctave = 5, highlightedNotes, onNotePlayed, instrument = "piano" }: PianoProps) {
  const { keys, whiteCount } = useMemo(() => buildKeys(startOctave, endOctave), [startOctave, endOctave]);
  const [active, setActive] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  const press = async (note: string) => {
    await ensureAudio(instrument);
    playNote(note, "4n", undefined, 0.85, instrument);
    setActive((s) => new Set(s).add(note));
    onNotePlayed?.(note);
    setTimeout(() => {
      setActive((s) => {
        const n = new Set(s);
        n.delete(note);
        return n;
      });
    }, 220);
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const n = KEY_MAP[e.key.toLowerCase()];
      if (n) press(n);
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const whiteKeyWidth = 100 / whiteCount;

  return (
    <div ref={containerRef} className="relative w-full select-none" style={{ aspectRatio: `${whiteCount * 0.18} / 1` }}>
      {/* White keys */}
      <div className="absolute inset-0 flex">
        {keys
          .filter((k) => !k.isBlack)
          .map((k) => {
            const isActive = active.has(k.note) || highlightedNotes?.has(k.note);
            return (
              <button
                key={k.note}
                onMouseDown={() => press(k.note)}
                onTouchStart={(e) => {
                  e.preventDefault();
                  press(k.note);
                }}
                className={`piano-key-white flex-1 mx-[1px] flex flex-col items-center justify-end pb-2 text-[10px] text-muted-foreground/80 ${isActive ? "active" : ""}`}
                aria-label={k.note}
              >
                <span className="font-mono text-[10px] leading-none">{k.note.replace(/\d/, "")}</span>
                {k.note.startsWith("C") && <span className="font-mono text-[8px] opacity-60 mt-0.5">{k.note}</span>}
              </button>
            );
          })}
      </div>
      {/* Black keys */}
      <div className="absolute top-0 left-0 right-0 h-[62%] pointer-events-none">
        {keys
          .filter((k) => k.isBlack)
          .map((k) => {
            const isActive = active.has(k.note) || highlightedNotes?.has(k.note);
            const left = (k.whiteIndex + 1) * whiteKeyWidth - whiteKeyWidth * 0.3;
            return (
              <button
                key={k.note}
                onMouseDown={() => press(k.note)}
                onTouchStart={(e) => {
                  e.preventDefault();
                  press(k.note);
                }}
                className={`piano-key-black absolute pointer-events-auto flex items-end justify-center pb-1 text-[8px] font-mono text-ivory/70 ${isActive ? "active" : ""}`}
                style={{
                  left: `${left}%`,
                  width: `${whiteKeyWidth * 0.6}%`,
                  height: "100%",
                }}
                aria-label={k.note}
              >
                {k.note.replace(/\d/, "")}
              </button>
            );
          })}
      </div>
    </div>
  );
}