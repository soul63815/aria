import { useEffect, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { useSettings, setSetting } from "@/lib/settings-store";

export function SettingsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useSettings();
  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-background/80 backdrop-blur-md flex items-start justify-end p-3 sm:p-6 animate-float-up" onClick={onClose}>
      <aside onClick={(e) => e.stopPropagation()}
             className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-[var(--shadow-warm)] overflow-hidden">
        <header className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-primary">The mixing desk</p>
            <h2 className="font-serif text-xl mt-0.5">Settings</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md border border-border text-sm hover:bg-secondary">✕</button>
        </header>
        <div className="p-5 space-y-6">
          <Row label="Master volume" value={`${Math.round(s.volume * 100)}%`}>
            <Slider value={[s.volume * 100]} min={0} max={100} step={1}
                    onValueChange={(v) => setSetting("volume", v[0] / 100)} />
          </Row>

          <Row label="Tempo" value={`${s.tempo.toFixed(2)}×`}>
            <Slider value={[s.tempo * 100]} min={50} max={150} step={5}
                    onValueChange={(v) => setSetting("tempo", v[0] / 100)} />
            <p className="text-[10px] text-muted-foreground mt-1">Applied to song playback and falling tiles.</p>
          </Row>

          <Row label="Hall reverb" value={`${Math.round(s.reverbWet * 100)}%`}>
            <Slider value={[s.reverbWet * 100]} min={0} max={100} step={1}
                    onValueChange={(v) => setSetting("reverbWet", v[0] / 100)}
                    disabled={!s.fxEnabled} />
          </Row>

          <label className="flex items-center justify-between cursor-pointer">
            <span>
              <span className="block text-sm">FX chain</span>
              <span className="text-[10px] text-muted-foreground">Compressor + reverb. Off = dry signal.</span>
            </span>
            <button onClick={() => setSetting("fxEnabled", !s.fxEnabled)}
                    className={`w-12 h-6 rounded-full border border-border relative transition ${s.fxEnabled ? "bg-primary" : "bg-secondary"}`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-card transition ${s.fxEnabled ? "left-6" : "left-0.5"}`} />
            </button>
          </label>

          <button onClick={() => {
            setSetting("volume", 0.85); setSetting("tempo", 1);
            setSetting("reverbWet", 0.28); setSetting("fxEnabled", true);
          }} className="w-full px-3 py-2 rounded-md border border-border text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground hover:border-primary/60 transition">
            Reset to defaults
          </button>
        </div>
      </aside>
    </div>
  );
}

function Row({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-sm">{label}</span>
        <span className="font-mono text-xs text-primary">{value}</span>
      </div>
      {children}
    </div>
  );
}

export function SettingsTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label="Open settings"
      className="w-9 h-9 rounded-md border border-border flex items-center justify-center text-primary hover:bg-secondary transition">
      <Gear />
    </button>
  );
}

function Gear() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.36.14.66.4.85.74.2.35.27.74.21 1.13z" />
    </svg>
  );
}