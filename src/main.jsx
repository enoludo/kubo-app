import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { migrateSessionIds } from './utils/migrateSession'
import './index.css'
import App from './App.jsx'

// Migration one-shot : convertit les IDs entiers (legacy) en UUIDs
// avant que React initialise les états depuis sessionStorage
migrateSessionIds()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
