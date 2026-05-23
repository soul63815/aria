import { useSyncExternalStore } from "react";
import { setMasterVolume, setReverbWet } from "./piano-engine";

export interface AriaSettings {
  volume: number;        // 0..1
  tempo: number;         // 0.5..1.5 multiplier
  reverbWet: number;     // 0..1
  fxEnabled: boolean;
}

const KEY = "aria.settings.v1";
const DEFAULTS: AriaSettings = { volume: 0.85, tempo: 1, reverbWet: 0.28, fxEnabled: true };

let state: AriaSettings = load();
const listeners = new Set<() => void>();

function load(): AriaSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch { return DEFAULTS; }
}

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

export function setSetting<K extends keyof AriaSettings>(k: K, v: AriaSettings[K]) {
  state = { ...state, [k]: v };
  if (k === "volume") setMasterVolume(state.volume);
  if (k === "reverbWet" || k === "fxEnabled") {
    setReverbWet(state.fxEnabled ? state.reverbWet : 0);
  }
  emit();
}

export function getSettings(): AriaSettings { return state; }

/** Apply persisted settings to the audio bus. Call after Tone.start(). */
export function applySettingsToBus() {
  setMasterVolume(state.volume);
  setReverbWet(state.fxEnabled ? state.reverbWet : 0);
}

export function useSettings(): AriaSettings {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => state,
    () => state,
  );
}