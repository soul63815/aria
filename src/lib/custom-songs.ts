import { useSyncExternalStore } from "react";
import type { Song } from "./songs";

const KEY = "aria.customSongs.v1";
const listeners = new Set<() => void>();
let cache: Song[] = load();

const FALLBACK_NOTES = ["A3", "C4", "E4", "A4", "G4", "E4", "D4", "C4", "A3"];

function normalizeSong(song: Song): Song {
  if (song.notes?.length) return song;
  const notes = FALLBACK_NOTES.map((note, i) => ({ note, time: i * 0.75, duration: 0.55 }));
  return {
    ...song,
    bpm: song.bpm || 120,
    theme: song.theme || "golden-brown",
    description: song.description || "Playable imported sketch rebuilt for Aria.",
    notes,
    script: song.script || FALLBACK_NOTES.join("  "),
  };
}

function load(): Song[] {
  if (typeof window === "undefined") return [];
  try { return (JSON.parse(localStorage.getItem(KEY) || "[]") as Song[]).map(normalizeSong); } catch { return []; }
}
function persist() { try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch {} }
function emit() { persist(); listeners.forEach((l) => l()); }

export function addCustomSong(s: Song) { cache = [normalizeSong(s), ...cache]; emit(); }
export function removeCustomSong(id: string) { cache = cache.filter((s) => s.id !== id); emit(); }
export function getCustomSongs(): Song[] { return cache; }

export function useCustomSongs(): Song[] {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => cache,
    () => cache,
  );
}