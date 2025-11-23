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
          padding: "1.5rem 1.8rem",
          borderRadius: "20px",
          background: "#111",
          maxWidth: "460px",
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: "1.3rem",
          boxShadow: "0 18px 45px rgba(0,0,0,0.55)",
        }}
      >
        {user ? (
          <>
            <img
              src={avatarUrl}
              alt="Discord avatar"
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "999px",
                border: "3px solid #2ecc71",
                objectFit: "cover",
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "1.3rem",
                  fontWeight: 700,
                  marginBottom: "0.2rem",
                }}
              >
                {displayName}
              </div>
              <div
                style={{
                  fontSize: "0.95rem",
                  color: "#aaa",
                }}
              >
                @{user.username}
              </div>
            </div>

            <button
              onClick={handleLogout}
              style={{
                padding: "0.55rem 1rem",
                borderRadius: "999px",
                border: "none",
                background:
                  "linear-gradient(135deg, #ff4b5c 0%, #d7263d 50%, #a1162f 100%)",
                color: "#fff",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                boxShadow: "0 8px 18px rgba(215,38,61,0.5)",
                transition: "transform 0.12s ease, box-shadow 0.12s ease",
              }}
              onMouseOver={(e) => {
                const btn = e.currentTarget;
                btn.style.transform = "translateY(-1px)";
                btn.style.boxShadow = "0 10px 24px rgba(215,38,61,0.65)";
              }}
              onMouseOut={(e) => {
                const btn = e.currentTarget;
                btn.style.transform = "translateY(0)";
                btn.style.boxShadow = "0 8px 18px rgba(215,38,61,0.5)";
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

      {/* Debug: health JSON (ha már nem kell, ezt nyugodtan törölheted) */}
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
