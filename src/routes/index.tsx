import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { InstallAppButton } from "@/components/InstallAppButton";
import logo from "@/assets/aria-logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aria — A peaceful concert hall in your browser" },
      { name: "description", content: "Full 88-key sampled grand piano, acoustic guitar with falling-chord practice, violin, flute, sub bass and drums. Includes Golden Brown, Phonk, Für Elise, Moonlight Sonata. Installable as an app." },
      { property: "og:title", content: "Aria — Concert Hall Online" },
      { property: "og:description", content: "Real samples, falling tiles, candlelit themes. Install to your phone or desktop." },
      { property: "og:type", content: "website" },
      { name: "theme-color", content: "#1a1208" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
    ],
    links: [
      { rel: "manifest", href: "/manifest.json" },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/icon-192.svg" },
    ],
  }),
  component: Index,
});

const ROOMS = [
  { to: "/golden-brown", title: "Golden Brown", eyebrow: "The amber room · Beloved", body: "A dedicated screen for The Stranglers' classic — Listen, Practice, tempo slider, falling tiles. The whole room shakes when it begins.", glyph: "★", accent: true },
  { to: "/piano",        title: "The Grand Piano", eyebrow: "Salamander · 88 keys", body: "A full concert grand. Click, touch, or use your keyboard across seven octaves of hall reverb.", glyph: "𝄞" },
  { to: "/songs",        title: "Song Hall",       eyebrow: "Listen · Practice · Tiles", body: "Phonk, Für Elise, Moonlight Sonata, Ode to Joy, Canon in D — each piece reshapes the room.", glyph: "♬" },
  { to: "/guitar",       title: "Acoustic Guitar", eyebrow: "Six strings · Falling chords", body: "Full fretboard, quick-chord buttons, and a falling-chord practice mode with hit feedback.", glyph: "🎸" },
  { to: "/instruments",  title: "The Parlor",      eyebrow: "Violin · Flute · Bass · Drums", body: "More voices for the hall — including a sub-heavy phonk bass and a printable script book.", glyph: "♩" },
  { to: "/studio",       title: "The Studio",      eyebrow: "Beats · FX · Voice booth · New", body: "Lay down a 16-step beat, layer six instruments, dial in reverb & delay, then record and sweeten your own vocal.", glyph: "✦" },
  { to: "/import",       title: "Bring Your Own",  eyebrow: "MP3 → script · New", body: "Drop an MP3. Aria sketches the dominant melody and adds it to your Song Hall, ready to play.", glyph: "↓" },
];

function Index() {
  return (
    <main className="min-h-screen">
      <SiteHeader />

      <section className="max-w-7xl mx-auto px-4 md:px-6 pt-10 md:pt-16 pb-10 md:pb-12 text-center animate-float-up">
        <img src={logo} alt="Aria" width={88} height={88}
             className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-5 rounded-full shadow-[0_0_60px_var(--amber)] ring-1 ring-primary/30" />
        <p className="text-[10px] uppercase tracking-[0.4em] text-primary mb-4">— A peaceful place to make sound —</p>
        <h1 className="font-serif text-4xl md:text-7xl leading-[1.05] tracking-tight">
          Step inside the <em className="text-primary not-italic">concert hall</em>.
        </h1>
        <p className="mt-5 max-w-xl mx-auto text-muted-foreground text-base md:text-lg leading-relaxed">
          Real samples. Full keyboards. Falling tiles for the songs you love.
          Phonk for the late nights. Install Aria once — the hall comes with you.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link to="/golden-brown" className="px-6 md:px-7 py-3 md:py-3.5 rounded-full bg-gradient-to-r from-[var(--amber)] to-[var(--amber-glow)] text-[var(--ebony)] font-medium tracking-wide animate-glow">
            ★ Open Golden Brown
          </Link>
          <Link to="/piano" className="px-6 md:px-7 py-3 md:py-3.5 rounded-full border border-primary/60 text-primary hover:bg-primary/10 transition">
            Open the Piano
          </Link>
          <InstallAppButton variant="solid" />
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-6 pb-16 md:pb-20">
        <div className="grid md:grid-cols-2 gap-4 md:gap-5">
          {ROOMS.map((r) => (
            <Link key={r.to} to={r.to}
              className={`group relative overflow-hidden rounded-2xl md:rounded-3xl border border-border bg-card/40 backdrop-blur p-6 md:p-8 hover:border-primary/60 transition-all hover:shadow-[var(--shadow-warm)] ${r.accent ? "md:col-span-2 border-primary/50" : ""}`}>
              <div className="absolute -top-8 -right-6 font-serif text-[7rem] md:text-[8rem] text-primary/10 group-hover:text-primary/25 transition leading-none select-none">{r.glyph}</div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-primary">{r.eyebrow}</p>
              <h2 className="font-serif text-2xl md:text-4xl mt-2">{r.title}</h2>
              <p className="mt-3 md:mt-4 text-muted-foreground max-w-lg leading-relaxed text-sm md:text-base">{r.body}</p>
              <p className="mt-5 text-sm text-primary group-hover:translate-x-1 transition-transform">Enter →</p>
            </Link>
          ))}
        </div>
      </section>

      <footer className="max-w-7xl mx-auto px-4 md:px-6 py-10 border-t border-border text-center text-xs text-muted-foreground space-y-2">
        <p>Real samples · Salamander Grand · acoustic guitar · works on phone, tablet, desktop.</p>
        <p><InstallAppButton /></p>
      </footer>
    </main>
  );
}
