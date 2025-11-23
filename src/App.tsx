import { useState } from "react";

type HealthResponse = {
  ok: boolean;
  ts: number;
  message: string;
};

export default function App() {
  const API_BASE = import.meta.env.VITE_API_URL as string;
  const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID as string;
  const redirect = import.meta.env.VITE_DISCORD_REDIRECT as string;

  const [pingLoading, setPingLoading] = useState(false);
  const [pingData, setPingData] = useState<HealthResponse | null>(null);
  const [pingError, setPingError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const handlePingBackend = async () => {
    try {
      setPingLoading(true);
      setPingError(null);
      setPingData(null);

      const res = await fetch(`${API_BASE}/api/health`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as HealthResponse;
      setPingData(data);
    } catch (err: any) {
      setPingError(err?.message || "Load failed");
    } finally {
      setPingLoading(false);
    }
  };

  const handleDiscordLogin = () => {
    setLoginLoading(true);

    const scope = encodeURIComponent("identify guilds");
    const state = crypto.randomUUID();
    sessionStorage.setItem("oauth_state", state);

    const url =
      `https://discord.com/oauth2/authorize?client_id=${clientId}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(redirect)}` +
      `&scope=${scope}` +
      `&state=${encodeURIComponent(state)}` +
      `&prompt=consent`;

    window.location.href = url;
  };

  return (
    <div className="bot-page">
      {/* NAVBAR */}
      <header className="bot-navbar">
        <div className="bot-nav-left">
          <div className="bot-logo">
            <div className="bot-logo-mark" />
            <span className="bot-logo-text">VOIDBOT</span>
          </div>
          <nav className="bot-nav-links">
            <a href="#overview">Your Bot</a>
            <a href="#features">Features</a>
            <a href="#status">Status</a>
            <a href="#docs">Docs</a>
          </nav>
        </div>

        <div className="bot-nav-right">
          <button
            onClick={handlePingBackend}
            className="bot-btn bot-btn--ghost"
            type="button"
          >
            {pingLoading ? "Pinging…" : "Ping backend"}
          </button>
          <button
            onClick={handleDiscordLogin}
            className="bot-btn bot-btn--primary"
            type="button"
          >
            {loginLoading ? "Connecting…" : "Login"}
          </button>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="bot-hero" id="overview">
          <div>
            <h1 className="bot-hero-title">
              Time to add <span>[VOIDBOT]</span> to your server.
            </h1>
            <p className="bot-hero-text">
              VOIDBOT egy letisztult, Discord-fókuszú bot panel. Automatizmusok,
              rangkezelés és statisztikák egy helyen — úgy, hogy közben nem néz
              ki úgy, mintha egy AI rakta volna össze.
            </p>

            <div className="bot-hero-actions">
              <button
                type="button"
                className="bot-btn bot-btn--discord"
                onClick={handleDiscordLogin}
              >
                Add to Discord
              </button>
              <button
                type="button"
                className="bot-btn bot-btn--outline"
                onClick={() =>
                  document
                    .getElementById("features")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Premium (hamarosan)
              </button>
            </div>

            <p className="bot-hero-note">
              Nem telepít semmit, csak a Discord fiókoddal azonosít. Bármikor
              visszavonhatod.
            </p>
          </div>

          {/* jobb oldali preview kártya */}
          <aside className="bot-hero-preview">
            <div className="bot-preview-card">
              <div className="bot-preview-header">
                <span>VOIDBOT</span>
                <span className="bot-preview-line--muted">#0001</span>
              </div>
              <ul className="bot-preview-list">
                <li>Auto-moderation</li>
                <li>Welcome messages</li>
                <li>Role menus</li>
                <li>+ saját, FiveM-es funkciók</li>
              </ul>
            </div>
          </aside>
        </section>

        {/* HULLÁM ELVÁLASZTÓ */}
        <div className="bot-wave-separator">
          <svg
            className="bot-wave-svg"
            viewBox="0 0 1440 80"
            preserveAspectRatio="none"
          >
            <path
              fill="#ffffff"
              d="M0,64L80,58.7C160,53,320,43,480,42.7C640,43,800,53,960,58.7C1120,64,1280,64,1360,64L1440,64L1440,80L1360,80C1280,80,1120,80,960,80C800,80,640,80,480,80C320,80,160,80,80,80L0,80Z"
            />
          </svg>
        </div>

        {/* ÚJ ALSÓ RÉSZ */}
        <section className="bot-main" id="features">
          {/* 3 fő blokk – kártyák */}
          <div className="bot-main-intro">
            <h2>Mit tud a VOIDBOT?</h2>
            <p>
              Nem 200 random slash parancs, hanem néhány okosan összerakott
              modul. Mindegyik arra van, hogy kevesebb idő menjen el a
              szerverkezelésre.
            </p>
          </div>

          <div className="bot-main-grid">
            <article className="bot-main-card">
              <h3>Smart moderation</h3>
              <p>
                Anti-spam, link-filter, softban, audit log — mindezt úgy
                konfigurálod, mintha egy kis admin panelben kattintgatnál, nem
                parancsokkal szenvednél.
              </p>
              <span className="bot-pill">Moderation</span>
            </article>

            <article className="bot-main-card">
              <h3>Role menus & onboarding</h3>
              <p>
                Reagálós rangok, onboarding panelek és infó-csatornák —
                mindez egy webes felületről állítható, a Discord kliens
                érintése nélkül.
              </p>
              <span className="bot-pill bot-pill--blue">Utility</span>
            </article>

            <article className="bot-main-card">
              <h3>Server stats & FiveM integráció</h3>
              <p>
                Online játékosok, csatlakozások, parancs-használat. Később:
                külön FiveM modul a saját szerveredhez.
              </p>
              <span className="bot-pill bot-pill--green">FiveM module</span>
            </article>
          </div>

          {/* „Console” / Preview rész */}
          <div className="bot-console-wrapper" id="docs">
            <div className="bot-console-header">
              <span>voidbot@panel</span>
              <span className="bot-console-status">connected ▴</span>
            </div>
            <div className="bot-console-body">
              <pre>
{`$ connect discord
✔ kapcsolat létrehozva a Discord API-val

$ sync guilds --owner=true
✔ szerverek betöltve…

$ setup wizard
› válaszd ki, mit automatizálunk először`}
              </pre>
            </div>
          </div>

          {/* két oszlop – tulaj vs staff */}
          <div className="bot-two-cols">
            <div className="bot-two-col-card">
              <h3>Szervertulajoknak</h3>
              <ul>
                <li>Jogosítványok, rangok, logok egy helyen</li>
                <li>Nincs külön panel / külön bot messze egymástól</li>
                <li>„Set & forget” automatizmusok</li>
              </ul>
            </div>
            <div className="bot-two-col-card">
              <h3>Moderátoroknak</h3>
              <ul>
                <li>Átlátható log, ki kit tiltott / némított</li>
                <li>Template üzenetek, gyors akciók</li>
                <li>Nem kell parancsokat fejből tudni</li>
              </ul>
            </div>
          </div>
        </section>

        {/* PING / STATUS KÁRTYA */}
        <section className="bot-status" id="status">
          <div className="bot-status-card">
            <div className="bot-status-header">
              <h2>Backend állapot</h2>
              <button
                type="button"
                className="bot-btn bot-btn--ghost"
                onClick={handlePingBackend}
              >
                {pingLoading ? "Pinging…" : "Ping backend"}
              </button>
            </div>

            <div className="bot-status-body">
              {pingLoading && <p>Kapcsolódás a backendhez…</p>}
              {!pingLoading && pingError && (
                <p className="bot-status-error">Hiba: {pingError}</p>
              )}
              {!pingLoading && !pingError && pingData && (
                <pre className="bot-status-json">
{JSON.stringify(pingData, null, 2)}
                </pre>
              )}
              {!pingLoading && !pingError && !pingData && (
                <p className="bot-status-muted">
                  Még nem pingelted a backend-et. Kattints a gombra fent.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bot-cta">
          <h2>
            Készen állsz kipróbálni a <span>VOIDBOT-ot</span>?
          </h2>
          <p>
            Ez még egy alfa build, csak saját használatra. Pont ezért:
            minimalista, letisztult, és csak az van benne, ami kell.
          </p>
          <button
            type="button"
            className="bot-btn bot-btn--primary"
            onClick={handleDiscordLogin}
          >
            Login Discorddal
          </button>
        </section>
      </main>

      <footer className="bot-footer">
        <span>© {new Date().getFullYear()} VOIDBOT • retro discord bot panel</span>
        <span>Made for personal use · HU</span>
      </footer>
    </div>
  );
}
