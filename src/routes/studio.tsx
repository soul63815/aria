import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import { SiteHeader } from "@/components/SiteHeader";
import { ensureAudio, playNote, type InstrumentId } from "@/lib/piano-engine";

export const Route = createFileRoute("/studio")({
  head: () => ({
    meta: [
      { title: "Studio — Make Your Own Song | Aria" },
      { name: "description", content: "Tap a 16-step grid, layer piano, bass, drums, harp and synth, add reverb and delay, record your own voice and enhance it. Your song, your hall." },
      { property: "og:title", content: "Aria Studio — Build a song from scratch" },
      { property: "og:description", content: "Beat sequencer + voice booth + FX. No login. Works offline." },
    ],
  }),
  component: StudioPage,
});

type TrackId = "drums" | "bass" | "piano" | "harp" | "synthlead" | "marimba";
interface Track {
  id: TrackId;
  name: string;
  instrument: InstrumentId;
  note: string;
  duration: string;
  color: string;
}
const STEPS = 16;
const TRACKS: Track[] = [
  { id: "drums",     name: "Kick",     instrument: "drums",     note: "C1", duration: "8n", color: "oklch(0.65 0.22 25)"  },
  { id: "drums",     name: "Snare",    instrument: "drums",     note: "D2", duration: "16n", color: "oklch(0.78 0.18 50)" },
  { id: "drums",     name: "Hi-Hat",   instrument: "drums",     note: "F#3", duration: "32n", color: "oklch(0.85 0.06 90)" },
  { id: "bass",      name: "Bass",     instrument: "bass",      note: "A1", duration: "8n", color: "oklch(0.7 0.2 305)"   },
  { id: "piano",     name: "Piano",    instrument: "piano",     note: "C4", duration: "8n", color: "oklch(0.78 0.14 70)"  },
  { id: "harp",      name: "Harp",     instrument: "harp",      note: "E4", duration: "4n", color: "oklch(0.8 0.12 180)"  },
  { id: "synthlead", name: "Lead",     instrument: "synthlead", note: "G4", duration: "8n", color: "oklch(0.78 0.18 130)" },
  { id: "marimba",   name: "Marimba",  instrument: "marimba",   note: "C5", duration: "16n", color: "oklch(0.82 0.14 90)" },
];
const NOTES = ["C", "D", "E", "F", "G", "A", "B"];
const OCTAVES = [1, 2, 3, 4, 5, 6];

function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numCh = buffer.numberOfChannels;
  const sr = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const samples = buffer.length;
  const blockAlign = (numCh * bitDepth) >> 3;
  const dataSize = samples * blockAlign;
  const ab = new ArrayBuffer(44 + dataSize);
  const view = new DataView(ab);
  const writeStr = (off: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); };
  writeStr(0, "RIFF"); view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE"); writeStr(12, "fmt ");
  view.setUint32(16, 16, true); view.setUint16(20, format, true); view.setUint16(22, numCh, true);
  view.setUint32(24, sr, true); view.setUint32(28, sr * blockAlign, true);
  view.setUint16(32, blockAlign, true); view.setUint16(34, bitDepth, true);
  writeStr(36, "data"); view.setUint32(40, dataSize, true);
  const chans: Float32Array[] = [];
  for (let c = 0; c < numCh; c++) chans.push(buffer.getChannelData(c));
  let off = 44;
  for (let i = 0; i < samples; i++) {
    for (let c = 0; c < numCh; c++) {
      let s = Math.max(-1, Math.min(1, chans[c][i]));
      view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      off += 2;
    }
  }
  return ab;
}

const PRESET_PATTERNS: Record<string, (ti: number, t: Track, step: number) => boolean> = {
  "Four-on-floor": (ti, t, s) => t.name === "Kick" ? s % 4 === 0
    : t.name === "Snare" ? s % 8 === 4
    : t.name === "Hi-Hat" ? s % 2 === 0
    : t.name === "Bass" ? s % 4 === 0 : false,
  "Phonk": (ti, t, s) => t.name === "Kick" ? (s === 0 || s === 6 || s === 10)
    : t.name === "Snare" ? (s === 4 || s === 12)
    : t.name === "Hi-Hat" ? s % 2 === 1
    : t.name === "Bass" ? (s === 0 || s === 3 || s === 8 || s === 11) : false,
  "Ballad": (ti, t, s) => t.name === "Kick" ? (s === 0 || s === 8)
    : t.name === "Snare" ? (s === 4 || s === 12)
    : t.name === "Piano" ? s % 4 === 0
    : t.name === "Harp" ? s === 0 || s === 8 : false,
};

function StudioPage() {
  // grid[trackIndex][step] = boolean
  const [grid, setGrid] = useState<boolean[][]>(() =>
    TRACKS.map(() => Array(STEPS).fill(false))
  );
  const [notes, setNotes] = useState<string[]>(TRACKS.map((t) => t.note));
  const [mutes, setMutes] = useState<boolean[]>(TRACKS.map(() => false));
  const [trackVols, setTrackVols] = useState<number[]>(TRACKS.map(() => 0.85));
  const [bpm, setBpm] = useState(110);
  const [swing, setSwing] = useState(0); // 0..0.5
  const [playing, setPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [reverbWet, setReverbWet] = useState(0.3);
  const [delayWet, setDelayWet] = useState(0.15);

  // Voice
  const [recording, setRecording] = useState(false);
  const [voiceUrl, setVoiceUrl] = useState<string | null>(null);
  const [voicePitch, setVoicePitch] = useState(0); // semitones
  const [voiceReverb, setVoiceReverb] = useState(0.4);
  const [voiceFilter, setVoiceFilter] = useState(8000);
  const [vocalLevel, setVocalLevel] = useState(0.8);

  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const voicePlayerRef = useRef<Tone.Player | null>(null);
  const voiceShifterRef = useRef<Tone.PitchShift | null>(null);
  const voiceReverbRef = useRef<Tone.Reverb | null>(null);
  const voiceFilterRef = useRef<Tone.Filter | null>(null);

  useEffect(() => { document.documentElement.removeAttribute("data-theme"); }, []);

  // Sequencer loop
  const loopRef = useRef<Tone.Sequence | null>(null);
  useEffect(() => {
    Tone.getTransport().bpm.value = bpm;
  }, [bpm]);
  useEffect(() => {
    Tone.getTransport().swing = swing;
    Tone.getTransport().swingSubdivision = "16n";
  }, [swing]);

  const start = async () => {
    await ensureAudio("piano");
    await Promise.all(TRACKS.map((t) => ensureAudio(t.instrument)));
    Tone.getTransport().bpm.value = bpm;

    if (loopRef.current) { loopRef.current.dispose(); }
    loopRef.current = new Tone.Sequence((time, step) => {
      TRACKS.forEach((t, ti) => {
        if (grid[ti][step] && !mutes[ti]) {
          playNote(notes[ti], t.duration, time, trackVols[ti], t.instrument);
        }
      });
      Tone.getDraw().schedule(() => setCurrentStep(step), time);
    }, Array.from({ length: STEPS }, (_, i) => i), "16n").start(0);

    // play voice loop if recorded
    if (voicePlayerRef.current && voicePlayerRef.current.loaded) {
      voicePlayerRef.current.loop = true;
      voicePlayerRef.current.volume.value = 20 * Math.log10(Math.max(0.001, vocalLevel));
      voicePlayerRef.current.start(0);
    }

    Tone.getTransport().start();
    setPlaying(true);
  };

  const stop = () => {
    Tone.getTransport().stop();
    Tone.getTransport().cancel();
    loopRef.current?.dispose();
    loopRef.current = null;
    voicePlayerRef.current?.stop();
    setPlaying(false);
    setCurrentStep(-1);
  };

  useEffect(() => () => { loopRef.current?.dispose(); Tone.getTransport().stop(); }, []);

  const toggleCell = (ti: number, step: number) => {
    setGrid((g) => {
      const next = g.map((row) => row.slice());
      next[ti][step] = !next[ti][step];
      return next;
    });
    // audition
    const t = TRACKS[ti];
    ensureAudio(t.instrument).then(() => playNote(notes[ti], t.duration, undefined, 0.85, t.instrument));
  };

  const setTrackNote = (ti: number, note: string) => {
    setNotes((arr) => { const n = arr.slice(); n[ti] = note; return n; });
  };

  const clearAll = () => setGrid(TRACKS.map(() => Array(STEPS).fill(false)));
  const randomize = () => setGrid(TRACKS.map((_, ti) =>
    Array.from({ length: STEPS }, () => Math.random() < (ti === 0 ? 0.35 : 0.18))
  ));
  const applyPreset = (name: keyof typeof PRESET_PATTERNS) => {
    const fn = PRESET_PATTERNS[name];
    setGrid(TRACKS.map((t, ti) => Array.from({ length: STEPS }, (_, s) => fn(ti, t, s))));
  };

  const saveProject = () => {
    const data = JSON.stringify({ grid, notes, mutes, trackVols, bpm, swing, reverbWet, delayWet });
    try { localStorage.setItem("aria.studio.project", data); alert("Project saved to this device."); } catch {}
  };
  const loadProject = () => {
    try {
      const raw = localStorage.getItem("aria.studio.project");
      if (!raw) return alert("No saved project yet.");
      const p = JSON.parse(raw);
      if (Array.isArray(p.grid) && p.grid.length === TRACKS.length) setGrid(p.grid);
      if (Array.isArray(p.notes)) setNotes(p.notes);
      if (Array.isArray(p.mutes)) setMutes(p.mutes);
      if (Array.isArray(p.trackVols)) setTrackVols(p.trackVols);
      if (typeof p.bpm === "number") setBpm(p.bpm);
      if (typeof p.swing === "number") setSwing(p.swing);
    } catch { alert("Could not load."); }
  };

  // Render full song to WAV via Tone.Offline
  const [rendering, setRendering] = useState(false);
  const exportMix = async () => {
    setRendering(true);
    try {
      const bars = 4;
      const secondsPerBeat = 60 / bpm;
      const total = bars * 4 * secondsPerBeat;
      const buf = await Tone.Offline(async () => {
        // Build a simple polysynth for each track inside offline context
        const synths = TRACKS.map(() => new Tone.PolySynth(Tone.Synth).toDestination());
        const stepDur = secondsPerBeat / 4;
        for (let bar = 0; bar < bars; bar++) {
          for (let s = 0; s < STEPS; s++) {
            const t = bar * STEPS * stepDur + s * stepDur;
            TRACKS.forEach((tr, ti) => {
              if (grid[ti][s] && !mutes[ti]) {
                try { synths[ti].triggerAttackRelease(notes[ti], tr.duration, t, trackVols[ti]); } catch {}
              }
            });
          }
        }
      }, total);
      // Convert AudioBuffer -> WAV
      const wav = audioBufferToWav((buf as any).get ? (buf as any).get() : (buf as any));
      const blob = new Blob([wav], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "aria-studio-mix.wav"; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) { console.error(e); alert("Export failed."); }
    finally { setRendering(false); }
  };

  // ---- Voice recording ----
  const beginRecord = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setVoiceUrl(url);
        stream.getTracks().forEach((t) => t.stop());
        await setupVoiceChain(url);
      };
      rec.start();
      mediaRecRef.current = rec;
      setRecording(true);
    } catch (err) {
      alert("Microphone access denied or unavailable.");
    }
  };
  const endRecord = () => {
    mediaRecRef.current?.stop();
    setRecording(false);
  };

  const setupVoiceChain = async (url: string) => {
    await ensureAudio("piano");
    voicePlayerRef.current?.dispose();
    voiceShifterRef.current?.dispose();
    voiceReverbRef.current?.dispose();
    voiceFilterRef.current?.dispose();
    const filter = new Tone.Filter(voiceFilter, "lowpass");
    const reverb = new Tone.Reverb({ decay: 3.6, wet: voiceReverb });
    const shift = new Tone.PitchShift({ pitch: voicePitch });
    const player = new Tone.Player({ url, autostart: false });
    player.chain(shift, filter, reverb, Tone.getDestination());
    voicePlayerRef.current = player;
    voiceShifterRef.current = shift;
    voiceReverbRef.current = reverb;
    voiceFilterRef.current = filter;
  };

  useEffect(() => { voiceShifterRef.current && (voiceShifterRef.current.pitch = voicePitch); }, [voicePitch]);
  useEffect(() => { voiceReverbRef.current && voiceReverbRef.current.wet.rampTo(voiceReverb, 0.1); }, [voiceReverb]);
  useEffect(() => { voiceFilterRef.current && voiceFilterRef.current.frequency.rampTo(voiceFilter, 0.1); }, [voiceFilter]);

  const previewVoice = async () => {
    if (!voicePlayerRef.current?.loaded) return;
    await Tone.start();
    voicePlayerRef.current.stop();
    voicePlayerRef.current.start();
  };

  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="max-w-7xl mx-auto px-4 md:px-6 pt-8 md:pt-12 pb-6 text-center animate-float-up">
        <p className="text-[10px] uppercase tracking-[0.4em] text-primary mb-3">— Studio · Build your own —</p>
        <h1 className="font-serif text-3xl md:text-5xl">Tap a beat. Sing a line. Make a song.</h1>
        <p className="mt-3 max-w-2xl mx-auto text-muted-foreground text-sm md:text-base">
          Six tracks, sixteen steps, hall reverb, tape delay, and a voice booth with pitch & polish.
        </p>
      </section>

      {/* Transport */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 pb-4">
        <div className="bg-card/40 backdrop-blur rounded-2xl border border-border p-4 md:p-5 flex flex-wrap items-center gap-3">
          {!playing ? (
            <button onClick={start} className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[var(--amber)] to-[var(--amber-glow)] text-[var(--ebony)] font-medium">▶ Play</button>
          ) : (
            <button onClick={stop} className="px-5 py-2.5 rounded-full border border-primary/60 text-primary hover:bg-primary/10">■ Stop</button>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">BPM</span>
            <input type="range" min={60} max={180} value={bpm} onChange={(e) => setBpm(+e.target.value)} className="w-32 accent-[var(--amber)]" />
            <span className="font-mono text-sm w-8 text-right">{bpm}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Reverb</span>
            <input type="range" min={0} max={1} step={0.01} value={reverbWet} onChange={(e) => setReverbWet(+e.target.value)} className="w-24 accent-[var(--amber)]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Delay</span>
            <input type="range" min={0} max={0.6} step={0.01} value={delayWet} onChange={(e) => setDelayWet(+e.target.value)} className="w-24 accent-[var(--amber)]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Swing</span>
            <input type="range" min={0} max={0.5} step={0.01} value={swing} onChange={(e) => setSwing(+e.target.value)} className="w-24 accent-[var(--amber)]" />
          </div>
          <div className="flex-1" />
          {(Object.keys(PRESET_PATTERNS) as Array<keyof typeof PRESET_PATTERNS>).map((p) => (
            <button key={p} onClick={() => applyPreset(p)} className="px-3 py-2 rounded-md border border-border text-xs hover:border-primary/60">{p}</button>
          ))}
          <button onClick={randomize} className="px-3 py-2 rounded-md border border-border text-sm hover:border-primary/60">⟳ Surprise me</button>
          <button onClick={clearAll} className="px-3 py-2 rounded-md border border-border text-sm hover:border-primary/60">Clear</button>
          <button onClick={saveProject} className="px-3 py-2 rounded-md border border-border text-sm hover:border-primary/60">💾 Save</button>
          <button onClick={loadProject} className="px-3 py-2 rounded-md border border-border text-sm hover:border-primary/60">↥ Load</button>
          <button onClick={exportMix} disabled={rendering} className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm disabled:opacity-60">
            {rendering ? "Rendering…" : "⤓ Export WAV"}
          </button>
        </div>
      </section>

      {/* Sequencer Grid */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 pb-6">
        <div className="bg-card/40 backdrop-blur rounded-2xl border border-border p-3 md:p-5 overflow-x-auto">
          <div className="min-w-[720px]">
            {/* Step header */}
            <div className="grid gap-1 mb-2" style={{ gridTemplateColumns: `160px repeat(${STEPS}, 1fr)` }}>
              <div />
              {Array.from({ length: STEPS }).map((_, s) => (
                <div key={s} className={`text-center text-[9px] font-mono ${currentStep === s ? "text-primary" : "text-muted-foreground/50"}`}>
                  {s % 4 === 0 ? Math.floor(s / 4) + 1 : "·"}
                </div>
              ))}
            </div>
            {TRACKS.map((t, ti) => (
              <div key={t.id} className="grid gap-1 items-center mb-1.5" style={{ gridTemplateColumns: `160px repeat(${STEPS}, 1fr)` }}>
                <div className="flex items-center gap-2 pr-2">
                  <span className="w-2 h-6 rounded-sm" style={{ background: t.color }} />
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setMutes((m) => { const n = m.slice(); n[ti] = !n[ti]; return n; })}
                        className={`w-4 h-4 rounded-sm border text-[8px] ${mutes[ti] ? "bg-destructive/70 border-destructive text-white" : "border-border bg-secondary/40"}`}
                        title="Mute"
                      >{mutes[ti] ? "M" : ""}</button>
                      <p className="text-xs font-serif">{t.name}</p>
                    </div>
                    <div className="flex gap-1 mt-0.5">
                      <select value={notes[ti].replace(/\d/, "")} onChange={(e) => {
                        const oct = notes[ti].match(/\d/)?.[0] ?? "4";
                        setTrackNote(ti, e.target.value + oct);
                      }} className="bg-secondary/40 border border-border rounded text-[10px] px-1 py-0.5">
                        {NOTES.map((n) => <option key={n}>{n}</option>)}
                      </select>
                      <select value={notes[ti].match(/\d/)?.[0] ?? "4"} onChange={(e) => {
                        const letter = notes[ti].replace(/\d/, "");
                        setTrackNote(ti, letter + e.target.value);
                      }} className="bg-secondary/40 border border-border rounded text-[10px] px-1 py-0.5">
                        {OCTAVES.map((o) => <option key={o}>{o}</option>)}
                      </select>
                      <input type="range" min={0} max={1} step={0.01} value={trackVols[ti]}
                        onChange={(e) => setTrackVols((v) => { const n = v.slice(); n[ti] = +e.target.value; return n; })}
                        className="w-12 accent-[var(--amber)]" title="Volume" />
                    </div>
                  </div>
                </div>
                {Array.from({ length: STEPS }).map((_, s) => {
                  const on = grid[ti][s];
                  const isCurrent = currentStep === s;
                  return (
                    <button
                      key={s}
                      onClick={() => toggleCell(ti, s)}
                      className={`h-8 md:h-9 rounded-md border transition-all ${
                        on
                          ? "border-transparent shadow-[0_0_12px_var(--amber)]"
                          : "border-border bg-secondary/30 hover:bg-secondary/60"
                      } ${isCurrent ? "ring-2 ring-primary/70" : ""}`}
                      style={on ? { background: t.color } : undefined}
                      aria-label={`${t.name} step ${s + 1}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Voice booth */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 pb-16">
        <div className="bg-card/40 backdrop-blur rounded-2xl border border-border p-5 md:p-6">
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Voice Booth</p>
          <h2 className="font-serif text-2xl mt-1">Sing or hum a line</h2>
          <p className="text-sm text-muted-foreground mt-1">Recorded straight from your mic with noise suppression. Then sweeten it with pitch, warmth, and hall reverb.</p>

          <div className="flex flex-wrap items-center gap-3 mt-4">
            {!recording ? (
              <button onClick={beginRecord} className="px-5 py-2.5 rounded-full bg-destructive text-destructive-foreground">● Record</button>
            ) : (
              <button onClick={endRecord} className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground animate-glow">■ Stop recording</button>
            )}
            {voiceUrl && (
              <>
                <button onClick={previewVoice} className="px-4 py-2 rounded-md border border-primary/60 text-primary text-sm hover:bg-primary/10">▶ Preview enhanced</button>
                <a href={voiceUrl} download="aria-voice.webm" className="px-4 py-2 rounded-md border border-border text-sm hover:border-primary/60">Download raw</a>
              </>
            )}
          </div>

          {voiceUrl && (
            <div className="grid sm:grid-cols-2 gap-4 mt-5">
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Pitch ({voicePitch > 0 ? "+" : ""}{voicePitch} st)</span>
                <input type="range" min={-12} max={12} value={voicePitch} onChange={(e) => setVoicePitch(+e.target.value)} className="w-full accent-[var(--amber)]" />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Hall reverb ({Math.round(voiceReverb*100)}%)</span>
                <input type="range" min={0} max={1} step={0.01} value={voiceReverb} onChange={(e) => setVoiceReverb(+e.target.value)} className="w-full accent-[var(--amber)]" />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Brightness ({Math.round(voiceFilter)} Hz)</span>
                <input type="range" min={500} max={14000} value={voiceFilter} onChange={(e) => setVoiceFilter(+e.target.value)} className="w-full accent-[var(--amber)]" />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Vocal mix ({Math.round(vocalLevel*100)}%)</span>
                <input type="range" min={0} max={1} step={0.01} value={vocalLevel} onChange={(e) => setVocalLevel(+e.target.value)} className="w-full accent-[var(--amber)]" />
              </label>
              <p className="sm:col-span-2 text-xs text-muted-foreground">
                Tip: Press <em className="text-primary not-italic">Play</em> above — your voice loops along with the beat. Adjust sliders live.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
