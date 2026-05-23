import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Aria Music" }] }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) nav({ to: "/library" });
    });
  }, [nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null); setBusy(true);
    try {
      const fn = mode === "signup"
        ? supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/library" } })
        : supabase.auth.signInWithPassword({ email, password });
      const { error } = await fn;
      if (error) throw error;
      if (mode === "signin") nav({ to: "/library" });
      else setErr("Check your inbox to confirm your email, then sign in.");
    } catch (e: any) { setErr(e?.message || "Something went wrong"); }
    finally { setBusy(false); }
  };

  const google = async () => {
    setErr(null);
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/library" });
    if (res.error) setErr(res.error.message);
  };

  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="max-w-md mx-auto px-4 pt-16 pb-24">
        <p className="text-[10px] uppercase tracking-[0.4em] text-primary text-center">— The Stage Door —</p>
        <h1 className="font-serif text-4xl text-center mt-3">{mode === "signup" ? "Create your account" : "Welcome back"}</h1>
        <p className="text-center text-sm text-muted-foreground mt-2">
          Sign in to save songs to the cloud and download them on any device.
        </p>

        <div className="mt-8 rounded-2xl border border-border bg-card/40 backdrop-blur p-6">
          <button onClick={google} className="w-full px-4 py-2.5 rounded-md border border-border bg-background hover:border-primary text-sm font-medium flex items-center justify-center gap-2">
            <span className="text-base">🅖</span> Continue with Google
          </button>
          <div className="flex items-center gap-2 my-4 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            <div className="flex-1 h-px bg-border" /> or email <div className="flex-1 h-px bg-border" />
          </div>
          <form onSubmit={submit} className="space-y-3">
            <input required type="email" placeholder="you@example.com" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-background border border-border focus:border-primary outline-none text-sm" />
            <input required type="password" placeholder="Password" minLength={6} value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-background border border-border focus:border-primary outline-none text-sm" />
            {err && <p className="text-xs text-destructive">{err}</p>}
            <button disabled={busy} type="submit"
              className="w-full px-4 py-2.5 rounded-md bg-primary text-primary-foreground font-medium text-sm disabled:opacity-60">
              {busy ? "Working…" : mode === "signup" ? "Create account" : "Sign in"}
            </button>
          </form>
          <button onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            className="mt-4 w-full text-xs text-muted-foreground hover:text-primary">
            {mode === "signup" ? "Already have an account? Sign in" : "New to Aria? Create an account"}
          </button>
        </div>
        <p className="text-center text-[11px] text-muted-foreground mt-6">
          <Link to="/" className="hover:text-primary">← Back to the hall</Link>
        </p>
      </section>
    </main>
  );
}