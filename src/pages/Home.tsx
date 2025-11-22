// src/pages/Home.tsx
import { useEffect, useRef, useState } from "react";

/* ——— Típusok ——— */
type DiscordUser = {
  id: string;
  username: string;
  global_name?: string;
  avatar?: string;
  email?: string;
};

/* Szerver típus a Discord /users/@me/guilds-hez */
type DiscordGuild = {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: number;
};

/* ——— Oldal ——— */
export default function Home() {
  const [user, setUser] = useState<DiscordUser | null>(null);

  const loadUser = () => {
    try {
      const raw = localStorage.getItem("fivemhub_user");
      setUser(raw ? JSON.parse(raw) : null);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    loadUser();
    const onAuth = () => loadUser();
    window.addEventListener("auth_changed", onAuth);
    return () => window.removeEventListener("auth_changed", onAuth);
  }, []);

  const avatarUrl = user?.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`
    : `https://cdn.discordapp.com/embed/avatars/0.png`;
  const displayName = user?.global_name || user?.username || "Vendég";

  return (
    <main className="min-h-screen bg-[#0b0d10] text-white">
      <Background />

      {/* NAVBAR */}
      <Navbar user={user} avatarUrl={avatarUrl} displayName={displayName} />

      {/* TARTALOM */}
      <section className="mx-auto max-w-7xl px-6 py-6 md:px-10 md:py-10">
        {/* Üdvözlő sáv */}
        <header className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h1 className="text-2xl font-extrabold tracking-tight">Üdv, {displayName}!</h1>
          <p className="mt-1 text-white/70">
            Itt tudod kezelni a botot a saját szerveredre alakítva.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
          {/* JOBB — Fő tartalom */}
          <div className="space-y-6">
            {/* Profil összefoglaló */}
            <ProfileSummary user={user} avatarUrl={avatarUrl} />

            {/* Eszköz párosítása (csak bejelentkezve) */}
            {user && <PairDeviceCard />}

            {/* Fő akciók (kártyák) */}
            <ActionGrid />

            {/* Saját Discord szerverek (csak bejelentkezve) */}
            {user && <MyGuilds />}
          </div>
        </div>
      </section>

      {/* LÁBLÉC */}
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-6 py-6 text-xs text-white/60 md:flex-row md:px-10">
          <span>© {new Date().getFullYear()} FiveM Hub • HU közösség</span>
          <span>Adatkezelés • Felhasználási feltételek • Kapcsolat</span>
        </div>
      </footer>
    </main>
  );
}

/* ——— NAVBAR + profil dropdown ——— */
function Navbar({
  user,
  avatarUrl,
  displayName,
}: {
  user: DiscordUser | null;
  avatarUrl: string;
  displayName: string;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  const logout = () => {
    localStorage.removeItem("fivemhub_user");
    localStorage.removeItem("fivemhub_token");
    window.dispatchEvent(new Event("auth_changed"));
    window.location.href = "/";
  };

  const handleDiscordLogin = () => {
    const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID as string;
    const redirect = encodeURIComponent(import.meta.env.VITE_DISCORD_REDIRECT as string);
    const scope = encodeURIComponent("identify guilds");
    const state = crypto.randomUUID();
    sessionStorage.setItem("oauth_state", state);
    const prompt = "consent";
    window.location.href =
      `https://discord.com/oauth2/authorize?client_id=${clientId}` +
      `&response_type=code&redirect_uri=${redirect}&scope=${scope}` +
      `&state=${encodeURIComponent(state)}&prompt=${prompt}`;
  };

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-10">
        <a href="/" className="flex items-center gap-3">
          <Mark />
          <span className="text-sm font-semibold tracking-wider text-white/90">VOIDBOT</span>
        </a>

        <nav className="hidden gap-8 text-sm text-white/70 md:flex">
          <a className="hover:text-white transition" href="/market">Piactér</a>
          <a className="hover:text-white transition" href="/kb">Tudástár</a>
          <a className="hover:text-white transition" href="/jobs">Munkák</a>
          <a className="hover:text-white transition" href="/community">Közösség</a>
        </nav>

        {!user ? (
          <button
            onClick={handleDiscordLogin}
            className="inline-flex items-center gap-2 rounded-lg bg-white text-[#0b0d10] px-4 py-2 text-sm font-semibold transition hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/30"
            aria-label="Belépés Discorddal"
          >
            <DiscordIcon className="h-5 w-5" />
            Belépés Discorddal
          </button>
        ) : (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center gap-3 rounded-lg border border-white/15 bg-white/[0.03] px-3 py-1.5 transition hover:bg-white/[0.06]"
            >
              <img src={avatarUrl} className="h-7 w-7 rounded-full border border-white/20" />
              <div className="hidden text-left md:block">
                <p className="text-xs leading-none text-white/60">Bejelentkezve</p>
                <p className="text-sm font-semibold leading-tight">{displayName}</p>
              </div>
              <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-[#101318] shadow-xl">
                <MenuItem href="/profile" label="Profil" icon={<UserIcon />} />
                <MenuItem href="/settings" label="Beállítások" icon={<CogIcon />} />
                <MenuItem href="/admin" label="Admin Panel" icon={<ShieldIcon />} />
                <div className="my-1 h-px bg-white/10" />
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-white/90 transition hover:bg白/5"
                >
                  <LogoutIcon />
                  Kijelentkezés
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

/* ——— Jobb: Profil összefoglaló ——— */
function ProfileSummary({
  user,
  avatarUrl,
}: {
  user: DiscordUser | null;
  avatarUrl: string;
}) {
  if (!user) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center">
        <p className="text-white/80">Nem vagy bejelentkezve.</p>
        <p className="mt-1 text-sm text-white/60">
          Jelentkezz be Discorddal, hogy lásd a személyre szabott tartalmakat.
        </p>
        <a
          href="/"
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 font-semibold text-[#0b0d10] transition hover:bg-white/90"
        >
          Vissza a főoldalra
        </a>
      </div>
    );
  }

  const displayName = user.global_name || user.username;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center gap-4">
        <img src={avatarUrl} className="h-14 w-14 rounded-full border border-white/20" />
        <div className="min-w-0">
          <p className="text-xs text-white/60">Profil</p>
          <h2 className="truncate text-xl font-bold">{displayName}</h2>
          <p className="truncate text-white/60 text-sm">@{user.username}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <a href="/profile" className="rounded-lg border border-white/15 px-3 py-1.5 text-sm transition hover:bg-white/5">
            Megnyitás
          </a>
          <a href="/settings" className="rounded-lg border border-white/15 px-3 py-1.5 text-sm transition hover:bg-white/5">
            Beállítások
          </a>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Stat label="Licens" value="—" />
        <Stat label="Jog" value="—" />
        <Stat label="Szerver" value="0" />
      </div>
    </div>
  );
}

/* ——— Eszköz párosítása ——— */
function PairDeviceCard() {
  const [code, setCode] = useState<string | null>(null);
  const [exp, setExp] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("fivemhub_token");
  const API_BASE = (import.meta as any).env?.VITE_API_URL || "http://localhost:3000";

  useEffect(() => {
    let timer: any;
    if (exp) {
      timer = setInterval(() => {
        if (Date.now() > exp) {
          setCode(null);
          setExp(null);
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [exp]);

  const start = async () => {
    try {
      setLoading(true);
      setErr(null);
      if (!token) throw new Error("Nincs token – jelentkezz be újra!");

      const r = await fetch(`${API_BASE}/api/device/start`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "ismeretlen hiba");

      setCode(data.device_code);
      setExp(data.expires_at);
    } catch (e: any) {
      setErr(e.message || "Hiba a párosítás indításakor");
    } finally {
      setLoading(false);
    }
  };

  const remaining = exp ? Math.max(0, Math.floor((exp - Date.now()) / 1000)) : 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h3 className="text-lg font-bold">Eszköz párosítása (Windows app)</h3>
      <p className="mt-1 text-white/70">
        Kattints a gombra, kapsz egy kódot. Ezt írd be a Windows alkalmazásban a belépéshez.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          onClick={start}
          disabled={loading}
          className="rounded-lg bg-white/90 px-4 py-2 text-sm font-semibold text-[#0b0d10] transition hover:bg-white disabled:opacity-50"
        >
          {loading ? "Kód generálása…" : "Párosítás indítása"}
        </button>

        {code && (
          <div className="rounded-md border border-white/15 bg-white/[0.06] px-3 py-2 text-sm font-mono">
            <span className="text-white/70">Kód:</span>{" "}
            <span className="font-bold tracking-wider">{code}</span>
            <span className="ml-3 text-white/60">
              (lejár {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")})
            </span>
          </div>
        )}
      </div>

      {err && <p className="mt-2 text-rose-300 text-sm">{err}</p>}
    </div>
  );
}

/* ——— Fő akciók ——— */
function ActionGrid() {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      <ActionCard
        href="/jobs"
        title="DEVELOPER"
        desc="ITT LESZ VALAMI 1"
        icon={<BriefcaseIcon />}
        tag="DEVELOPER"
      />
      <ActionCard
        href="/servers"
        title="DEVELOPER"
        desc="ITT LESZ VALAMI 2"
        icon={<ServerIcon />}
        tag="DEVELOPER"
      />
      <ActionCard
        href="/market/sell"
        title="DEVELOPER"
        desc="ITT LESZ VALAMI 3"
        icon={<CartIcon />}
        tag="DEVELOPER"
      />
    </div>
  );
}
/* ——— Saját Discord szerverek (owner=true) ——— */
function MyGuilds() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [guilds, setGuilds] = useState<DiscordGuild[]>([]);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("fivemhub_token"));

  useEffect(() => {
    const onAuth = () => setToken(localStorage.getItem("fivemhub_token"));
    const onStorage = (e: StorageEvent) => {
      if (e.key === "fivemhub_token" || e.key === "fivemhub_user") setToken(localStorage.getItem("fivemhub_token"));
    };
    window.addEventListener("auth_changed", onAuth);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("auth_changed", onAuth);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const tk = token || localStorage.getItem("fivemhub_token");
        if (!tk) throw new Error("missing_token");

        const API_BASE = (import.meta as any).env?.VITE_API_URL || "http://localhost:3000";

        const res = await fetch(`${API_BASE}/api/discord/guilds`, {
          headers: { Authorization: `Bearer ${tk}` },
        });

        const text = await res.text();

        if (!res.ok) {
          // Ha 401: töröljük a helyi tokent (kényszerítjük a felhasználót újbóli belépésre)
          if (res.status === 401) {
            localStorage.removeItem("fivemhub_token");
            window.dispatchEvent(new Event("auth_changed"));
          }
          // Mutassuk a backend/discord pontos üzenetét, hogy debugolni tudjunk
          throw new Error(`Discord API hiba (${res.status}): ${text}`);
        }

        const data: DiscordGuild[] = JSON.parse(text);
        if (!mounted) return;

        // Kizárólag azok a szerverek, ahol owner === true (te hoztad létre)
        const owners = data.filter((g) => g.owner);
        setGuilds(owners);
      } catch (e: any) {
        if (!mounted) return;
        console.error("MyGuilds error:", e);
        // Felhasználóbarát és debug üzenet egyszerre
        setErr(
          typeof e.message === "string" && e.message.includes("Discord API hiba")
            ? `Nem sikerült betölteni a szervereket. Részlet: ${e.message}`
            : "Nem sikerült betölteni a szervereket. Ellenőrizd, hogy az OAuth tartalmazza a „guilds” scope-ot, illetve hogy a token érvényes."
        );
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [token]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-white/80">Szerverek betöltése…</p>
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h3 className="text-lg font-bold">Szervereim</h3>
        <p className="mt-1 text-rose-300 break-words">{err}</p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setToken(localStorage.getItem("fivemhub_token"))}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-sm transition hover:bg-white/5"
          >
            Újrapróbálás
          </button>
          <button
            onClick={() => {
              // segítség gomb: megmutatjuk, mit kell ellenőrizni
              alert("Ellenőrizd: OAuth scope tartalmazza a 'guilds'-t, és a Discord engedélyezésnél elfogadtad azt.");
            }}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-sm transition hover:bg-white/5"
          >
            Mit ellenőrizzek?
          </button>
        </div>
      </div>
    );
  }

  if (!guilds.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h3 className="text-lg font-bold">Szervereim</h3>
        <p className="mt-1 text-white/70">
          Nem találtunk olyan szervert, amelynek te vagy a tulaja.
        </p>
        <p className="mt-2 text-sm text-white/60">(Győződj meg róla, hogy a Discord-on tulajdonos vagy, és ugyanazzal a fiókkal léptél be.)</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h3 className="text-lg font-bold">Szervereim</h3>
      <p className="mt-1 text-white/60">
        Azok a Discord szerverek, ahol <span className="font-semibold">Tulajdonos</span> vagy.
      </p>

      <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {guilds.map((g) => (
          <GuildCard key={g.id} guild={g} />
        ))}
      </ul>

      <a href="/servers" className="mt-4 inline-block text-sm text-white/70 underline">
        Összes megnyitása
      </a>
    </div>
  );
}

/* GuildCard: "Kezelés" -> "Bot hozzáadás" (invite link) */
function GuildCard({ guild }: { guild: DiscordGuild }) {
  const iconUrl = guild.icon
    ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128`
    : `https://cdn.discordapp.com/embed/avatars/0.png`;

  // Invite URL: cseréld ki a CLIENT_ID-t a saját botod client id-jére vagy tedd env-be
  const CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID || "YOUR_BOT_CLIENT_ID";
  // permissions szám: állítsd be, milyen jogokat kér a bot (például 8 = Administrator, inkább konkrét perms ajánlott)
  const PERMISSIONS = "8"; // ide lehet más számot tenni
  const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&scope=bot%20applications.commands&permissions=${PERMISSIONS}&guild_id=${guild.id}&disable_guild_select=true`;

  return (
    <li className="rounded-xl border border-white/10 bg-white/[0.02] p-4 transition hover:bg-white/[0.05]">
      <div className="flex items-center gap-3">
        <img src={iconUrl} className="h-10 w-10 rounded-lg border border-white/20" />
        <div className="min-w-0">
          <p className="truncate font-semibold">{guild.name}</p>
          <p className="text-xs text-emerald-300/90 mt-0.5">Tulajdonos</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <a
          href={inviteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-white/15 px-3 py-1.5 text-sm transition hover:bg-white/5"
        >
          Bot hozzáadás
        </a>
        <a
          href={`/server/${guild.id}/promote`}
          className="rounded-lg bg-white/90 px-3 py-1.5 text-sm font-semibold text-[#0b0d10] transition hover:bg-white"
        >
          Hirdetés
        </a>
      </div>
    </li>
  );
}

/* ——— Kisegítő komponensek ——— */
function Background() {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(120%_80%_at_50%_-10%,#141922_0%,#0b0d10_60%)]" />
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-[0.06] [background:repeating-linear-gradient(90deg,transparent_0,transparent_10px,rgba(255,255,255,.5)_11px,transparent_12px)]" />
    </>
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
function ChevronDown({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M7 10l5 5 5-5z" />
    </svg>
  );
}
function MenuItem({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <a href={href} className="flex items-center gap-3 px-4 py-2.5 text-white/90 transition hover:bg-white/5">
      <span className="inline-grid h-5 w-5 place-items-center">{icon}</span>
      {label}
    </a>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3">
      <p className="text-xs text-white/60">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
function ActionCard({
  href,
  title,
  desc,
  icon,
  tag,
  free,
}: {
  href: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  tag: string;
  free?: boolean;
}) {
  return (
    <a
      href={href}
      className="group block rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:-translate-y-0.5 hover:bg-white/[0.06]"
    >
      <div className="flex items-start justify-between">
        <div className="inline-grid h-10 w-10 place-items-center rounded-lg bg-white/10">{icon}</div>
        <span
          className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
            free ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-white/80"
          }`}
        >
          {tag}
        </span>
      </div>

      <h3 className="mt-3 text-lg font-bold">{title}</h3>
      <p className="mt-1 text-sm text-white/70">{desc}</p>

      <div className="mt-4 inline-flex items-center gap-2 text-sm text-white/80">
        <span>Tovább</span>
        <ArrowRight />
      </div>
    </a>
  );
}

/* ——— Ikonok ——— */
function DiscordIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 245 240" fill="currentColor" aria-hidden="true">
      <path d="M104.4 104.9c-5.7 0-10.2 5-10.2 11.1s4.6 11.1 10.2 11.1c5.7 0 10.2-5 10.2-11.1s-4.6-11.1-10.2-11.1z" />
      <path d="M189.5 20h-134C24.7 20 10 34.7 10 52.5v135C10 205.3 24.7 220 42.5 220h114.4l-5.4-18.8 13.1 12.1 12.4 11.5 22 19.2V52.5C199 34.7 184.3 20 166.5 20z" />
    </svg>
  );
}
function ArrowRight({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13 5l7 7-7 7v-4H4v-6h9V5z" />
    </svg>
  );
}
function BriefcaseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M9 3h6a2 2 0 0 1 2 2v2h2a2 2 0 0 1 2 2v3H1V9a2 2 0 0 1 2-2h2V5a2 2 0 0 1 2-2zm1 4h4V5h-4v2zM1 12h22v5a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-5z" />
    </svg>
  );
}
function ServerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M3 4h18v6H3V4zm0 10h18v6H3v-6zm2-8v2h2V6H5zm0 10v2h2v-2H5z" />
    </svg>
  );
}
function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M7 4h-2l-1 2H1v2h2l3.6 7.59-1.35 2.45A1.99 1.99 0 0 0 5 20h14v-2H6.42a.25.25 0 0 1-.22-.13l.03-.06L7.1 15h7.45a2 2 0 0 0 1.79-1.11L21 6H6.21L7 4zM7 22a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm10 0a2 2 0 1 0 .001-3.999A2 2 0 0 0 17 22z" />
    </svg>
  );
}
function PublishIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M5 20h14v-2H5v2zM12 2l5 5h-3v6h-4V7H7l5-5z" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zM8 11c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V20h14v-3.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V20h6v-3.5c0-2.33-4.67-3.5-7-3.5z" />
    </svg>
  );
}
function CodeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M9.4 16.6L5.8 13l3.6-3.6L8 8l-5 5 5 5 1.4-1.4zm5.2 0L18.2 13l-3.6-3.6L16 8l5 5-5 5-1.4-1.4z" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z" />
    </svg>
  );
}
function CogIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0  0 0-.6-.22l-2.39.96a7.007 7.007 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 14.3 1h-4.6a.5.5 0 0 0-.49.41l-.36 2.54c-.58.24-1.12.55-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 7.02a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.14.24.43.34.68.22l2.39-.96c.51.39 1.05.7 1.63.94l.36 2.54c.06.24.26.41.49.41h4.6c.24 0 .44-.17.49-.41l.36-2.54c.58-.24 1.12-.55 1.63-.94l2.39.96c.26.1.55 0  .68-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z"/></svg>
  );
}
function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M12 2l8 3v6c0 5.25-3.438 9.75-8 11-4.562-1.25-8-5.75-8-11V5l8-3z"/></svg>
  );
}
function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M16 13v-2H7V8l-5 4 5 4v-3h9zM20 3h-8v2h8v14h-8v2h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/></svg>
  );
}
