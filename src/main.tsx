import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import './index.css'

import App from './App'
import Home from './pages/Home'
import AuthCallback from './pages/AuthCallback'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>

        {/* Főoldal */}
        <Route path="/" element={<App />} />

      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
