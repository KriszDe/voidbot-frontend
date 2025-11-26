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
            `HTTP ${res.status}${text ? " – " + text.slice(0, 60) : ""}`
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
    if (backendStatus === "error") return "Backend hiba 😕";
    return "Backend ok ✅";
  };

  const inviteUrlForGuild = (guildId: string) => {
    const permissions = "268446710"; // finomhangolható
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
        {/* FELSŐ SÁV: bal oldalt logo blokk, jobb oldalt user blokk */}
        <div className="dash-top-row">
          <div className="dash-brand-card">
            <span className="dash-brand-pill">VOIDBOT</span>
            <p className="dash-brand-sub">
              Retro Discord panel • magyar nyelven
            </p>
          </div>

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
                    Tagság: <strong>Ingyenes</strong>
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

            {/* kis fekete négyzet – menü */}
            <div className="dash-menu-wrapper">
              <button
                type="button"
                className="dash-menu-toggle"
                onClick={() => setMenuOpen((v) => !v)}
              />
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
                    Beállítások
                  </button>
                  <button
                    type="button"
                    className="dash-menu-item dash-menu-item--danger"
                    onClick={handleLogout}
                  >
                    Kijelentkezés
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* HOSSZÚ KÉK SÁV – fő navigáció */}
        <nav className="dash-nav-bar">
          <button className="dash-nav-item dash-nav-item--active">
            Kezdőlap
          </button>
          <button className="dash-nav-item">Kezelés</button>
          <button className="dash-nav-item">Commandok</button>
          <button className="dash-nav-item">Ticketek</button>
          <button className="dash-nav-item">Logok</button>
        </nav>

        {/* GRID – szerver kártyák */}
        <section className="dash-grid-section">
          <div className="dash-grid-header">
            <h2>Szervereid</h2>
            <p>
              Azok a Discord szerverek, ahol tulaj vagy, vagy van{" "}
              <code>Manage Server</code> jogod. Free csomagban 1 aktív szerver
              használható.
            </p>
          </div>

          {/* állapot üzenetek */}
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
                  Free csomag: jelenleg <code>{activeGuildId}</code> az aktív
                  szerver.
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
                            {g.owner ? "Tulajdonos" : "Admin / Manage Server"}
                          </p>

                          <div className="dash-card-status">
                            {isActive ? (
                              <span className="dash-pill dash-pill--ok">
                                Bot csatlakoztatva
                              </span>
                            ) : blockedByFree ? (
                              <span className="dash-pill dash-pill--limit">
                                Free csomag: max 1 szerver
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
                              onClick={() => handleManage(g)}
                            >
                              Kezelés
                            </button>
                            <button
                              type="button"
                              className="dash-btn dash-btn--ghost"
                              onClick={() => setActiveGuildId(null)}
                            >
                              Leválasztás
                            </button>
                          </>
                        ) : blockedByFree ? (
                          <button
                            type="button"
                            disabled
                            className="dash-btn dash-btn--disabled"
                          >
                            Free: csak 1 szerver
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="dash-btn dash-btn--primary"
                            onClick={() => handleInvite(g)}
                          >
                            Meghívás erre a szerverre
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}

                {/* plusz kártya – majd ide jöhetnek modulok, extra szerverek */}
                <article className="dash-card dash-card--ghost">
                  <div className="dash-card-ghost-title">+ új modul</div>
                  <p className="dash-card-ghost-text">
                    Később ide jöhetnek külön modulok (pl. FiveM stats, ticket
                    center, log viewer).
                  </p>
                </article>
              </div>
            </>
          )}
        </section>

        {/* backend JSON debug – ha zavar, nyugodtan töröld */}
        {backendStatus === "ok" && health && (
          <section className="dash-health-debug">
            <pre>{JSON.stringify(health, null, 2)}</pre>
          </section>
        )}
      </div>
    </main>
  );
}
