// src/pages/Home.tsx
import { FormEvent, useEffect, useMemo, useState } from "react";

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
type TabKey = "overview" | "servers" | "manage" | "commands" | "tickets" | "logs";

type LinkedGuildMeta = {
  attachedAt: number;
};

type LogsStatus = "idle" | "loading" | "ok" | "error";

type BotLogEntry = {
  id: string;
  ts: number;
  userTag: string;
  commandName: string;
  guildName?: string | null;
};

// Alap backend (health, guilds, stb.)
const API_BASE = import.meta.env.VITE_API_URL as string;

// Bot API – ha nincs külön env, fallback az API_BASE-re
const BOT_API_BASE =
  (import.meta.env.VITE_BOT_API_URL as string | undefined) || API_BASE;

const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID as string;

export default function Home() {
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

  const [linkedGuilds, setLinkedGuilds] = useState<
    Record<string, LinkedGuildMeta>
  >(() => {
    try {
      const raw = localStorage.getItem("voidbot_linked_guilds");
      return raw ? (JSON.parse(raw) as Record<string, LinkedGuildMeta>) : {};
    } catch {
      return {};
    }
  });

  const [logs, setLogs] = useState<BotLogEntry[]>([]);
  const [logsStatus, setLogsStatus] = useState<LogsStatus>("idle");

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
  }, []);

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
  }, []);

  // ---- active guild mentése ----
  useEffect(() => {
    if (activeGuildId) {
      localStorage.setItem("voidbot_active_guild", activeGuildId);
    } else {
      localStorage.removeItem("voidbot_active_guild");
    }
  }, [activeGuildId]);

  // ---- linked guild meta mentése ----
  useEffect(() => {
    try {
      localStorage.setItem(
        "voidbot_linked_guilds",
        JSON.stringify(linkedGuilds)
      );
    } catch (e) {
      console.error("Nem sikerült menteni a linkedGuilds-et:", e);
    }
  }, [linkedGuilds]);

  // ---- logok betöltése, amikor a Logok fül aktív ----
  useEffect(() => {
    if (activeTab !== "logs") return;

    let aborted = false;

    const run = async () => {
      try {
        setLogsStatus("loading");
        const res = await fetch(`${BOT_API_BASE}/api/logs`);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (aborted) return;

        setLogsStatus("ok");
        setLogs((data.logs as BotLogEntry[]) || []);
      } catch (e) {
        console.error(e);
        if (!aborted) setLogsStatus("error");
      }
    };

    run();

    return () => {
      aborted = true;
    };
  }, [activeTab]);

  const avatarUrl = user?.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
    : "https://cdn.discordapp.com/embed/avatars/0.png";

  const displayName =
    user?.global_name || user?.username || "Ismeretlen felhasználó";

  const handleLogout = () => {
    localStorage.removeItem("fivemhub_user");
    localStorage.removeItem("fivemhub_token");
    localStorage.removeItem("voidbot_active_guild");
    localStorage.removeItem("voidbot_linked_guilds");
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
    setLinkedGuilds((prev) => ({
      ...prev,
      [g.id]: {
        attachedAt: Date.now(),
      },
    }));
    setActiveTab("manage");
  };

  const handleManage = (g: DiscordGuild) => {
    setActiveGuildId(g.id);
    setActiveTab("manage");
  };

  const handleDetach = () => {
    setActiveGuildId(null);
  };

  const hasOtherActive =
    !!activeGuildId &&
    guilds.some((g) => g.id === activeGuildId) &&
    guilds.length > 0;

  const activeGuild = useMemo(
    () => guilds.find((g) => g.id === activeGuildId) || null,
    [guilds, activeGuildId]
  );

  const activeGuildMeta: LinkedGuildMeta | null = activeGuildId
    ? linkedGuilds[activeGuildId] ?? null
    : null;

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
                <button
                  type="button"
                  className="home-btn home-btn-primary"
                  onClick={() => setActiveTab("servers")}
                >
                  Ugrás a szerverekhez
                </button>
                <button
                  type="button"
                  className="home-btn home-btn-secondary"
                  onClick={() => setActiveTab("overview")}
                >
                  Kezdőlap / hírek
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
                  <span>
                    {activeGuild ? activeGuild.name : "Nincs kiválasztva"}
                  </span>
                </li>
              </ul>
            </aside>
          </div>
        </div>
      </section>

      {/* ALSÓ RÉSZ – NAVBAR + TARTALOM */}
      <div className="home-main-shell">
        {/* NAVBAR – TABOK */}
        <nav className="home-tabs">
          <TabButton
            label="Kezdőlap"
            active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
          />
          <TabButton
            label="Szerverek"
            active={activeTab === "servers"}
            onClick={() => setActiveTab("servers")}
          />
          <TabButton
            label="Kezelés"
            active={activeTab === "manage"}
            onClick={() => setActiveTab("manage")}
          />
          <TabButton
            label="Commandok"
            active={activeTab === "commands"}
            onClick={() => setActiveTab("commands")}
          />
          <TabButton
            label="Ticketek"
            active={activeTab === "tickets"}
            onClick={() => setActiveTab("tickets")}
          />
          <TabButton
            label="Logok"
            active={activeTab === "logs"}
            onClick={() => setActiveTab("logs")}
          />
        </nav>

        {/* KEZDŐLAP */}
        {activeTab === "overview" && (
          <>
            <section className="home-section-row">
              <article className="home-card">
                <h2 className="home-card-title">Mit látsz itt?</h2>
                <p className="home-card-text">
                  Ez a VOIDBOT vezérlőpult. Innen tudod:
                </p>
                <ul className="home-list">
                  <li>Szerverekhez kapcsolni / leválasztani a botot.</li>
                  <li>Átlátni a rendszer állapotát és a frissítéseket.</li>
                  <li>
                    Később: modulonként konfigurálni az automodot, rang menüket,
                    FiveM integrációt.
                  </li>
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

            {/* „Mit tud a VOIDBOT?” */}
            <section id="modules" className="home-section">
              <h2 className="home-section-title">Mit tud a VOIDBOT?</h2>
              <p className="home-section-sub">
                Nem 200 random slash parancs, hanem néhány okosan összerakott
                modul.
              </p>

              <div className="home-feature-grid">
                <article className="home-feature-card">
                  <h3>Smart moderation</h3>
                  <p>
                    Anti-spam, link-filter, softban, audit log – mindegyik
                    konfigurálható, mintha egy kis admin panelen kattintgatnál,
                    nem parancsokkal szenvednél.
                  </p>
                  <span className="home-tag">Moderation</span>
                </article>

                <article className="home-feature-card">
                  <h3>Role menus &amp; onboarding</h3>
                  <p>
                    Reagálós rangok, onboarding panelek és info-csatornák –
                    mindez egy webes felületről állítható, a Discord kliense
                    érintése nélkül.
                  </p>
                  <span className="home-tag">Utility</span>
                </article>

                <article className="home-feature-card">
                  <h3>Server stats &amp; FiveM integráció</h3>
                  <p>
                    Online játékosok, csatlakozások, parancs-használat. Később
                    külön FiveM modul a saját szerveredhez.
                  </p>
                  <span className="home-tag home-tag--accent">
                    FiveM module
                  </span>
                </article>
              </div>
            </section>
          </>
        )}

        {/* SZERVEREK */}
        {activeTab === "servers" && (
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
                    Free csomag: jelenleg egy aktív szerveren fut a VOIDBOT.
                    Másik szerver aktiválásához előbb válaszd le az aktuálisat.
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
                                onClick={handleDetach}
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
                              onClick={() => handleInvite(g)}
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
        )}

        {/* KEZELÉS – aktív szerver info, meta localStorage-ből */}
        {activeTab === "manage" && (
          <section className="home-section">
            {!activeGuild || !activeGuildId ? (
              <article className="home-card home-card--center">
                <h2 className="home-card-title">Nincs aktív szerver</h2>
                <p className="home-card-text">
                  Válassz egy szervert a <strong>Szerverek</strong> fülön, és
                  hívd meg oda a VOIDBOT-ot. Ezután itt fogsz mindent kezelni.
                </p>
              </article>
            ) : (
              <div className="home-section-row">
                <article className="home-card">
                  <h2 className="home-card-title">Aktív szerver</h2>
                  <p className="home-card-text">
                    Itt látod az alap információkat az aktuális szerveredről.
                  </p>
                  <ul className="home-list">
                    <li>
                      <strong>Név:</strong> {activeGuild.name}
                    </li>
                    <li>
                      <strong>Jogosultságod:</strong>{" "}
                      {activeGuild.owner
                        ? "Tulajdonos"
                        : "Admin / Manage Server jog"}
                    </li>
                    <li>
                      <strong>Bot állapot:</strong>{" "}
                      <span>Csatlakoztatva (teszt)</span>
                    </li>
                    {activeGuildMeta && (
                      <li>
                        <strong>Hozzáadva (localStorage):</strong>{" "}
                        {new Date(activeGuildMeta.attachedAt).toLocaleString(
                          "hu-HU"
                        )}
                      </li>
                    )}
                  </ul>
                </article>

                <article className="home-card">
                  <h2 className="home-card-title">Szerver / bot beállítások</h2>
                  <p className="home-card-text">
                    Később ide jön minden modul: automod, rang menük, FiveM
                    integráció stb. Most csak teszt metaadatot mutatunk.
                  </p>
                  <p className="home-card-text">
                    A kiválasztott szerver ID-je:
                    <br />
                    <code>{activeGuild.id}</code>
                  </p>
                </article>
              </div>
            )}
          </section>
        )}

        {/* COMMANDOK */}
        {activeTab === "commands" && (
          <CommandCreator activeGuild={activeGuild} />
        )}

        {activeTab === "tickets" && (
          <ComingSoonSection
            title="Ticketek"
            description="Ticket rendszer statisztikák, SLA, átlagos válaszidő és agent teljesítmény – minden egy helyen."
          />
        )}

        {activeTab === "logs" && (
          <LogsSection logs={logs} status={logsStatus} />
        )}
      </div>
    </main>
  );
}

/* ------ kis helper komponensek ------ */

function TabButton(props: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  const { label, active, onClick } = props;
  return (
    <button
      type="button"
      className={`home-tab ${active ? "home-tab--active" : ""}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function CommandCreator({
  activeGuild,
}: {
  activeGuild: DiscordGuild | null;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setErr(null);

    if (!activeGuild) {
      setErr(
        "Először válassz egy aktív szervert a Szerverek fülön (ahol a bot is bent van)."
      );
      return;
    }

    if (!name || !description || !reply) {
      setErr("Név, leírás és válasz szöveg kötelező.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${BOT_API_BASE}/api/commands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          reply,
          guildId: activeGuild.id,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Ismeretlen hiba");
      }

      setMsg(`Command létrehozva: /${json.name}`);
      setName("");
      setDescription("");
      setReply("");
    } catch (error: any) {
      console.error(error);
      setErr(error?.message || "Nem sikerült létrehozni a commandot.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="home-section">
      <article className="home-card">
        <h2 className="home-card-title">Commandok</h2>
        {!activeGuild ? (
          <p className="home-card-text">
            Először válassz egy aktív szervert a <strong>Szerverek</strong>{" "}
            fülön, és hívd meg oda a botot. Ezután itt tudsz slash commandokat
            létrehozni.
          </p>
        ) : (
          <p className="home-card-text">
            Új slash command létrehozása ehhez a szerverhez:{" "}
            <strong>{activeGuild.name}</strong>.
          </p>
        )}

        <form onSubmit={handleSubmit} className="home-command-form">
          <div className="home-command-row">
            <div className="home-command-field">
              <label>Command név</label>
              <input
                type="text"
                placeholder="pl. giveway"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
              <small>Csak kisbetű, szám, -, _ ; max 32 karakter.</small>
            </div>

            <div className="home-command-field">
              <label>Leírás</label>
              <input
                type="text"
                placeholder="pl. Nyereményjátékhoz csatlakozás."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="home-command-field">
            <label>Válasz, amit a bot írjon</label>
            <input
              type="text"
              placeholder="pl. 🎉 Sikeresen csatlakoztál a nyereményjátékhoz!"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="home-btn-inline home-btn-inline--primary"
            disabled={loading || !activeGuild}
          >
            {loading ? "Létrehozás..." : "Command létrehozása"}
          </button>
        </form>

        {err && <div className="home-info home-info--error">{err}</div>}
        {msg && <div className="home-info home-info--note">{msg}</div>}

        <p className="home-coming-tag">
          Teszt fázis: ha sikeres, a command azonnal használható lesz a Discord
          szerveren.
        </p>
      </article>
    </section>
  );
}

function LogsSection({
  logs,
  status,
}: {
  logs: BotLogEntry[];
  status: LogsStatus;
}) {
  return (
    <section className="home-section">
      <article className="home-card">
        <h2 className="home-card-title">Logok</h2>
        <p className="home-card-text">
          Slash parancs használatok logja (teszt fázis) – ki, mikor, milyen
          parancsot futtatott.
        </p>

        <div className="home-log-terminal">
          <div className="home-log-header">
            <span className="home-log-title">voidbot@panel</span>
            <span className="home-log-status">
              <span className="home-log-status-dot" />
              connected
            </span>
          </div>

          <div className="home-log-body">
            {(status === "idle" || status === "loading") && (
              <div className="home-log-line">$ logok betöltése…</div>
            )}

            {status === "error" && (
              <div className="home-log-line home-log-line--error">
                $ hiba: nem sikerült betölteni a logokat.
              </div>
            )}

            {status === "ok" && logs.length === 0 && (
              <>
                <div className="home-log-line">$ connect discord</div>
                <div className="home-log-line">
                  ✔ még nincs logbejegyzés – futtasd a /ping vagy /web
                  parancsot.
                </div>
              </>
            )}

            {status === "ok" &&
              logs.map((log) => (
                <div className="home-log-line" key={log.id}>
                  <span className="home-log-prompt">$</span>{" "}
                  <span>
                    {new Date(log.ts).toLocaleTimeString("hu-HU", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    – <strong>{log.userTag}</strong> futtatta: /
                    {log.commandName}
                    {log.guildName ? ` @ ${log.guildName}` : ""}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </article>
    </section>
  );
}

function ComingSoonSection(props: { title: string; description: string }) {
  return (
    <section className="home-section">
      <article className="home-card home-card--center">
        <h2 className="home-card-title">{props.title}</h2>
        <p className="home-card-text">{props.description}</p>
        <p className="home-coming-tag">Fejlesztés alatt ⚙️</p>
      </article>
    </section>
  );
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
