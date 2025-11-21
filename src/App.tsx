import { useState } from "react";

function App() {
  const [backendResponse, setBackendResponse] = useState<string>("");

  const pingBackend = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL; // pl. https://api.voidbot.hu

      const res = await fetch(`${API_BASE}/api/health`);
      const data = await res.json();

      setBackendResponse(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setBackendResponse("Hiba: " + err.message);
    }
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
      }}
    >
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>VOIDBOT – Alap Frontend</h1>

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
        }}
      >
        Ping Backend
      </button>

      {backendResponse && (
        <pre
          style={{
            marginTop: "2rem",
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
