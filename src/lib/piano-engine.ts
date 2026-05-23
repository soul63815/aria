import * as Tone from "tone";

export type InstrumentId = "piano" | "guitar" | "violin" | "flute" | "drums" | "bass" | "organ" | "harp" | "marimba" | "synthlead";

let reverb: Tone.Reverb | null = null;
let compressor: Tone.Compressor | null = null;
let masterVol: Tone.Volume | null = null;
const instruments: Partial<Record<InstrumentId, any>> = {};
const loadPromises: Partial<Record<InstrumentId, Promise<void>>> = {};

// Keep instruments fully local/synthesized so mobile playback never waits on
// remote sample CDNs that can fail under preview/CORS/network conditions.

function ensureBus() {
  if (!masterVol) {
    masterVol = new Tone.Volume(0).toDestination();
    compressor = new Tone.Compressor(-18, 3).connect(masterVol);
    reverb = new Tone.Reverb({ decay: 3.6, wet: 0.28 }).connect(compressor);
  }
  return reverb!;
}

/** 0..1 master volume (logarithmic) */
export function setMasterVolume(v: number) {
  ensureBus();
  const clamped = Math.max(0, Math.min(1, v));
  // -60 dB at 0, 0 dB at 1
  masterVol!.volume.rampTo(clamped <= 0.001 ? -Infinity : 20 * Math.log10(clamped), 0.05);
}

/** 0..1 reverb wet */
export function setReverbWet(v: number) {
  ensureBus();
  if (reverb) reverb.wet.rampTo(Math.max(0, Math.min(1, v)), 0.1);
}

/** Toggle FX chain (mute reverb when disabled) */
export function setFxEnabled(on: boolean) {
  ensureBus();
  if (reverb) reverb.wet.rampTo(on ? 0.28 : 0, 0.1);
}

/** Preload audio buffers for a list of pitches across given instruments. */
export async function preloadForSong(instrumentIds: InstrumentId[]): Promise<void> {
  await Promise.all(instrumentIds.map((id) => loadInstrument(id)));
  // Tone.loaded() resolves when sampler buffers are decoded.
  try { await Tone.loaded(); } catch {}
}

function loadPiano(): Promise<void> {
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "triangle8" },
    envelope: { attack: 0.006, decay: 0.45, sustain: 0.28, release: 1.35 },
  }).connect(ensureBus());
  synth.volume.value = -7;
  instruments.piano = synth;
  return Promise.resolve();
}

function pluckSynthGuitar() {
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "fatsawtooth", count: 3, spread: 30 },
    envelope: { attack: 0.005, decay: 0.5, sustain: 0.2, release: 1.4 },
  }).connect(ensureBus());
  synth.volume.value = -10;
  return synth;
}

function loadGuitar(): Promise<void> {
  instruments.guitar = pluckSynthGuitar();
  return Promise.resolve();
}

function loadViolin(): Promise<void> {
  const synth = new Tone.PolySynth(Tone.AMSynth, {
    harmonicity: 2.5,
    envelope: { attack: 0.5, decay: 0.2, sustain: 0.8, release: 1.6 },
    modulation: { type: "sine" },
    modulationEnvelope: { attack: 0.6, decay: 0.1, sustain: 1, release: 0.5 },
  }).connect(ensureBus());
  synth.volume.value = -10;
  instruments.violin = synth;
  return Promise.resolve();
}

function loadFlute(): Promise<void> {
  const synth = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 3,
    modulationIndex: 4,
    envelope: { attack: 0.18, decay: 0.1, sustain: 0.9, release: 0.9 },
    modulation: { type: "triangle" },
    modulationEnvelope: { attack: 0.2, decay: 0.1, sustain: 1, release: 0.5 },
  }).connect(ensureBus());
  synth.volume.value = -12;
  instruments.flute = synth;
  return Promise.resolve();
}

function loadDrums(): Promise<void> {
  const kit = new Tone.MembraneSynth({
    pitchDecay: 0.06, octaves: 6,
    oscillator: { type: "sine" },
    envelope: { attack: 0.001, decay: 0.45, sustain: 0, release: 0.5 },
  }).connect(ensureBus());
  instruments.drums = kit;
  return Promise.resolve();
}

function loadBass(): Promise<void> {
  // Sub-heavy phonk bass — sine + light distortion via FM
  const dist = new Tone.Distortion(0.35).connect(ensureBus());
  const synth = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 0.5, modulationIndex: 6,
    oscillator: { type: "sine" },
    envelope: { attack: 0.005, decay: 0.6, sustain: 0.4, release: 0.6 },
    modulation: { type: "square" },
    modulationEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.4 },
  }).connect(dist);
  synth.volume.value = -4;
  instruments.bass = synth;
  return Promise.resolve();
}

function loadOrgan(): Promise<void> {
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "fatsine", count: 4, spread: 20 },
    envelope: { attack: 0.04, decay: 0.1, sustain: 0.95, release: 0.6 },
  }).connect(ensureBus());
  synth.volume.value = -10;
  instruments.organ = synth;
  return Promise.resolve();
}

function loadHarp(): Promise<void> {
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "triangle" },
    envelope: { attack: 0.002, decay: 1.2, sustain: 0.05, release: 1.8 },
  }).connect(ensureBus());
  synth.volume.value = -8;
  instruments.harp = synth;
  return Promise.resolve();
}

function loadMarimba(): Promise<void> {
  const synth = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 6, modulationIndex: 2,
    oscillator: { type: "sine" },
    envelope: { attack: 0.001, decay: 0.6, sustain: 0, release: 0.4 },
    modulation: { type: "sine" },
    modulationEnvelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 },
  }).connect(ensureBus());
  synth.volume.value = -8;
  instruments.marimba = synth;
  return Promise.resolve();
}

function loadSynthLead(): Promise<void> {
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "fatsawtooth", count: 3, spread: 40 },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.5 },
  }).connect(ensureBus());
  synth.volume.value = -12;
  instruments.synthlead = synth;
  return Promise.resolve();
}

export function loadInstrument(id: InstrumentId): Promise<void> {
  if (loadPromises[id]) return loadPromises[id]!;
  const loader =
    id === "piano" ? loadPiano :
    id === "guitar" ? loadGuitar :
    id === "violin" ? loadViolin :
    id === "flute" ? loadFlute :
    id === "bass" ? loadBass :
    id === "organ" ? loadOrgan :
    id === "harp" ? loadHarp :
    id === "marimba" ? loadMarimba :
    id === "synthlead" ? loadSynthLead :
    loadDrums;
  loadPromises[id] = loader();
  return loadPromises[id]!;
}

export async function ensureAudio(id: InstrumentId = "piano") {
  if (Tone.getContext().state !== "running") {
    await Tone.start();
  }
  await loadInstrument(id);
  // Lazy-apply user settings once context is alive
  try {
    const mod = await import("./settings-store");
    mod.applySettingsToBus();
  } catch {}
}

export function playNote(
  note: string,
  duration: string | number = "8n",
  time?: number,
  velocity = 0.85,
  instrument: InstrumentId = "piano",
) {
  const inst = instruments[instrument];
  if (!inst) return;
  try { inst.triggerAttackRelease(note as any, duration as any, time, velocity); } catch {}
}

export function stopAll() {
  Object.values(instruments).forEach((i: any) => { try { i.releaseAll?.(); } catch {} });
  Tone.getTransport().stop();
  Tone.getTransport().cancel();
}

export const Transport = Tone.getTransport;
export const now = () => Tone.now();
