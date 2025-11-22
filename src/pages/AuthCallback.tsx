import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const error = url.searchParams.get("error");

        // Tisztítsuk le az URL-t (ne maradjon benne a code)
        window.history.replaceState({}, document.title, "/auth/callback");

        if (error) {
          return navigate("/?auth=error", { replace: true });
        }
        if (!code) {
          return navigate("/?auth=missing_code", { replace: true });
        }

        const API_BASE = import.meta.env.VITE_API_URL;

        const res = await fetch(`${API_BASE}/api/auth/discord`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            redirect_uri: window.location.origin + "/auth/callback",
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.user) {
          throw new Error(data.error || "auth_failed");
        }

        localStorage.setItem("fivemhub_user", JSON.stringify(data.user));
        if (data.access_token) {
          localStorage.setItem("fivemhub_token", data.access_token);
        }

        window.dispatchEvent(new Event("auth_changed"));
        navigate("/home", { replace: true });
      } catch (e) {
        console.error(e);
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
