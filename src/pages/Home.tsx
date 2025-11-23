// src/pages/Home.tsx
import { useEffect, useState } from "react";

type HealthResponse = {
  ok: boolean;
  ts: number;
  message: string;
};

export default function Home() {
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [data, setData] = useState<HealthResponse | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_URL;
        const res = await fetch(`${API_BASE}/api/health`);
        const json = (await res.json()) as HealthResponse;
        setData(json);
        setStatus("ok");
      } catch (e) {
        console.error(e);
        setStatus("error");
      }
    };
    run();
  }, []);

  const renderText = () => {
    if (status === "loading") return "Ellenőrzés a backenddel…";
    if (status === "error") return "Hoppá, valami gond van a backenddel 😕";
    // status === "ok"
    return "Backend tökéletesen működik ✅";
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

      <div
        style={{
          padding: "1rem 1.5rem",
          borderRadius: "12px",
          background: "#111",
          fontSize: "1.2rem",
        }}
      >
        {renderText()}
      </div>

      {status === "ok" && data && (
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
{JSON.stringify(data, null, 2)}
        </pre>
      )}
    </main>
  );
}
