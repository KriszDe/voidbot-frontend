import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      try {
        // Parse Query Params
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const error = url.searchParams.get("error");

        // Clear URL (ne maradjon fent a code)
        window.history.replaceState({}, document.title, "/auth/callback");

        if (error) {
          return navigate("/?auth=error", { replace: true });
        }
        if (!code) {
          return navigate("/?auth=missing_code", { replace: true });
        }

        const API_BASE = import.meta.env.VITE_API_URL;

        // Backend hívása
        const res = await fetch(`${API_BASE}/api/auth/discord`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            redirect_uri: window.location.origin + "/auth/callback"
          })
        });

        const data = await res.json();

        if (!res.ok || !data.user) {
          throw new Error(data.error || "auth_failed");
        }

        // Sikeres login → tárolás
        localStorage.setItem("fivemhub_user", JSON.stringify(data.user));
        localStorage.setItem("fivemhub_token", data.access_token);

        // Auth event
        window.dispatchEvent(new Event("auth_changed"));

        // 🔥 KÉSZ → átirányítás a HOME oldalra
        navigate("/home", { replace: true });

      } catch (err) {
        console.error(err);
        navigate("/?auth=error", { replace: true });
      }
    };

    run();
  }, [navigate]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0b0d10",
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "1.4rem",
      }}
    >
      Discord beléptetés…
    </main>
  );
}
