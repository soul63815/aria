import { useEffect, useState } from "react";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallAppButton({ variant = "ghost" }: { variant?: "ghost" | "solid" }) {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const h = (e: Event) => { e.preventDefault(); setDeferred(e as BIPEvent); };
    const i = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", h);
    window.addEventListener("appinstalled", i);
    if (window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);
    return () => {
      window.removeEventListener("beforeinstallprompt", h);
      window.removeEventListener("appinstalled", i);
    };
  }, []);

  const click = async () => {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
    } else {
      setOpen(true);
    }
  };

  if (installed) return null;

  const base = "text-xs uppercase tracking-[0.2em] rounded-full transition";
  const styles = variant === "solid"
    ? "px-4 py-2 bg-gradient-to-r from-[var(--amber)] to-[var(--amber-glow)] text-[var(--ebony)] font-medium"
    : "px-3 py-1.5 border border-primary/50 text-primary hover:bg-primary/10";

  return (
    <>
      <button onClick={click} className={`${base} ${styles}`}>↓ Install App</button>
      {open && (
        <div className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="max-w-md w-full bg-card border border-border rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Install Aria</p>
            <h3 className="font-serif text-2xl mt-2">Add to home screen</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><strong className="text-foreground">iPhone / iPad:</strong> Share <span className="font-mono">⎋</span> → "Add to Home Screen".</li>
              <li><strong className="text-foreground">Android Chrome:</strong> ⋮ menu → "Install app".</li>
              <li><strong className="text-foreground">Desktop Chrome/Edge:</strong> install icon in address bar.</li>
            </ul>
            <button onClick={() => setOpen(false)} className="mt-5 w-full px-4 py-2 rounded-md bg-primary text-primary-foreground">Got it</button>
          </div>
        </div>
      )}
    </>
  );
}
