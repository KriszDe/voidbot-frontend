// src/App.tsx
import { useState } from "react";

export default function App() {
  const [loading, setLoading] = useState(false);

  const handleDiscordLogin = () => {
    setLoading(true);
    const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID as string;
    const redirect = encodeURIComponent(import.meta.env.VITE_DISCORD_REDIRECT as string);
    const scope = encodeURIComponent("identify guilds");
    const state = crypto.randomUUID();

  sessionStorage.setItem("oauth_state", state);

  window.location.href =
  `https://discord.com/oauth2/authorize?client_id=${clientId}` +
  `&response_type=code&redirect_uri=${redirect}` +
  `&scope=${scope}&state=${encodeURIComponent(state)}&prompt=consent`;

  };

  return (
    <main className="min-h-screen bg-[#0b0d10] text-white">
      {/* Finom háttér: sötét grad + halvány textúra */}
      <Background />

      {/* Top bar */}
      <header className="border-b border-white/10 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-10">
          <div className="flex items-center gap-3">
            <Mark />
            <span className="text-sm font-semibold tracking-wider text-white/90">
              VOIDBOT
            </span>
          </div>
          <nav className="hidden gap-8 text-sm text-white/70 md:flex">
            <a className="hover:text-white transition" href="#">Főoldal</a>
            <a className="hover:text-white transition" href="#">Funkciók</a>
            <a className="hover:text-white transition" href="#">Támogatás</a>
          </nav>
          <button
            onClick={handleDiscordLogin}
            className="inline-flex items-center gap-2 rounded-lg bg-white text-[#0b0d10] px-4 py-2 text-sm font-semibold transition hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/30"
            aria-label="Belépés Discorddal"
          >
            <DiscordIcon className="h-5 w-5" />
            {loading ? "Kapcsolódás..." : "Belépés Discorddal"}
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-12 px-6 py-12 md:grid-cols-2 md:px-10 lg:py-18">
        <div>
          <Kicker>Discord oldal</Kicker>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
            Letisztult Discord oldal
            <br />
            <span className="text-white/80">biztonságos belépéssel</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/75">
            A VOIDBOT egy gyors és átlátható webes felület a Discordhoz: egykattintásos
            belépés, modern UX és tiszta struktúra. Nincs túlbonyolítva — csak a lényeg.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              onClick={handleDiscordLogin}
              className="group relative inline-flex items-center gap-3 rounded-xl bg-white px-6 py-3 text-base font-semibold text-[#0b0d10] transition hover:-translate-y-px focus:outline-none focus:ring-2 focus:ring-white/30 active:translate-y-0"
            >
              <DiscordIcon className="h-6 w-6" />
              {loading ? "Kapcsolódás..." : "Belépek Discorddal"}ń
              <span className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-black/10" />
            </button>

            <a
              href="#template"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-6 py-3 text-white/90 transition hover:bg-white/5"
            >
              Tudj meg többet
              <ArrowRight className="h-5 w-5" />
            </a>
          </div>

          <ul className="mt-8 grid gap-3 text-sm text-white/70 sm:grid-cols-2">
            <ListItem title="Gyors Discord belépés" />
            <ListItem title="Fiókbiztonság & átláthatóság" />
            <ListItem title="Közösségi hírek & frissítések" />
            <ListItem title="Support & útmutatók" />
          </ul>
        </div>

        {/* „Funkciók” kártya (jobb oldal) */}
        <ProductTemplate />
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-6 py-6 text-xs text-white/60 md:flex-row md:px-10">
          <span>© {new Date().getFullYear()} VOIDBOT • Discord oldal</span>
          <span>Adatkezelés • Felhasználási feltételek • Kapcsolat</span>
        </div>
      </footer>
    </main>
  );
}

/* ——— Components ——— */

function Background() {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(120%_80%_at_50%_-10%,#141922_0%,#0b0d10_60%)]" />
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-[0.08] [background:repeating-linear-gradient(90deg,transparent_0,transparent_6px,rgba(255,255,255,.6)_7px,transparent_8px)]" />
    </>
  );
}

function ProductTemplate() {
  return (
    <aside id="template" className="relative">
      <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-white/10 to-transparent blur" />
      <div className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white/[0.05]">
        <header className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-white/20" />
            <div>
              <p className="font-semibold">VOIDBOT — Funkciók</p>
              <p className="text-xs text-white/60">Discord • Web • v1.0.0</p>
            </div>
          </div>
          {/* Zöld LIVE címke */}
          <span className="rounded-md bg-emerald-500/20 px-2.5 py-1 text-sm font-semibold text-emerald-300">
            LIVE
          </span>
        </header>

        {/* fő kép */}
        <div className="aspect-video overflow-hidden rounded-xl border border-white/10 bg-white/10" />

        {/* rövid leírás */}
        <p className="mt-4 text-sm leading-6 text-white/80">
          Egyszerű és biztonságos Discord OAuth2 belépés, átlátható profilnézet
          és gyors hozzáférés a közösségi információkhoz. Modern, reszponzív UI.
        </p>

        {/* meta sor */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-white/70">
          <div className="inline-flex items-center gap-3">
            <Rating />
            <span>Felhasználók: —</span>
            <span>Frissítve: 2025-10-28</span>
          </div>
          <div className="inline-flex items-center gap-2">
            <button className="rounded-lg border border-white/15 px-3 py-1.5 transition hover:bg-white/5">
              Részletek
            </button>
            <button className="rounded-lg bg-white/90 px-3 py-1.5 font-semibold text-[#0b0d10] transition hover:bg-white">
              Csatlakozom
            </button>
          </div>
        </div>

        {/* Specifikáció – ikonokkal */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Spec
            icon={<CubeIcon />}
            k="Integrációk"
            v={
              <div className="flex flex-wrap items-center gap-2">
                <Pill>Discord OAuth2</Pill>
                <Pill>Bot API</Pill>
                <Pill>Webhooks</Pill>
              </div>
            }
          />
          <Spec
            icon={<ShieldIcon />}
            k="Kompatibilitás"
            v="Modern böngészők • Mobil/Asztali"
          />
          <Spec
            icon={<KeyIcon />}
            k="Hozzáférés"
            v="Belépés szükséges (Discord azonosítás)"
          />
          <Spec
            icon={<LifeRingIcon />}
            k="Támogatás"
            v="GYIK, hibajegy, e-mail támogatás"
          />
        </div>
      </div>
    </aside>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs text-white/90">
      {children}
    </span>
  );
}

function Spec({
  icon,
  k,
  v,
}: {
  icon: React.ReactNode;
  k: string;
  v: React.ReactNode | string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3">
      <span className="mt-0.5 inline-grid h-7 w-7 place-items-center rounded-md bg-white/10 text-white/80">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
          {k}
        </p>
        <div className="mt-1 text-sm font-medium text-white/90">{v}</div>
      </div>
    </div>
  );
}

function Rating() {
  return (
    <div className="inline-flex items-center gap-1">
      <Star className="h-4 w-4" />
      <span>4.8 • 126 értékelés</span>
    </div>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-md border border-white/15 bg-white/5 px-2 py-1 text-[11px] font-semibold tracking-widest text-white/70 uppercase">
      {children}
    </span>
  );
}

function ListItem({ title }: { title: string }) {
  return (
    <li className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
      <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
      <span>{title}</span>
    </li>
  );
}

function Mark() {
  return (
    <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden="true">
      <rect x="2" y="2" width="28" height="28" rx="6" fill="white" />
      <path d="M10 22 L16 8 L22 22 L19 24 L16 17 L13 24 Z" fill="#0b0d10" />
    </svg>
  );
}

/* —— ikonok (inline, letisztult) —— */
function CubeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M12 2l8 4.5v9L12 20 4 15.5v-9L12 2zm0 2.3L6 7l6 3.4L18 7 12 4.3zM6 8.7v5.6L12 18v-5.9L6 8.7zm12 0l-6 3.4V18l6-3.7V8.7z" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M12 2l8 3v6c0 5.25-3.438 9.75-8 11-4.562-1.25-8-5.75-8-11V5l8-3z" />
    </svg>
  );
}
function KeyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M14 3a7 7 0 0 0-7 7c0 1.05.24 2.04.66 2.92L2 18.59V22h3.41l1.34-1.34 1.42 1.42L10.59 19H13v-2.41l1.59-1.59c.88.42 1.87.66 2.91.66a7 7 0 1 0-3.5-13.66zM17 8a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" />
    </svg>
  );
}
function LifeRingIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2zm0 3a7 7 0 0 1 7 7c0 1.64-.56 3.15-1.5 4.35L14.65 13.5A3.99 3.99 0 0 0 13.5 9.35L16.35 6.5A6.97 6.97 0 0 1 12 5zm-7 7a7 7 0 0 1 7-7c.9 0 1.76.16 2.56.46L12.5 7.5A4 4 0 0 0 7.5 12.5L5.46 14.56A6.97 6.97 0 0 1 5 12zm7 7a6.97 6.97 0 0 1-4.35-1.5L9.35 14.5A3.99 3.99 0 0 0 14.5 9.35l2.15-2.15A6.97 6.97 0 0 1 19 12a7 7 0 0 1-7 7z" />
    </svg>
  );
}

function DiscordIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 245 240" fill="currentColor" aria-hidden="true">
      <path d="M104.4 104.9c-5.7 0-10.2 5-10.2 11.1s4.6 11.1 10.2 11.1c5.7 0 10.2-5 10.2-11.1s-4.6-11.1-10.2-11.1zm36.2 0c-5.7 0-10.2 5-10.2 11.1s4.6 11.1 10.2 11.1c5.7 0 10.2-5 10.2-11.1s-4.6-11.1-10.2-11.1z" />
      <path d="M189.5 20h-134C24.7 20 10 34.7 10 52.5v135C10 205.3 24.7 220 42.5 220h114.4l-5.4-18.8 13.1 12.1 12.4 11.5 22 19.2V52.5C199 34.7 184.3 20 166.5 20zm-39 135s-3.7-4-6.8-8.3c13.5-3.8 18.6-12.1 18.6-12.1-4.2 2.8-8.2 4.8-11.8 6.2-5.1 2.1-10 3.5-14.8 4.3-9.8 1.8-18.8 1.3-26.5-.1-5.8-1.1-10.7-2.6-14.8-4.3-2.3-.9-4.9-2-7.4-3.5-.3-.2-.6-.3-.9-.5-.2-.1-.3-.2-.4-.3-.4-.2-.6-.4-.6-.4s4.9 8.2 17.8 12c-3 3.9-6.9 8.6-6.9 8.6-22.7-.7-31.3-15.6-31.3-15.6 0-33 14.7-59.8 14.7-59.8 14.7-11 28.6-10.7 28.6-10.7l1 1.2c-18.4 5.3-26.8 13.3-26.8 13.3s2.2-1.2 5.9-2.9c10.7-4.7 19.1-6 22.5-6.3.6-.1 1.1-.2 1.7-.2 6.1-.8 13-1 20.2-.2 9.5 1.1 19.7 3.9 30.1 9.6 0 0-8-7.6-25.3-12.9l1.4-1.6s14-.3 28.6 10.7c0 0 14.7 26.8 14.7 59.8 0-.1-8.7 14.8-31.4 15.5z" />
    </svg>
  );
}

function Star({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l2.9 6.9 7.6.6-5.7 4.8 1.8 7.4-6.6-4-6.6 4 1.8-7.4-5.7-4.8 7.6-.6L12 2z" />
    </svg>
  );
}

function ArrowRight({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13 5l7 7-7 7v-4H4v-6h9V5z" />
    </svg>
  );
}
