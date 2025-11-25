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

  const [activeGuildId, setActiveGuildId] = useState<string | null>(() => {
    return localStorage.getItem("voidbot_active_guild");
  });

  // --- Backend health ---
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

  // --- User from localStorage ---
  useEffect(() => {
    try {
      const raw = localStorage.getItem("fivemhub_user");
      if (!raw) return;
      const parsed = JSON.parse(raw) as DiscordUser;
      setUser(parsed);
    } catch (e) {
      console.error("Nem sikerült beolvasni a fivemhub_user-t:", e);
    }
  }, []);

  // --- Guilds betöltése backendről ---
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
            `Guilds error: HTTP ${res.status}${
              text ? ` – ${text.slice(0, 80)}` : ""
            }`
          );
        }

        const data = (await res.json()) as DiscordGuild[];

        // csak olyan szerverek, ahol tulaj vagy manage_guild jog
        const MANAGE_GUILD = 0x20;
        const filtered = data.filter(
          (g) => g.owner || (g.permissions & MANAGE_GUILD) === MANAGE_GUILD
        );

        setGuilds(filtered);
        setGuildsStatus("ok");
      } catch (e: any) {
        console.error(e);
        setGuildError(e?.message || "Nem sikerült betölteni a szervereket");
        setGuildsStatus("error");
      }
    };

    run();
  }, [API_BASE]);

  // --- activeGuildId mentése ---
  useEffect(() => {
    if (activeGuildId) {
      localStorage.setItem("voidbot_active_guild", activeGuildId);
    } else {
      localStorage.removeItem("voidbot_active_guild");
    }
  }, [activeGuildId]);

  const backendText = () => {
    if (backendStatus === "loading") return "Ellenőrzés a backenddel…";
    if (backendStatus === "error")
      return "Hoppá, valami gond van a backenddel 😕";
    return "Backend tökéletesen működik ✅";
  };

  const displayName =
    user?.global_name || user?.username || "Ismeretlen felhasználó";

  const avatarUrl = user?.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
    : "https://cdn.discordapp.com/embed/avatars/0.png";

  const handleLogout = () => {
    localStorage.removeItem("fivemhub_user");
    localStorage.removeItem("fivemhub_token");
    localStorage.removeItem("voidbot_active_guild");
    window.location.href = "/";
  };

  const inviteUrlForGuild = (guildId: string) => {
    // bot + applications.commands scope, fix permissions – később finomhangolhatod
    const permissions = "268446710";
    const base = "https://discord.com/oauth2/authorize";
    const params = new URLSearchParams({
      client_id: clientId,
      scope: "bot applications.commands",
      permissions,
      guild_id: guildId,
      disable_guild_select: "true",
      response_type: "code", // opcionális, de nem árt
    });
    return `${base}?${params.toString()}`;
  };

  const handleInvite = (guild: DiscordGuild) => {
    const url = inviteUrlForGuild(guild.id);
    window.open(url, "_blank");
    // free tier: optimista beállítás – 1 aktív szerver
    setActiveGuildId(guild.id);
  };

  const handleManage = (guild: DiscordGuild) => {
    // később lesz rendes /server/:id oldal
    window.location.href = `/server/${guild.id}`;
  };

  return (
    <main className="home-root">
      <div className="home-shell">
        {/* FEJLÉC */}
        <header className="home-header">
          <div>
            <p className="home-kicker">VOIDBOT DASHBOARD</p>
            <h1>Üdv újra, {displayName}.</h1>
            <p className="home-sub">
              Itt tudod ránézni a backend állapotára, és kiválasztani, melyik
              szerverre legyen „ráakasztva” a VOIDBOT. Free csomagban 1 aktív
              szervered lehet.
            </p>
          </div>
          <div
            className={`home-backend-pill home-backend-pill--${
              backendStatus === "ok"
                ? "ok"
                : backendStatus === "error"
                ? "error"
                : "loading"
            }`}
          >
            {backendText()}
          </div>
        </header>

        {/* FELHASZNÁLÓ KÁRTYA */}
        <section className="home-user-card">
          {user ? (
            <>
              <img src={avatarUrl} alt="Discord avatar" className="home-avatar" />
              <div className="home-user-text">
                <div className="home-user-name">{displayName}</div>
                <div className="home-user-handle">@{user.username}</div>
                <div className="home-user-meta">
                  Discord bejelentkezés aktív ✅
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="home-logout-btn"
              >
                Kijelentkezés
              </button>
            </>
          ) : (
            <div className="home-user-missing">
              Nem találtam bejelentkezett felhasználót. Lépj be a főoldalról a
              Discord gombbal.
            </div>
          )}
        </section>

        {/* SZERVEREK BLOKK */}
        <section className="home-servers">
          <div className="home-servers-header">
            <div>
              <h2>Szervereid</h2>
              <p>
                Olyan szerverek listája, ahol tulaj vagy, vagy van{" "}
                <code>Manage Server</code> jogod. Free csomagban 1 szerverhez
                kapcsolhatod a VOIDBOT-ot.
              </p>
            </div>
          </div>

          {/* állapot üzenetek */}
          {guildsStatus === "noToken" && (
            <div className="home-servers-info">
              Nem találtam érvényes Discord tokent. Lépj be újra a főoldalról.
            </div>
          )}

          {guildsStatus === "loading" && (
            <div className="home-servers-info">Szerverek betöltése…</div>
          )}

          {guildsStatus === "error" && (
            <div className="home-servers-info home-servers-info--error">
              Nem sikerült betölteni a szervereket.
              <br />
              <span className="home-servers-info-small">{guildError}</span>
            </div>
          )}

          {guildsStatus === "ok" && guilds.length === 0 && (
            <div className="home-servers-info">
              Nem találtunk olyan szervert, ahol tulaj vagy vagy manage jogod
              lenne.
            </div>
          )}

          {guildsStatus === "ok" && guilds.length > 0 && (
            <>
              {activeGuildId && (
                <div className="home-free-note">
                  Free csomag: <strong>1 aktív szerver</strong>. Jelenleg:{" "}
                  <code>{activeGuildId}</code>
                </div>
              )}

              <div className="home-guild-grid">
                {guilds.map((g) => {
                  const iconUrl = g.icon
                    ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=128`
                    : "https://cdn.discordapp.com/embed/avatars/1.png";

                  const isActive = activeGuildId === g.id;
                  const hasActiveOther =
                    !!activeGuildId && activeGuildId !== g.id;

                  return (
                    <article className="home-guild-card" key={g.id}>
                      <div className="home-guild-main">
                        <img
                          src={iconUrl}
                          alt={g.name}
                          className="home-guild-icon"
                        />
                        <div className="home-guild-text">
                          <div className="home-guild-name">{g.name}</div>
                          <div className="home-guild-meta">
                            {g.owner ? "Tulajdonos" : "Admin / Manage Server"}
                          </div>
                          {isActive ? (
                            <div className="home-guild-status home-guild-status--ok">
                              Bot csatlakoztatva
                            </div>
                          ) : hasActiveOther ? (
                            <div className="home-guild-status home-guild-status--limit">
                              Free csomagban 1 aktív szerver.
                            </div>
                          ) : (
                            <div className="home-guild-status">
                              Bot még nincs meghívva.
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="home-guild-actions">
                        {isActive ? (
                          <>
                            <button
                              type="button"
                              className="home-guild-btn home-guild-btn--primary"
                              onClick={() => handleManage(g)}
                            >
                              Kezelés
                            </button>
                            <button
                              type="button"
                              className="home-guild-btn home-guild-btn--ghost"
                              onClick={() => setActiveGuildId(null)}
                            >
                              Leválasztás
                            </button>
                          </>
                        ) : hasActiveOther ? (
                          <button
                            type="button"
                            disabled
                            className="home-guild-btn home-guild-btn--disabled"
                          >
                            Free: max 1 szerver
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="home-guild-btn home-guild-btn--primary"
                            onClick={() => handleInvite(g)}
                          >
                            Meghívás erre a szerverree
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

        {/* Debug: health JSON – ha nem kell, nyugodtan töröld */}
        {backendStatus === "ok" && health && (
          <section className="home-health-debug">
            <pre>{JSON.stringify(health, null, 2)}</pre>
          </section>
        )}
      </div>
    </main>
  );
}
