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
  email?: string;
};

export default function Home() {
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [user, setUser] = useState<DiscordUser | null>(null);

  // Backend health check
  useEffect(() => {
    const run = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_URL;
        const res = await fetch(`${API_BASE}/api/health`);
        const json = (await res.json()) as HealthResponse;
        setHealth(json);
        setStatus("ok");
      } catch (e) {
        console.error(e);
        setStatus("error");
      }
    };
    run();
  }, []);

  // User betöltése localStorage-ből
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

  const renderBackendText = () => {
    if (status === "loading") return "Ellenőrzés a backenddel…";
    if (status === "error") return "Hoppá, valami gond van a backenddel 😕";
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
    window.location.href = "/";
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0b0d10",
        color: "white",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "2rem",
        alignItems: "center",
        gap: "1.5rem",
      }}
    >
      <h1 style={{ fontSize: "2rem" }}>VOIDBOT – Home</h1>

      {/* Backend státusz */}
      <div
        style={{
          padding: "0.7rem 1.3rem",
          borderRadius: "999px",
          background: status === "ok" ? "#0f3d1e" : "#3d1010",
          fontSize: "0.95rem",
        }}
      >
        {renderBackendText()}
      </div>

      {/* Discord user kártya */}
      <div
        style={{
          marginTop: "1rem",
          padding: "1.5rem",
          borderRadius: "16px",
          background: "#111",
          maxWidth: "420px",
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        {user ? (
          <>
            <img
              src={avatarUrl}
              alt="Discord avatar"
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "999px",
                border: "2px solid #2ecc71",
                objectFit: "cover",
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  marginBottom: "0.2rem",
                }}
              >
                {displayName}
              </div>
              <div
                style={{
                  fontSize: "0.9rem",
                  color: "#aaa",
                  marginBottom: "0.2rem",
                }}
              >
                @{user.username}
              </div>
              {user.email && (
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "#888",
                    marginBottom: "0.3rem",
                  }}
                >
                  {user.email}
                </div>
              )}
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "#6bffb0",
                }}
              >
                Discord bejelentkezés aktív ✅
              </div>
            </div>

            <button
              onClick={handleLogout}
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: "8px",
                border: "none",
                background: "#333",
                color: "#fff",
                fontSize: "0.8rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Kijelentkezés
            </button>
          </>
        ) : (
          <div style={{ fontSize: "0.95rem" }}>
            Nem találtam bejelentkezett felhasználót. 💤 <br />
            Lépj be újra a főoldalról a Discord gombbal.
          </div>
        )}
      </div>

      {/* Debug: health JSON (ha kell) */}
      {status === "ok" && health && (
        <pre
          style={{
            marginTop: "1rem",
            padding: "1rem",
            background: "#111",
            borderRadius: "8px",
            maxWidth: "500px",
            width: "100%",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontSize: "0.8rem",
            opacity: 0.7,
          }}
        >
{JSON.stringify(health, null, 2)}
        </pre>
      )}
    </main>
  );
}
