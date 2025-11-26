// src/pages/Home.tsx
import { useEffect, useState } from "react";

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
  const [activeTab, setActiveTab] = useState<
    "overview" | "servers" | "commands" | "tickets" | "logs"
  >("overview");

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
    const permissions = "268446710"; // majd finomhangolható
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

  return (
    <main className="dash-root">
      <div className="dash-shell">
        {/* FELSŐ SÁV */}
        <header className="dash-top-row">
          {/* Bal oldali VOIDBOT blokk */}
          <div className="dash-brand-card">
            <div className="dash-brand-pill">VOIDBOT</div>
            <h1 className="dash-brand-title">Dashboard</h1>
            <p className="dash-brand-sub">
              Letisztult, Discord-fókuszú vezérlőpult. Itt látod a szervereid
              állapotát, logokat és a közelgő frissítéseket.
            </p>
          </div>

          {/* Jobb: user + mini menü */}
          <div className="dash-user-wrapper">
            <div className="dash-user-card">
              <div className="dash-user-left">
                <div className="dash-user-avatar">
                  <img src={avatarUrl} alt="Avatar" />
                </div>
                <div className="dash-user-text">
                  <div className="dash-user-name">{displayName}</div>
                  <div className="dash-user-tag">
                    @{user?.username ?? "unknown"}
                  </div>
                  <div className="dash-user-plan">
                    Tagság: <span>Ingyenes</span>
                  </div>
                </div>
              </div>
              <div className="dash-user-status">
                <span
                  className={`dash-status-dot dash-status-dot--${backendStatus}`}
                />
                <span>{backendText()}</span>
              </div>
            </div>

            <div className="dash-menu-wrapper">
              <button
                type="button"
                className="dash-menu-toggle"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Felhasználói menü"
              >
                <DotsIcon />
              </button>

              {menuOpen && (
                <div className="dash-menu-dropdown">
                  <button
                    type="button"
                    className="dash-menu-item"
                    onClick={() => {
                      setMenuOpen(false);
                      window.location.href = "/settings";
                    }}
                  >
                    <GearIcon />
                    Beállítások
                  </button>
                  <button
                    type="button"
                    className="dash-menu-item"
                    onClick={() => {
                      setMenuOpen(false);
                      window.location.href = "/profile";
                    }}
                  >
                    <UserIcon />
                    Profil
                  </button>
                  <div className="dash-menu-sep" />
                  <button
                    type="button"
                    className="dash-menu-item dash-menu-item--danger"
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

        {/* KÉK TAB SÁV */}
        <nav className="dash-nav-bar">
          <NavItem
            label="Kezdőlap"
            active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
          />
          <NavItem
            label="Szerverek"
            active={activeTab === "servers"}
            onClick={() => setActiveTab("servers")}
          />
          <NavItem
            label="Commandok"
            active={activeTab === "commands"}
            onClick={() => setActiveTab("commands")}
          />
          <NavItem
            label="Ticketek"
            active={activeTab === "tickets"}
            onClick={() => setActiveTab("tickets")}
          />
          <NavItem
            label="Logok"
            active={activeTab === "logs"}
            onClick={() => setActiveTab("logs")}
          />
        </nav>

        {/* TARTALOM – TABOK SZERINT */}
        {activeTab === "overview" && (
          <OverviewSection backendStatus={backendStatus} health={health} />
        )}

        {activeTab === "servers" && (
          <ServersSection
            guildsStatus={guildsStatus}
            guilds={guilds}
            guildError={guildError}
            activeGuildId={activeGuildId}
            hasOtherActive={hasOtherActive}
            onInvite={handleInvite}
            onManage={handleManage}
            onDetach={() => setActiveGuildId(null)}
          />
        )}

        {activeTab === "commands" && (
          <ComingSoonSection
            title="Commandok"
            description="Itt fogod tudni menedzselni a slash parancsokat, modulonként rendezve."
          />
        )}

        {activeTab === "tickets" && (
          <ComingSoonSection
            title="Ticketek"
            description="Ticket rendszer statisztikák, megnyitott / lezárt ticketek, átlagos válaszidő – minden egy helyen."
          />
        )}

        {activeTab === "logs" && (
          <ComingSoonSection
            title="Logok"
            description="Moderációs log, join/leave napló és bot események. Később ide jönnek a részletes szűrők."
          />
        )}
      </div>
    </main>
  );
}

/* ----------------- Kis komponensek ----------------- */

function NavItem({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`dash-nav-item ${active ? "dash-nav-item--active" : ""}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function OverviewSection({
  backendStatus,
  health,
}: {
  backendStatus: BackendStatus;
  health: HealthResponse | null;
}) {
  return (
    <section className="dash-overview">
      <div className="dash-overview-main">
        <h2>Üdv a VOIDBOT panelen 👋</h2>
        <p>
          Itt fogod látni a szervereidet, a bot állapotát, hamarosan pedig a
          parancsok és ticketek statjait is. Az alábbi dobozban mindig a
          legfrissebb változásokat írjuk ki.
        </p>

        <ul className="dash-changelog">
          <li>
            <span className="dash-chip dash-chip--new">Új</span>
            Alap dashboard felület & Discord belépés összekötve.
          </li>
          <li>
            <span className="dash-chip dash-chip--soon">Hamarosan</span>
            Szerverenként külön modulok: automod, rang menük, FiveM integráció.
          </li>
          <li>
            <span className="dash-chip dash-chip--soon">Hamarosan</span>
            Log nézet (moderáció, join/leave, parancsok).
          </li>
        </ul>
      </div>

      <aside className="dash-overview-side">
        <h3>Rendszer állapot</h3>
        <p className="dash-overview-status">
          {backendStatus === "loading"
            ? "Backend ellenőrzése…"
            : backendStatus === "error"
            ? "Backend hiba – nézd meg később."
            : "Minden zöld: backend online."}
        </p>

        {backendStatus === "ok" && health && (
          <pre className="dash-overview-health">
            {JSON.stringify(health, null, 2)}
          </pre>
        )}
      </aside>
    </section>
  );
}

function ServersSection(props: {
  guildsStatus: GuildsStatus;
  guilds: DiscordGuild[];
  guildError: string | null;
  activeGuildId: string | null;
  hasOtherActive: boolean;
  onInvite: (g: DiscordGuild) => void;
  onManage: (g: DiscordGuild) => void;
  onDetach: () => void;
}) {
  const {
    guildsStatus,
    guilds,
    guildError,
    activeGuildId,
    hasOtherActive,
    onInvite,
    onManage,
    onDetach,
  } = props;

  return (
    <section className="dash-grid-section">
      <div className="dash-grid-header">
        <h2>Szervereid</h2>
        <p>
          Olyan szerverek listája, ahol tulaj vagy, vagy van{" "}
          <code>Manage Server</code> jogod. Free csomagban 1 szerverhez
          kapcsolhatod a VOIDBOT-ot.
        </p>
      </div>

      {guildsStatus === "noToken" && (
        <div className="dash-info-box">
          Nem találtam érvényes Discord tokent. Lépj be újra a főoldalról.
        </div>
      )}

      {guildsStatus === "loading" && (
        <div className="dash-info-box">Szerverek betöltése…</div>
      )}

      {guildsStatus === "error" && (
        <div className="dash-info-box dash-info-box--error">
          Nem sikerült betölteni a szervereket.
          {guildError && (
            <span className="dash-info-detail">{guildError}</span>
          )}
        </div>
      )}

      {guildsStatus === "ok" && guilds.length === 0 && (
        <div className="dash-info-box">
          Nem találtunk olyan szervert, ahol lenne jogosultságod.
        </div>
      )}

      {guildsStatus === "ok" && guilds.length > 0 && (
        <>
          {activeGuildId && hasOtherActive && (
            <div className="dash-free-note">
              Free csomag: jelenleg egy aktív szerveren fut a VOIDBOT. Másik
              szerver aktiválásához előbb válaszd le az aktuálisat.
            </div>
          )}

          <div className="dash-grid">
            {guilds.map((g) => {
              const iconUrl = g.icon
                ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=128`
                : "https://cdn.discordapp.com/embed/avatars/1.png";

              const isActive = activeGuildId === g.id;
              const blockedByFree =
                !!activeGuildId && activeGuildId !== g.id;

              return (
                <article className="dash-card" key={g.id}>
                  <div className="dash-card-main">
                    <div className="dash-card-icon">
                      <img src={iconUrl} alt={g.name} />
                    </div>
                    <div className="dash-card-text">
                      <h3>{g.name}</h3>
                      <p>
                        {g.owner ? "Tulajdonos" : "Admin / Manage Server jog"}
                      </p>
                      <div className="dash-card-status">
                        {isActive ? (
                          <span className="dash-pill dash-pill--ok">
                            Bot csatlakoztatva
                          </span>
                        ) : blockedByFree ? (
                          <span className="dash-pill dash-pill--limit">
                            Free csomag: max 1 aktív szerver
                          </span>
                        ) : (
                          <span className="dash-pill">
                            Bot még nincs meghívva
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="dash-card-actions">
                    {isActive ? (
                      <>
                        <button
                          type="button"
                          className="dash-btn dash-btn--primary"
                          onClick={() => onManage(g)}
                        >
                          Kezelés
                        </button>
                        <button
                          type="button"
                          className="dash-btn dash-btn--ghost"
                          onClick={onDetach}
                        >
                          Leválasztás
                        </button>
                      </>
                    ) : blockedByFree ? (
                      <button
                        type="button"
                        className="dash-btn dash-btn--disabled"
                        disabled
                      >
                        Free: csak 1 aktív szerver
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="dash-btn dash-btn--primary"
                        onClick={() => onInvite(g)}
                      >
                        Meghívás erre a szerverre
                      </button>
                    )}
                  </div>
                </article>
              );
            })}

            <article className="dash-card dash-card--ghost">
              <div className="dash-card-ghost-title">+ új modul</div>
              <p className="dash-card-ghost-text">
                Később ide jönnek a külön modulok (pl. ticket center, log
                viewer, FiveM modul).
              </p>
            </article>
          </div>
        </>
      )}
    </section>
  );
}

function ComingSoonSection(props: { title: string; description: string }) {
  return (
    <section className="dash-coming">
      <div className="dash-coming-card">
        <h2>{props.title}</h2>
        <p>{props.description}</p>
        <p className="dash-coming-tag">Fejlesztés alatt ⚙️</p>
      </div>
    </section>
  );
}

/* ----- ikonok a menühöz ----- */

function DotsIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="5" cy="12" r="1.8" fill="currentColor" />
      <circle cx="12" cy="12" r="1.8" fill="currentColor" />
      <circle cx="19" cy="12" r="1.8" fill="currentColor" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5zm0-6.5 2 1 2.3-.3.9 2 1.8 1.3-.5 2.2L21 11l1.5 1.8-.5 2.2-1.8 1.3-.9 2-2.3-.3-2 1-2-1-2.3.3-.9-2-1.8-1.3.5-2.2L3 11l1.5-1.8-.5-2.2L5.8 5.7l.9-2L9 4l2-1z"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zm0 2c-3 0-8 1.5-8 4.5V21h16v-2.5C20 15.5 15 14 12 14z"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M16 13v-2H9V8l-5 4 5 4v-3h7zm1-10H7a2 2 0 0 0-2 2v4h2V5h10v14H7v-4H5v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"
      />
    </svg>
  );
}
