import { useState } from "react";
import "./App.css";

type HealthResponse = {
  ok: boolean;
  ts: number;
  message: string;
};

export default function App() {
  const [healthState, setHealthState] = useState<
    "idle" | "loading" | "ok" | "error"
  >("idle");
  const [health, setHealth] = useState<HealthResponse | null>(null);

  const API_BASE = import.meta.env.VITE_API_URL as string;
  const DISCORD_CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID as string;
  const DISCORD_REDIRECT = import.meta.env.VITE_DISCORD_REDIRECT as string;

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

  const pingBackend = async () => {
    try {
      setHealthState("loading");
      setHealth(null);
      const res = await fetch(`${API_BASE}/api/health`);
      const json = (await res.json()) as HealthResponse;
      setHealth(json);
      setHealthState("ok");
    } catch (e) {
      console.error(e);
      setHealthState("error");
    }
  };

  const renderHealthText = () => {
    if (healthState === "idle") return "Backend status: not checked";
    if (healthState === "loading") return "Checking backend…";
    if (healthState === "error") return "Backend error – check again later.";
    return "Backend online ✅";
  };

  return (
    <div className="bot-page">
      {/* NAVBAR */}
      <header className="bot-navbar">
        <div className="bot-nav-left">
          <div className="bot-logo">
            <span className="bot-logo-mark" />
            <span className="bot-logo-text">VOIDBOT</span>
          </div>
          <nav className="bot-nav-links">
            <a href="#hero">Your Bot</a>
            <a href="#features">Features</a>
            <a href="#stats">Stats</a>
            <a href="#docs">Docs</a>
          </nav>
        </div>
        <div className="bot-nav-right">
          <button
            type="button"
            className="bot-btn bot-btn--ghost"
            onClick={pingBackend}
          >
            Ping backend
          </button>
          <button
            type="button"
            className="bot-btn bot-btn--discord"
            onClick={handleDiscordLogin}
          >
            Login
          </button>
        </div>
      </header>

      {/* HERO */}
      <main>
        <section id="hero" className="bot-hero">
          <div className="bot-hero-content">
            <h1 className="bot-hero-title">
              Time to add <span>[VOIDBOT]</span> to your server.
            </h1>
            <p className="bot-hero-text">
              VOIDBOT egy letisztult, Discord-fókuszú bot panel. Automatizmusok,
              rangkezelés és statisztikák egy helyen – úgy, hogy közben nem néz
              ki úgy, mintha egy AI rakta volna össze.
            </p>

            <div className="bot-hero-actions">
              <button
                type="button"
                className="bot-btn bot-btn--primary"
                onClick={handleDiscordLogin}
              >
                Add to Discord
              </button>
              <button type="button" className="bot-btn bot-btn--outline">
                ⭐ Premium (hamarosan)
              </button>
            </div>

            <p className="bot-hero-note">
              Nem telepít semmit, csak a Discord fiókoddal azonosít. Bármikor
              visszavonhatod.
            </p>
          </div>

          <div className="bot-hero-preview">
            <div className="bot-preview-card">
              <div className="bot-preview-header">
                <span className="bot-preview-name">VOIDBOT</span>
                <span className="bot-preview-tag">#0001</span>
              </div>
              <p className="bot-preview-line">• Auto-moderation</p>
              <p className="bot-preview-line">• Welcome messages</p>
              <p className="bot-preview-line">• Role menus</p>
              <p className="bot-preview-line bot-preview-line--muted">
                + saját, FiveM-es funkciók
              </p>
            </div>
          </div>
        </section>

        {/* HULLÁMOS VÁLASZTÓ */}
        <div className="bot-wave-separator">
          <svg
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
            className="bot-wave-svg"
          >
            <path
              d="M0,64L60,74.7C120,85,240,107,360,117.3C480,128,600,128,720,117.3C840,107,960,85,1080,85.3C1200,85,1320,107,1380,117.3L1440,128L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,60,0L0,0Z"
              fill="#ffffff"
            />
          </svg>
        </div>

        {/* FEATURES */}
        <section id="features" className="bot-features">
          <h2 className="bot-section-title">Features</h2>

          <div className="bot-feature-row">
            <div className="bot-feature-text">
              <h3>Feature #1 – Smart moderation</h3>
              <p>
                Alap szintű anti-spam, link-filter és audit log, hogy a
                moderátorok ne égjenek ki az első héten. Minden a Discord
                permission rendszerre épül.
              </p>
            </div>
            <div className="bot-feature-blob bot-feature-blob--left">
              <span className="bot-blob-label">Moderation</span>
            </div>
          </div>

          <div className="bot-feature-row bot-feature-row--reverse">
            <div className="bot-feature-text">
              <h3>Feature #2 – Role menus & onboarding</h3>
              <p>
                Reagálós rangok, onboarding panelek és infó-csatornák – mindez
                egy webes felületről konfigurálva, a Discord kliens érintése
                nélkül.
              </p>
            </div>
            <div className="bot-feature-blob bot-feature-blob--right">
              <span className="bot-blob-label">Community</span>
            </div>
          </div>

          <div className="bot-feature-row">
            <div className="bot-feature-text">
              <h3>Feature #3 – Server stats & FiveM integráció</h3>
              <p>
                Online játékosok, csatlakozások, parancs-használat – minden egy
                helyen. Később: külön FiveM modul a saját szerveredhez.
              </p>
            </div>
            <div className="bot-feature-blob bot-feature-blob--left bot-feature-blob--soft">
              <span className="bot-blob-label">Stats</span>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section id="stats" className="bot-stats">
          <h2 className="bot-section-title">Stats</h2>
          <div className="bot-stats-grid">
            <div className="bot-stat-card">
              <div className="bot-stat-number">000</div>
              <div className="bot-stat-label">Commands</div>
            </div>
            <div className="bot-stat-card">
              <div className="bot-stat-number">000</div>
              <div className="bot-stat-label">Servers</div>
            </div>
            <div className="bot-stat-card">
              <div className="bot-stat-number">000</div>
              <div className="bot-stat-label">Users</div>
            </div>
            <div className="bot-stat-card bot-stat-card--status">
              <div className="bot-stat-status">{renderHealthText()}</div>
              {healthState === "ok" && health && (
                <div className="bot-stat-meta">
                  ts: {health.ts} • {health.message}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* CTA / DOCS */}
        <section id="docs" className="bot-cta">
          <h2>
            Ready to try <span>[VOIDBOT]</span>?
          </h2>
          <p>
            A projekt még alpha állapotban van, de már most is be lehet kötni
            privát használatra. Ha tetszik az irány, később jöhetnek a komolyabb
            funkciók is.
          </p>
          <button
            type="button"
            className="bot-btn bot-btn--primary"
            onClick={handleDiscordLogin}
          >
            Get Started
          </button>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bot-footer">
        <span>© {new Date().getFullYear()} VOIDBOT. All rights reserved.</span>
        <span className="bot-footer-small">
          Design inspired by classic Discord bot landing pages – egyedi
          megvalósítás.
        </span>
      </footer>
    </div>
  );
}
