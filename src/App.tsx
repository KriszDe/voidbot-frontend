import { useState } from "react";

function App() {
  const [backendResponse, setBackendResponse] = useState<string>("");

  const pingBackend = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL;
      const res = await fetch(`${API_BASE}/api/health`);
      const data = await res.json();
      setBackendResponse(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setBackendResponse("Hiba: " + err.message);
    }
  };

  const handleDiscordLogin = () => {
    const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID as string;
    const redirect = encodeURIComponent(
      import.meta.env.VITE_DISCORD_REDIRECT as string
    );
    const scope = encodeURIComponent("identify guilds");
    const responseType = "code";

    const url =
      `https://discord.com/oauth2/authorize` +
      `?client_id=${clientId}` +
      `&response_type=${responseType}` +
      `&redirect_uri=${redirect}` +
      `&scope=${scope}`;

    window.location.href = url;
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
      <h1 style={{ fontSize: "2rem" }}>VOIDBOT – Alap Frontend</h1>

      <button
        onClick={pingBackend}
        style={{
          padding: "0.8rem 1.4rem",
          background: "white",
          borderRadius: "8px",
          color: "#0b0d10",
          fontWeight: "bold",
          border: "none",
          cursor: "pointer",
          marginBottom: "0.5rem",
        }}
      >
        Ping Backend
      </button>

      <button
        onClick={handleDiscordLogin}
        style={{
          padding: "0.8rem 1.4rem",
          background: "#5865F2",
          borderRadius: "8px",
          color: "white",
          fontWeight: "bold",
          border: "none",
          cursor: "pointer",
        }}
      >
        Belépés Discorddal
      </button>

      {backendResponse && (
        <pre
          style={{
            marginTop: "1.5rem",
            padding: "1rem",
            background: "#111",
            borderRadius: "8px",
            maxWidth: "500px",
            width: "100%",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {backendResponse}
        </pre>
      )}
    </main>
  );
}

export default App;
