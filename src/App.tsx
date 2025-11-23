import { useState } from "react";

type HealthResponse = {
  ok: boolean;
  ts: number;
  message: string;
};

export default function App() {
  const [backendState, setBackendState] = useState<
    "idle" | "loading" | "ok" | "error"
  >("idle");
  const [backendData, setBackendData] = useState<HealthResponse | null>(null);

  const API_BASE = import.meta.env.VITE_API_URL as string;
  const DISCORD_CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID as string;
  const DISCORD_REDIRECT = import.meta.env
    .VITE_DISCORD_REDIRECT as string;

  const pingBackend = async () => {
    try {
      setBackendState("loading");
      setBackendData(null);
      const res = await fetch(`${API_BASE}/api/health`);
      const json = (await res.json()) as HealthResponse;
      setBackendData(json);
      setBackendState("ok");
    } catch (err) {
      console.error(err);
      setBackendState("error");
    }
  };

  const handleDiscordLogin = () => {
    const redirect = encodeURIComponent(DISCORD_REDIRECT);
    const scope = encodeURIComponent("identify guilds");
    const url =
      `https://discord.com/oauth2/authorize` +
      `?client_id=${DISCORD_CLIENT_ID}` +
      `&response_type=code` +
      `&redirect_uri=${redirect}` +
      `&scope=${scope}`;
    window.location.href = url;
  };

  return (
    <main className="vb-root">
      {/* háttér grid + glow */}
      <div className="vb-bg-grid" />
      <div className="vb-bg-glow vb-bg-glow--pink" />
      <div className="vb-bg-glow vb-bg-glow--cyan" />

      {/* NAVBAR */}
      <header className="vb-nav">
        <div className="vb-nav-left">
          <div className="vb-logo-chip">
            <span className="vb-logo-pixel" />
            <span className="vb-logo-text">VOIDBOT</span>
          </div>
          <span className="vb-nav-badge">retro control panel</span>
        </div>
        <div className="vb-nav-right">
          <button
            className="vb-btn vb-btn--ghost"
            type="button"
            onClick={pingBackend}
          >
            Ping backend
          </button>
          <button
            className="vb-btn vb-btn--primary"
            type="button"
            onClick={handleDiscordLogin}
          >
            Belépés Discorddal
          </button>
        </div>
      </header>

      {/* HERO CARD */}
      <section className="vb-hero">
        <div className="vb-hero-left">
          <p className="vb-kicker">discord bot • magyar panel</p>
          <h1 className="vb-title">
            Retro vezérlőpult
            <span className="vb-title-accent"> a VOIDBOT-hoz</span>
          </h1>
          <p className="vb-subtitle">
            Egy hely, ahol a szervered logikáját, rangjait és automatizmusait
            egy retro terminál stílusú felületen tudod finomhangolni.
          </p>

          <div className="vb-actions">
            <button
              className="vb-btn vb-btn--primary vb-btn--lg"
              type="button"
              onClick={handleDiscordLogin}
            >
              <span className="vb-dot-online" />
              Csatlakozom Discorddal
            </button>
            <div className="vb-small-text">
              Nem telepít semmit, csak azonosítja a Discord fiókod.
            </div>
          </div>

          <div className="vb-status-panel">
            <div className="vb-status-header">
              <span className="vb-status-led" />
              <span className="vb-status-title">Rendszer státusz</span>
            </div>
            <div className="vb-status-body">
              {backendState === "idle" && (
                <span className="vb-status-muted">
                  Még nem pingelted a backendet.
                </span>
              )}
              {backendState === "loading" && (
                <span>Kapcsolódás a backendhez…</span>
              )}
              {backendState === "ok" && backendData && (
                <span className="vb-status-ok">
                  Backend online • {backendData.message}
                </span>
              )}
              {backendState === "error" && (
                <span className="vb-status-error">
                  Hiba történt a backend elérésénél.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* JOBB OLDAL – „terminál” preview */}
        <div className="vb-hero-right">
          <div className="vb-terminal">
            <div className="vb-terminal-header">
              <span className="vb-term-dot vb-term-dot--red" />
              <span className="vb-term-dot vb-term-dot--yellow" />
              <span className="vb-term-dot vb-term-dot--green" />
              <span className="vb-term-title">voidbot@panel:~</span>
            </div>
            <div className="vb-terminal-body">
              <div className="vb-line">
                <span className="vb-prompt">$</span>
                <span className="vb-command"> connect discord</span>
              </div>
              <div className="vb-line vb-line--dim">
                ✔ kapcsolat létrehozva a Discord API-val
              </div>
              <div className="vb-line">
                <span className="vb-prompt">$</span>
                <span className="vb-command">
                  {" "}
                  sync guilds --owner=&lt;te&gt;
                </span>
              </div>
              <div className="vb-line vb-line--dim">
                • szerverek betöltése… &nbsp;
                <span className="vb-blink">▌</span>
              </div>
              <div className="vb-line vb-line--hint">
                Tipp: belépés után itt fogod látni a saját szerveredet.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="vb-footer">
        <span>© {new Date().getFullYear()} VOIDBOT • retro discord bot panel</span>
        <span className="vb-footer-muted">
          alpha build • csak saját használatra
        </span>
      </footer>
    </main>
  );
}
