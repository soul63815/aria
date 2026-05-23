import { useState } from "react";
import { SONGS, type Song } from "@/lib/songs";

interface Props {
  /** Optional list filter, e.g. only piano-friendly */
  filterIds?: string[];
}

export function ScriptBook({ filterIds }: Props) {
  const list = filterIds ? SONGS.filter((s) => filterIds.includes(s.id)) : SONGS;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Song>(list[0]);

  return (
    <div className="rounded-2xl border border-primary/40 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur p-4 md:p-5 shadow-[var(--shadow-warm)]">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-3 text-left">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--amber-glow)] to-[var(--amber)] flex items-center justify-center text-[var(--ebony)] font-serif">📖</span>
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-primary">The Script Book</p>
            <h3 className="font-serif text-xl">Open notation — read &amp; play</h3>
          </div>
        </div>
        <span className="text-primary text-sm">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="mt-4 grid md:grid-cols-[200px_1fr] gap-4 animate-float-up">
          <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible hide-scrollbar">
            {list.map((s) => (
              <button
                key={s.id}
                onClick={() => setActive(s)}
                className={`text-left px-3 py-2 rounded-md text-sm whitespace-nowrap md:whitespace-normal transition ${active.id === s.id ? "bg-primary text-primary-foreground" : "hover:bg-secondary/60 text-muted-foreground"}`}
              >
                {s.title}
              </button>
            ))}
          </div>
          <div className="bg-background/60 rounded-md p-4 border border-border min-h-[180px]">
            <p className="text-[10px] uppercase tracking-[0.3em] text-primary">{active.composer} · {active.bpm} BPM</p>
            <h4 className="font-serif text-2xl mt-1 mb-3">{active.title}</h4>
            <pre className="font-mono text-xs md:text-sm text-foreground whitespace-pre-wrap leading-relaxed">{active.script ?? "(no notation yet — listen in the Song Hall)"}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
