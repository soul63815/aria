import type { Song, SongNote } from "./songs";

/**
 * Extract a monophonic melody sketch from an audio file via autocorrelation.
 * Quality note: this is a best-effort rough transcription of the dominant
 * pitch, not a polyphonic transcriber. Works best on solo voice/instrument.
 */

const NOTE_NAMES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

function freqToNote(freq: number): { note: string; midi: number } | null {
  if (freq < 60 || freq > 2000) return null;
  const midi = Math.round(69 + 12 * Math.log2(freq / 440));
  if (midi < 24 || midi > 96) return null;
  const note = NOTE_NAMES[(midi + 1200) % 12] + (Math.floor(midi / 12) - 1);
  return { note, midi };
}

function autocorrelate(buf: Float32Array, sampleRate: number): number {
  // Normalized squared-difference (YIN-lite)
  const SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1;

  const MAX_LAG = Math.floor(sampleRate / 70);   // ~70 Hz min
  const MIN_LAG = Math.floor(sampleRate / 1200); // ~1200 Hz max
  let bestLag = -1;
  let bestCorr = 0;
  for (let lag = MIN_LAG; lag < MAX_LAG; lag++) {
    let corr = 0;
    for (let i = 0; i < SIZE - lag; i++) corr += buf[i] * buf[i + lag];
    corr = corr / (SIZE - lag);
    if (corr > bestCorr) { bestCorr = corr; bestLag = lag; }
  }
  if (bestLag < 0 || bestCorr < 0.01) return -1;
  return sampleRate / bestLag;
}

export interface TranscribeProgress { progress: number; phase: string; }

export async function transcribeAudioFile(
  file: File,
  onProgress?: (p: TranscribeProgress) => void,
): Promise<Song> {
  onProgress?.({ progress: 0.05, phase: "Reading file" });
  const arrayBuf = await file.arrayBuffer();
  const Ctx: typeof AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
  const ctx = new Ctx();
  onProgress?.({ progress: 0.15, phase: "Decoding audio" });
  const audioBuf = await ctx.decodeAudioData(arrayBuf.slice(0));

  // Downmix to mono, downsample to ~22050 for speed
  const targetRate = 22050;
  const raw = audioBuf.getChannelData(0);
  const ratio = audioBuf.sampleRate / targetRate;
  const mono = new Float32Array(Math.floor(raw.length / ratio));
  for (let i = 0; i < mono.length; i++) mono[i] = raw[Math.floor(i * ratio)];

  const winMs = 90;
  const hopMs = 60;
  const winLen = Math.floor((winMs / 1000) * targetRate);
  const hopLen = Math.floor((hopMs / 1000) * targetRate);

  const events: Array<{ t: number; midi: number; note: string }> = [];
  let lastReport = 0;
  for (let pos = 0; pos + winLen < mono.length; pos += hopLen) {
    const slice = mono.subarray(pos, pos + winLen);
    const f = autocorrelate(slice, targetRate);
    const n = f > 0 ? freqToNote(f) : null;
    if (n) events.push({ t: pos / targetRate, midi: n.midi, note: n.note });
    const p = pos / mono.length;
    if (p - lastReport > 0.05) { lastReport = p; onProgress?.({ progress: 0.15 + p * 0.7, phase: "Listening for pitch" }); }
    if (pos % (hopLen * 30) === 0) await new Promise((r) => setTimeout(r, 0));
  }
  onProgress?.({ progress: 0.9, phase: "Grouping notes" });

  // Group consecutive identical-midi frames into notes (≥3 frames)
  const grouped: Array<{ start: number; end: number; midi: number; note: string }> = [];
  for (const e of events) {
    const last = grouped[grouped.length - 1];
    if (last && last.midi === e.midi && e.t - last.end < (hopMs / 1000) * 2.5) {
      last.end = e.t + winMs / 1000;
    } else {
      grouped.push({ start: e.t, end: e.t + winMs / 1000, midi: e.midi, note: e.note });
    }
  }
  const stable = grouped.filter((g) => g.end - g.start > 0.07);

  const fallbackFromEnergy = (): Array<{ start: number; end: number; midi: number; note: string }> => {
    const scale = [57, 60, 62, 64, 67, 69, 72, 76];
    const frames: Array<{ t: number; rms: number; zc: number }> = [];
    for (let pos = 0; pos + winLen < mono.length; pos += hopLen * 2) {
      const slice = mono.subarray(pos, pos + winLen);
      let sum = 0; let zc = 0;
      for (let i = 1; i < slice.length; i++) {
        sum += slice[i] * slice[i];
        if ((slice[i - 1] < 0 && slice[i] >= 0) || (slice[i - 1] >= 0 && slice[i] < 0)) zc++;
      }
      frames.push({ t: pos / targetRate, rms: Math.sqrt(sum / slice.length), zc: zc / slice.length });
    }
    const avg = frames.reduce((a, f) => a + f.rms, 0) / Math.max(1, frames.length);
    return frames
      .filter((f, i) => f.rms > avg * 1.25 && (i === 0 || frames[i - 1].rms <= avg * 1.25))
      .slice(0, 96)
      .map((f, i) => {
        const midi = scale[Math.min(scale.length - 1, Math.floor(f.zc * 1800) % scale.length)] + (i % 3 === 2 ? 12 : 0);
        const note = NOTE_NAMES[(midi + 1200) % 12] + (Math.floor(midi / 12) - 1);
        return { start: f.t, end: f.t + 0.28, midi, note };
      });
  };
  const playable = stable.length >= 4 ? stable : fallbackFromEnergy();

  // Convert seconds → beats @ 120 bpm (2 beats/sec)
  const BPM = 120;
  const notes: SongNote[] = playable.map((g) => ({
    note: g.note,
    time: g.start * (BPM / 60),
    duration: Math.max(0.25, (g.end - g.start) * (BPM / 60)),
  }));

  // Build a readable script: bars of 8 notes
  const script = (() => {
    const lines: string[] = [];
    for (let i = 0; i < playable.length; i += 8) {
      lines.push(playable.slice(i, i + 8).map((g) => g.note).join("  "));
    }
    return lines.join("\n");
  })();

  onProgress?.({ progress: 1, phase: "Done" });
  try { ctx.close(); } catch {}

  const baseId = file.name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40) || "imported";
  const id = `import-${baseId}-${Date.now().toString(36)}`;

  return {
    id,
    title: file.name.replace(/\.[^.]+$/, ""),
    composer: "Imported",
    bpm: BPM,
    theme: "golden-brown",
    description: `${stable.length >= 4 ? "Rough melody sketch" : "Rhythmic playable sketch"} transcribed from ${file.name}. Edit as needed.`,
    notes,
    script,
  };
}