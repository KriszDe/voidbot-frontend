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

type TabKey = "overview" | "servers" | "commands" | "tickets" | "logs";

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
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

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
    <main className="dash-root">
      <div className="dash-layout">
        {/* SIDEBAR */}
        <aside className="dash-sidebar">
          <div className="dash-sidebar-header">
            <div className="dash-logo-dot" />
            <div className="dash-logo-text">
              <span className="dash-logo-name">VOIDBOT</span>
              <span className="dash-logo-sub">Control Panel</span>
            </div>
          </div>

          <nav className="dash-nav">
            <SidebarItem
              label="Kezdőlap"
              icon={<HomeIcon />}
              active={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
            />
            <SidebarItem
              label="Szerverek"
              icon={<ServerIcon />}
              active={activeTab === "servers"}
              onClick={() => setActiveTab("servers")}
            />
            <SidebarItem
              label="Commandok"
              icon={<SlashIcon />}
              active={activeTab === "commands"}
              onClick={() => setActiveTab("commands")}
            />
            <SidebarItem
              label="Ticketek"
              icon={<TicketIcon />}
              active={activeTab === "tickets"}
              onClick={() => setActiveTab("tickets")}
            />
            <SidebarItem
              label="Logok"
              icon={<LogIcon />}
              active={activeTab === "logs"}
              onClick={() => setActiveTab("logs")}
            />
          </nav>

          <div className="dash-sidebar-footer">
            <div className="dash-user-mini">
              <img src={avatarUrl} alt="Avatar" className="dash-user-mini-img" />
              <div className="dash-user-mini-text">
                <span className="dash-user-mini-name">{displayName}</span>
                <span className="dash-user-mini-tag">
                  @{user?.username ?? "unknown"}
                </span>
              </div>
              <button
                type="button"
                className="dash-user-mini-logout"
                onClick={handleLogout}
                aria-label="Kijelentkezés"
              >
                <LogoutIcon />
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN AREA */}
        <div className="dash-main">
          {/* TOPBAR */}
          <header className="dash-topbar">
            <div className="dash-topbar-left">
              <h1 className="dash-page-title">
                {activeTab === "overview" && "Áttekintés"}
                {activeTab === "servers" && "Szerverek"}
                {activeTab === "commands" && "Commandok"}
                {activeTab === "tickets" && "Ticketek"}
                {activeTab === "logs" && "Logok"}
              </h1>
              <p className="dash-page-sub">
                Modern, letisztult vezérlőpult a VOIDBOT-hoz.
              </p>
            </div>

            <div className="dash-topbar-right">
              <div
                className={`dash-status-pill dash-status-pill--${backendStatus}`}
              >
                <span className="dash-status-dot" />
                <span>{backendText()}</span>
              </div>

              <div className="dash-user-top">
                <button
                  type="button"
                  className="dash-user-top-btn"
                  onClick={() => setMenuOpen((v) => !v)}
                >
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="dash-user-top-avatar"
                  />
                  <span className="dash-user-top-name">{displayName}</span>
                  <ChevronIcon />
                </button>

                {menuOpen && (
                  <div className="dash-user-dropdown">
                    <button
                      type="button"
                      className="dash-dropdown-item"
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
                      className="dash-dropdown-item"
                      onClick={() => {
                        setMenuOpen(false);
                        window.location.href = "/settings";
                      }}
                    >
                      <GearIcon />
                      Beállítások
                    </button>
                    <div className="dash-dropdown-sep" />
                    <button
                      type="button"
                      className="dash-dropdown-item dash-dropdown-item--danger"
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

          {/* CONTENT */}
          <section className="dash-content">
            {/* OVERVIEW */}
            {activeTab === "overview" && (
              <>
                <div className="dash-stats-row">
                  <StatCard
                    label="Szerverek"
                    value={totalGuilds}
                    hint="Ennyi szerveren van jogosultságod."
                  />
                  <StatCard
                    label="Aktív szerver"
                    value={activeGuild ? activeGuild.name : "Nincs"}
                    hint={
                      activeGuild
                        ? "Jelenleg ezen a szerveren fut a VOIDBOT."
                        : "Válassz ki egy szervert a Szerverek fülön."
                    }
                  />
                  <StatCard
                    label="Backend"
                    value={
                      backendStatus === "loading"
                        ? "Ellenőrzés…"
                        : backendStatus === "ok"
                        ? "Online"
                        : "Hiba"
                    }
                    hint={health?.message ?? "Rendszer státusz"}
                    status={backendStatus}
                  />
                </div>

                <div className="dash-grid-2">
                  <OverviewCard />
                  <HealthCard backendStatus={backendStatus} health={health} />
                </div>
              </>
            )}

            {/* SERVERS */}
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

            {/* OTHER TABS – COMING SOON */}
            {activeTab === "commands" && (
              <ComingSoonSection
                title="Commandok"
                description="Itt fogod tudni modulonként kezelni a slash parancsokat, engedélyeket és preseteket."
              />
            )}

            {activeTab === "tickets" && (
              <ComingSoonSection
                title="Ticketek"
                description="Statok, SLA, átlagos válaszidő és agentek teljesítménye – minden jegyrendszer egy helyen."
              />
            )}

            {activeTab === "logs" && (
              <ComingSoonSection
                title="Logok"
                description="Moderációs logok, join/leave események, parancshívások – részletes szűrőkkel."
              />
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

/* ---------- Layout / kisegítő komponensek ---------- */

function SidebarItem(props: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  const { label, icon, active, onClick } = props;
  return (
    <button
      type="button"
      className={`dash-nav-item ${active ? "dash-nav-item--active" : ""}`}
      onClick={onClick}
    >
      <span className="dash-nav-icon">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function StatCard(props: {
  label: string;
  value: string | number;
  hint?: string;
  status?: BackendStatus;
}) {
  const { label, value, hint, status } = props;
  return (
    <article className="dash-stat-card">
      <div className="dash-stat-label">{label}</div>
      <div className="dash-stat-value-row">
        <span className="dash-stat-value">{value}</span>
        {status && (
          <span className={`dash-stat-pill dash-stat-pill--${status}`}>
            {status === "ok"
              ? "Online"
              : status === "loading"
              ? "Ellenőrzés"
              : "Hiba"}
          </span>
        )}
      </div>
      {hint && <p className="dash-stat-hint">{hint}</p>}
    </article>
  );
}

function OverviewCard() {
  return (
    <article className="dash-panel">
      <h2 className="dash-panel-title">Üdv a VOIDBOT panelen 👋</h2>
      <p className="dash-panel-text">
        Innen menedzseled a botot: szerverek, commandok, ticketek és logok.
        Kezdd a <strong>Szerverek</strong> füllel, válaszd ki, hova szeretnéd
        csatlakoztatni, utána jöhetnek a modulok.
      </p>

      <ul className="dash-changelog">
        <li>
          <span className="dash-chip dash-chip--new">Új</span>
          Új, letisztult dashboard layout, jobb szerverkezelés.
        </li>
        <li>
          <span className="dash-chip dash-chip--new">Új</span>
          Single-server free csomag: 1 aktív szerver, egyszerű váltás.
        </li>
        <li>
          <span className="dash-chip dash-chip--soon">Hamarosan</span>
          Automod presetek, rang menük, FiveM integráció modulonként.
        </li>
      </ul>
    </article>
  );
}

function HealthCard({
  backendStatus,
  health,
}: {
  backendStatus: BackendStatus;
  health: HealthResponse | null;
}) {
  return (
    <article className="dash-panel">
      <h2 className="dash-panel-title">Rendszer állapot</h2>
      <p className="dash-panel-text">
        {backendStatus === "loading"
          ? "Backend ellenőrzése folyamatban…"
          : backendStatus === "error"
          ? "Backend hiba – nézd meg később, vagy írj supportnak."
          : "Minden zöld, a backend online."}
      </p>

      {backendStatus === "ok" && health && (
        <pre className="dash-health-json">
          {JSON.stringify(health, null, 2)}
        </pre>
      )}
    </article>
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
    <section className="dash-servers">
      <div className="dash-servers-header">
        <div>
          <h2 className="dash-panel-title">Szervereid</h2>
          <p className="dash-panel-text dash-panel-text--muted">
            Azok a Discord szerverek, ahol tulaj vagy, vagy rendelkezel{" "}
            <code>Manage Server</code> joggal. Free csomagban 1 aktív szerver
            engedélyezett.
          </p>
        </div>
      </div>

      {guildsStatus === "noToken" && (
        <div className="dash-info-box dash-info-box--warning">
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
            <div className="dash-info-box dash-info-box--note">
              Free csomag: jelenleg egy aktív szerveren fut a VOIDBOT. Másik
              szerver aktiválásához előbb válaszd le az aktuálisat.
            </div>
          )}

          <div className="dash-guild-grid">
            {guilds.map((g) => {
              const iconUrl = g.icon
                ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=128`
                : "https://cdn.discordapp.com/embed/avatars/1.png";

              const isActive = activeGuildId === g.id;
              const blockedByFree =
                !!activeGuildId && activeGuildId !== g.id;

              return (
                <article className="dash-guild-card" key={g.id}>
                  <div className="dash-guild-main">
                    <img
                      src={iconUrl}
                      alt={g.name}
                      className="dash-guild-icon"
                    />
                    <div className="dash-guild-text">
                      <h3 className="dash-guild-name">{g.name}</h3>
                      <p className="dash-guild-meta">
                        {g.owner ? "Tulajdonos" : "Admin / Manage Server jog"}
                      </p>
                      <div className="dash-guild-status">
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

                  <div className="dash-guild-actions">
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
          </div>
        </>
      )}
    </section>
  );
}

function ComingSoonSection(props: { title: string; description: string }) {
  return (
    <section className="dash-coming">
      <article className="dash-panel dash-panel--center">
        <h2 className="dash-panel-title">{props.title}</h2>
        <p className="dash-panel-text dash-panel-text--muted">
          {props.description}
        </p>
        <p className="dash-coming-tag">Fejlesztés alatt ⚙️</p>
      </article>
    </section>
  );
}

/* ----- ikonok ----- */

function HomeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M5 12.5V21h5v-4h4v4h5v-8.5L12 4z"
      />
    </svg>
  );
}

function ServerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M4 5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V5zm3 10a3 3 0 0 0-3 3v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1a3 3 0 0 0-3-3H7zm0-2h10a3 3 0 0 0 3-3V9a3 3 0 0 0-3-3H7A3 3 0 0 0 4 9v1a3 3 0 0 0 3 3z"
      />
    </svg>
  );
}

function SlashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M10 4h4l-4 16H6zm-2 4a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm12 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"
      />
    </svg>
  );
}

function TicketIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M4 6a2 2 0 0 1 2-2h12l2 4-2 4 2 4-2 4H6a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4zm5 1v2h2V7zm0 4v2h2v-2zm0 4v2h2v-2z"
      />
    </svg>
  );
}

function LogIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M6 4h13v2H6v12h11v2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm4 4h7v2h-7zm0 4h5v2h-5z"
      />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M7 10l5 5 5-5z"
      />
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
        d="M16 13v-2H9V8l-5 4 5 4v-3h7zm1-10H7a2 2 0 0 0-2 2v4h2V5h10v14H7v-4H5v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"
      />
    </svg>
  );
}
