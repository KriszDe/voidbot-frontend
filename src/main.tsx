import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App'              // ← landing (fő oldal)
import Home from './pages/Home'      // ← bejelentkezett főoldal
import AuthCallback from './pages/AuthCallback'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} /> {/* fő oldal */}
        <Route path="/home" element={<Home />} />       {/* bejelentkezett oldal */}
        <Route path="/auth/callback" element={<AuthCallback />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
