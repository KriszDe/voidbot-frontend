// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

import App from "./App";              // landing (fő oldal, voidbot.hu/)
import Home from "./pages/Home";      // bejelentkezett oldal (voidbot.hu/home)
import AuthCallback from "./pages/AuthCallback"; // voidbot.hu/auth/callback

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Fő marketing / landing oldal */}
        <Route path="/" element={<App />} />

        {/* Discord OAuth callback */}
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Belépés utáni app */}
        <Route path="/home" element={<Home />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
