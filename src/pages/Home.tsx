// src/pages/Home.tsx
import { useEffect, useMemo, useState } from "react";

type HealthResponse = {
  ok: boolean;
  ts: number;
  message: string;
};

type DiscordUser = {
  id: string;
  username: string;
  global_name?: string;
  avatar?: string;
};

type DiscordGuild = {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: number;
};

type BackendStatus = "loading" | "ok" | "error";
type GuildsStatus = "idle" | "loading" | "ok" | "error" | "noToken";

export default function Home() {
  const API_BASE = import.meta.env.VITE_API_URL as string;
  const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID as string;

  const [backendStatus, setBackendStatus] =
    useState<BackendStatus>("loading");
  const [health, setHealth] = useState<HealthResponse | null>(null);

  const [user, setUser] = useState<DiscordUser | null>(null);

  const [guildsStatus, setGuildsStatus] = useState<GuildsStatus>("idle");
  const [guilds, setGuilds] = useState<DiscordGuild[]>([]);
  const [guildError, setGuildError] = useState<string | null>(null);

  const [activeGuildId, setActiveGuildId] = useState<string | null>(() =>
    localStorage.getItem("voidbot_active_guild")
  );

  const [menuOpen, setMenuOpen] = useState(false);

  // ---- backend health ----
  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/health`);
        const json = (await res.json()) as HealthResponse;
        setHealth(json);
        setBackendStatus("ok");
      } catch (e) {
        console.error(e);
        setBackendStatus("error");
      }
    };
    run();
  }, [API_BASE]);

  // ---- user localStorage-ből ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem("fivemhub_user");
      if (!raw) return;
      setUser(JSON.parse(raw) as DiscordUser);
    } catch (e) {
      console.error("Nem sikerült beolvasni a fivemhub_user-t:", e);
    }
  }, []);

  // ---- guilds backendről ----
  useEffect(() => {
    const token = localStorage.getItem("fivemhub_token");
    if (!token) {
      setGuildsStatus("noToken");
      return;
    }

    const run = async () => {
      try {
        setGuildsStatus("loading");
        setGuildError(null);

        const res = await fetch(`${API_BASE}/api/discord/guilds`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(
            `HTTP ${res.status}${text ? " – " + text.slice(0, 80) : ""}`
          );
        }

        const data = (await res.json()) as DiscordGuild[];

        const MANAGE_GUILD = 0x20;
        const filtered = data.filter(
          (g) => g.owner || (g.permissions & MANAGE_GUILD) === MANAGE_GUILD
        );

        setGuilds(filtered);
        setGuildsStatus("ok");
      } catch (e: any) {
        console.error(e);
        setGuildError(e?.message || "Nem sikerült betölteni a szervereket.");
        setGuildsStatus("error");
      }
    };

    run();
  }, [API_BASE]);

  // ---- active guild mentése ----
  useEffect(() => {
    if (activeGuildId) {
      localStorage.setItem("voidbot_active_guild", activeGuildId);
    } else {
      localStorage.removeItem("voidbot_active_guild");
    }
  }, [activeGuildId]);

  const avatarUrl = user?.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
    : "https://cdn.discordapp.com/embed/avatars/0.png";

  const displayName =
    user?.global_name || user?.username || "Ismeretlen felhasználó";

  const handleLogout = () => {
    localStorage.removeItem("fivemhub_user");
    localStorage.removeItem("fivemhub_token");
    localStorage.removeItem("voidbot_active_guild");
    window.location.href = "/";
  };

  const backendText = () => {
    if (backendStatus === "loading") return "Backend ellenőrzése…";
    if (backendStatus === "error") return "Backend hiba";
    return "Backend rendben";
  };

  const inviteUrlForGuild = (guildId: string) => {
    const permissions = "268446710";
    const base = "https://discord.com/oauth2/authorize";
    const params = new URLSearchParams({
      client_id: clientId,
      scope: "bot applications.commands",
      permissions,
      guild_id: guildId,
      disable_guild_select: "true",
      response_type: "code",
    });
    return `${base}?${params.toString()}`;
  };

  const handleInvite = (g: DiscordGuild) => {
    window.open(inviteUrlForGuild(g.id), "_blank");
    setActiveGuildId(g.id);
  };

  const handleManage = (g: DiscordGuild) => {
    window.location.href = `/server/${g.id}`;
  };

  const hasOtherActive =
    !!activeGuildId &&
    guilds.some((g) => g.id === activeGuildId) &&
    guilds.length > 0;

  const activeGuild = useMemo(
    () => guilds.find((g) => g.id === activeGuildId) || null,
    [guilds, activeGuildId]
  );

  const totalGuilds = guilds.length;

  return (
    <main className="home-root">
      {/* HERO – sötét rész, mint a landing teteje */}
      <section className="home-hero">
        <div className="home-hero-shell">
          {/* felső sáv */}
          <header className="home-hero-top">
            <div className="home-logo">
              <span className="home-logo-dot" />
              <span className="home-logo-text">VOIDBOT</span>
            </div>

            <div className="home-top-right">
              <div
                className={`home-backend-pill home-backend-pill--${backendStatus}`}
              >
                <span className="home-backend-dot" />
                <span>{backendText()}</span>
              </div>

              <div className="home-user-menu">
                <button
                  type="button"
                  className="home-user-btn"
                  onClick={() => setMenuOpen((v) => !v)}
                >
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="home-user-avatar"
                  />
                  <span className="home-user-name">{displayName}</span>
                  <ChevronIcon />
                </button>

                {menuOpen && (
                  <div className="home-user-dropdown">
                    <button
                      type="button"
                      className="home-dropdown-item"
                      onClick={() => {
                        setMenuOpen(false);
                        window.location.href = "/profile";
                      }}
                    >
                      <UserIcon />
                      Profil
                    </button>
                    <button
                      type="button"
                      className="home-dropdown-item"
                      onClick={() => {
                        setMenuOpen(false);
                        window.location.href = "/settings";
                      }}
                    >
                      <GearIcon />
                      Beállítások
                    </button>
                    <div className="home-dropdown-sep" />
                    <button
                      type="button"
                      className="home-dropdown-item home-dropdown-item--danger"
                      onClick={handleLogout}
                    >
                      <LogoutIcon />
                      Kijelentkezés
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* hero tartalom */}
          <div className="home-hero-main">
            <div className="home-hero-left">
              <p className="home-kicker">Dashboard</p>
              <h1 className="home-title">
                Time to manage your <span>[VOIDBOT]</span> servers.
              </h1>
              <p className="home-sub">
                Letisztult, Discord-fókuszú bot panel. Egy helyen látod a
                szervereidet, modulokat és statokat – úgy, hogy közben nem kell
                végigklikkelni a Discordot.
              </p>

              <div className="home-hero-actions">
                <a href="#servers" className="home-btn home-btn-primary">
                  Ugrás a szerverekhez
                </a>
                <button
                  type="button"
                  className="home-btn home-btn-secondary"
                  onClick={() => {
                    const el = document.getElementById("modules");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Modulok (hamarosan)
                </button>
              </div>
            </div>

            <aside className="home-hero-card">
              <div className="home-hero-card-header">
                <span className="home-hero-card-title">
                  Aktív szerver állapot
                </span>
                <span className="home-hero-card-id">
                  {activeGuild ? activeGuild.name : "#0000"}
                </span>
              </div>
              <ul className="home-hero-card-list">
                <li>
                  <span>Backend</span>
                  <span
                    className={`home-status-pill home-status-pill--${backendStatus}`}
                  >
                    {backendStatus === "loading"
                      ? "Ellenőrzés…"
                      : backendStatus === "ok"
                      ? "Online"
                      : "Hiba"}
                  </span>
                </li>
                <li>
                  <span>Összes szerver</span>
                  <span>{totalGuilds}</span>
                </li>
                <li>
                  <span>Aktív szerver</span>
                  <span>{activeGuild ? activeGuild.name : "Nincs kiválasztva"}</span>
                </li>
              </ul>
            </aside>
          </div>
        </div>
      </section>

      {/* ALSÓ VILÁGOS RÉSZ – mint a landing „Mit tud a VOIDBOT?” */}
      <div className="home-main-shell">
        {/* overview kártyák */}
        <section className="home-section-row">
          <article className="home-card">
            <h2 className="home-card-title">Mit látsz itt?</h2>
            <p className="home-card-text">
              Ez a VOIDBOT vezérlőpult. Innen tudod:
            </p>
            <ul className="home-list">
              <li>Szerverekhez kapcsolni / leválasztani a botot.</li>
              <li>Átlátni a rendszer állapotát és a frissítéseket.</li>
              <li>Később: modulonként konfigurálni az automodot, rang menüket, FiveM integrációt.</li>
            </ul>
          </article>

          <article className="home-card">
            <h2 className="home-card-title">Rendszer állapot</h2>
            <p className="home-card-text">
              {backendStatus === "loading"
                ? "Backend ellenőrzése folyamatban…"
                : backendStatus === "error"
                ? "Backend hiba – nézd meg később, vagy írj supportnak."
                : "Minden zöld, a backend online."}
            </p>
            {backendStatus === "ok" && health && (
              <pre className="home-health-json">
                {JSON.stringify(health, null, 2)}
              </pre>
            )}
          </article>
        </section>

        {/* szerverek */}
        <section id="servers" className="home-section">
          <div className="home-section-header">
            <div>
              <h2 className="home-section-title">Szervereid</h2>
              <p className="home-section-sub">
                Olyan szerverek, ahol tulajdonos vagy, vagy van{" "}
                <code>Manage Server</code> jogod. Free csomagban egy aktív
                szerver engedélyezett.
              </p>
            </div>
          </div>

          {guildsStatus === "noToken" && (
            <div className="home-info home-info--warning">
              Nem találtam érvényes Discord tokent. Lépj be újra a főoldalról.
            </div>
          )}

          {guildsStatus === "loading" && (
            <div className="home-info">Szerverek betöltése…</div>
          )}

          {guildsStatus === "error" && (
            <div className="home-info home-info--error">
              Nem sikerült betölteni a szervereket.
              {guildError && (
                <span className="home-info-detail">{guildError}</span>
              )}
            </div>
          )}

          {guildsStatus === "ok" && guilds.length === 0 && (
            <div className="home-info">
              Nem találtunk olyan szervert, ahol lenne jogosultságod.
            </div>
          )}

          {guildsStatus === "ok" && guilds.length > 0 && (
            <>
              {activeGuildId && hasOtherActive && (
                <div className="home-info home-info--note">
                  Free csomag: jelenleg egy aktív szerveren fut a VOIDBOT. Másik
                  szerver aktiválásához előbb válaszd le az aktuálisat.
                </div>
              )}

              <div className="home-server-grid">
                {guilds.map((g) => {
                  const iconUrl = g.icon
                    ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=128`
                    : "https://cdn.discordapp.com/embed/avatars/1.png";

                  const isActive = activeGuildId === g.id;
                  const blockedByFree =
                    !!activeGuildId && activeGuildId !== g.id;

                  return (
                    <article className="home-server-card" key={g.id}>
                      <div className="home-server-main">
                        <img
                          src={iconUrl}
                          alt={g.name}
                          className="home-server-icon"
                        />
                        <div className="home-server-text">
                          <h3 className="home-server-name">{g.name}</h3>
                          <p className="home-server-meta">
                            {g.owner
                              ? "Tulajdonos"
                              : "Admin / Manage Server jog"}
                          </p>
                          <div className="home-server-status">
                            {isActive ? (
                              <span className="home-pill home-pill--ok">
                                Bot csatlakoztatva
                              </span>
                            ) : blockedByFree ? (
                              <span className="home-pill home-pill--limit">
                                Free csomag: max 1 aktív szerver
                              </span>
                            ) : (
                              <span className="home-pill">
                                Bot még nincs meghívva
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="home-server-actions">
                        {isActive ? (
                          <>
                            <button
                              type="button"
                              className="home-btn-inline home-btn-inline--primary"
                              onClick={() => handleManage(g)}
                            >
                              Kezelés
                            </button>
                            <button
                              type="button"
                              className="home-btn-inline home-btn-inline--ghost"
                              onClick={() => setActiveGuildId(null)}
                            >
                              Leválasztás
                            </button>
                          </>
                        ) : blockedByFree ? (
                          <button
                            type="button"
                            className="home-btn-inline home-btn-inline--disabled"
                            disabled
                          >
                            Free: csak 1 aktív szerver
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="home-btn-inline home-btn-inline--primary"
                            onClick={() => onInvite(g, handleInvite)}
                          >
                            Meghívás erre a szerverre
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </section>

        {/* modul teaser – „Mit tud a VOIDBOT?” stílus */}
        <section id="modules" className="home-section">
          <h2 className="home-section-title">Mit tud a VOIDBOT?</h2>
          <p className="home-section-sub">
            Nem 200 random slash parancs, hanem néhány okosan összerakott modul.
          </p>

          <div className="home-feature-grid">
            <article className="home-feature-card">
              <h3>Smart moderation</h3>
              <p>
                Anti-spam, link-filter, softban, audit log – mindegyik
                konfigurálható, mintha egy kis admin panelen kattintgatnál, nem
                parancsokkal szenvednél.
              </p>
              <span className="home-tag">Moderation</span>
            </article>

            <article className="home-feature-card">
              <h3>Role menus &amp; onboarding</h3>
              <p>
                Reagálós rangok, onboarding panelek és info-csatornák – mindez
                egy webes felületről állítható, a Discord kliense érintése
                nélkül.
              </p>
              <span className="home-tag">Utility</span>
            </article>

            <article className="home-feature-card">
              <h3>Server stats &amp; FiveM integráció</h3>
              <p>
                Online játékosok, csatlakozások, parancs-használat. Később
                külön FiveM modul a saját szerveredhez.
              </p>
              <span className="home-tag home-tag--accent">FiveM module</span>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}

// helper, hogy a handler típus kompatibilis legyen
function onInvite(
  g: DiscordGuild,
  handler: (guild: DiscordGuild) => void
) {
  handler(g);
}

/* ----- ikonok ----- */

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M7 10l5 5 5-5z" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5zm0-6.5 2 1 2.3-.3.9 2 1.8 1.3-.5 2.2L21 11l1.5 1.8-.5 2.2-1.8 1.3-.9 2-2.3-.3-2 1-2-1-2.3.3-.9-2-1.8-1.3.5-2.2L3 11l1.5-1.8-.5-2.2L5.8 5.7l.9-2L9 4l2-1z"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zm0 2c-3 0-8 1.5-8 4.5V21h16v-2.5C20 15.5 15 14 12 14z"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M16 13v-2H9V8L4 12l5 4v-3h7zm1-10H7a2 2 0 0 0-2 2v4h2V6h10v12H7v-3H5v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"
      />
    </svg>
  );
}
