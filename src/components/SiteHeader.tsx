import { Link, useLocation } from "@tanstack/react-router";
import { InstallAppButton } from "@/components/InstallAppButton";
import { useState } from "react";
import { SettingsPanel, SettingsTrigger } from "@/components/SettingsPanel";
import { useAuth } from "@/lib/auth-store";
import logo from "@/assets/aria-logo.png";

const NAV = [
  { to: "/", label: "Hall" },
  { to: "/piano", label: "Piano" },
  { to: "/songs", label: "Songs" },
  { to: "/online", label: "Online" },
  { to: "/golden-brown", label: "Golden Brown" },
  { to: "/guitar", label: "Guitar" },
  { to: "/instruments", label: "Instruments" },
  { to: "/studio", label: "Studio" },
  { to: "/library", label: "Library" },
  { to: "/import", label: "Import" },
];

export function SiteHeader() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { user, signOut } = useAuth();
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/60 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-3 group">
          <img src={logo} alt="Aria logo" width={36} height={36}
               className="w-9 h-9 rounded-full object-cover ring-1 ring-primary/40 shadow-[0_0_18px_var(--amber)] group-hover:scale-105 transition" />
          <div>
            <p className="font-serif text-xl leading-none">Aria</p>
            <p className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground mt-0.5">Concert Hall</p>
          </div>
        </Link>
        <nav className="hidden lg:flex items-center gap-1 rounded-full border border-border p-1 bg-card/40">
          {NAV.map((n) => {
            const active = pathname === n.to || (n.to !== "/" && pathname.startsWith(n.to));
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`px-3 py-1.5 text-xs rounded-full transition-all ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <SettingsTrigger onClick={() => setSettingsOpen(true)} />
          {user ? (
            <button onClick={() => signOut()} className="hidden sm:inline-flex px-3 py-1.5 text-xs rounded-md border border-border hover:border-primary text-muted-foreground hover:text-primary">
              Sign out
            </button>
          ) : (
            <Link to="/login" className="hidden sm:inline-flex px-3 py-1.5 text-xs rounded-md bg-primary text-primary-foreground hover:opacity-90">
              Sign in
            </Link>
          )}
          <div className="hidden sm:block"><InstallAppButton /></div>
          <button onClick={() => setOpen(!open)} aria-label="menu"
            className="lg:hidden w-9 h-9 rounded-md border border-border flex items-center justify-center text-primary">
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>
      {open && (
        <nav className="lg:hidden border-t border-border bg-background/95 backdrop-blur-xl px-4 py-3 flex flex-col gap-1 animate-float-up">
          {NAV.map((n) => {
            const active = pathname === n.to || (n.to !== "/" && pathname.startsWith(n.to));
            return (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)}
                className={`px-3 py-2 rounded-md text-sm ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"}`}>
                {n.label}
              </Link>
            );
          })}
          <div className="pt-2 sm:hidden"><InstallAppButton variant="solid" /></div>
          <div className="pt-2 sm:hidden">
            {user ? (
              <button onClick={() => { signOut(); setOpen(false); }} className="w-full px-3 py-2 rounded-md border border-border text-sm">Sign out</button>
            ) : (
              <Link to="/login" onClick={() => setOpen(false)} className="block w-full text-center px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm">Sign in</Link>
            )}
          </div>
        </nav>
      )}
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </header>
  );
}