// src/pages/AuthCallback.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { postJSON } from "../lib/api";

type DiscordUser = {
  id: string;
  username: string;
  global_name?: string;
  avatar?: string;
  email?: string;
};
type DiscordAuthResponse = {
  user?: DiscordUser;
  oauth?: { scope: string; token_type: string };
  access_token?: string;
  error?: string;
  error_description?: string;
};

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // ✅ Guard: dev módban (StrictMode) a useEffect kétszer futhat – fussunk csak egyszer
    if (sessionStorage.getItem("oauth_handled") === "1") return;
    sessionStorage.setItem("oauth_handled", "1");

    const run = async () => {
      // Azonnal beolvassuk a kódot és az állapotot
      const url = new URL(window.location.href);
      const error = url.searchParams.get("error");
      const code = url.searchParams.get("code");
      const returnedState = url.searchParams.get("state");
      const expectedState = sessionStorage.getItem("oauth_state");

      // ✅ Tisztítsuk az URL-t, hogy refresh/back ne próbálja újra felhasználni a kódot
      window.history.replaceState({}, document.title, `${window.location.origin}/auth/callback`);

      if (error) {
        cleanupState();
        return navigate(`/?auth=error&msg=${encodeURIComponent(error)}`, { replace: true });
      }
      if (!code) {
        cleanupState();
        return navigate(`/?auth=error&msg=missing_code`, { replace: true });
      }
      if (!returnedState || !expectedState || returnedState !== expectedState) {
        cleanupState();
        return navigate(`/?auth=error&msg=state_mismatch`, { replace: true });
      }

      try {
        // Fontos: a backendben a DISCORD_REDIRECT_URI-nek pontosan egyeznie kell ezzel.
        const redirect_uri = `${window.location.origin}/auth/callback`;
        const data = await postJSON<DiscordAuthResponse>("/api/auth/discord", { code, redirect_uri });

        if (!data.user) {
          throw new Error(data.error_description || data.error || "missing_user");
        }

        // Mentés
        localStorage.setItem("fivemhub_user", JSON.stringify(data.user));
        if (data.access_token) {
          localStorage.setItem("fivemhub_token", data.access_token);
        }

        cleanupState();
        window.dispatchEvent(new Event("auth_changed"));
        navigate("/home", { replace: true });
      } catch (e: any) {
        cleanupState();
        navigate(`/?auth=error&msg=${encodeURIComponent(e?.message || "auth_failed")}`, { replace: true });
      }
    };

    run();

    // Kis segédfüggvény az állapotok takarítására
    function cleanupState() {
      sessionStorage.removeItem("oauth_state");
      // hagyjuk meg az oauth_handled-et a teljes navigációig (duplafutás ellen)
      setTimeout(() => {
        sessionStorage.removeItem("oauth_handled");
      }, 0);
    }
  }, [navigate]);

  return (
    <main className="min-h-screen grid place-items-center bg-[#0b0d10] text-white">
      <p>Bejelentkezés…</p>
    </main>
  );
}
