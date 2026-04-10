import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { migrateSessionIds } from './utils/migrateSession'
import './services/supabase'
import './design-system/design-tokens.css'
import './modules/planning/planning-tokens.css'
import './design-system/typography.css'
import './design-system/components/Button/Button.css'
import './design-system/components/Input/Input.css'
import './design-system/components/Badge/Badge.css'
import './design-system/components/Modal/Modal.css'
import './design-system/components/Dropdown/Dropdown.css'
import './index.css'
import { AuthProvider } from './hooks/useAuth.jsx'
import App from './App.jsx'

// Migration one-shot : convertit les IDs entiers (legacy) en UUIDs
// avant que React initialise les états depuis sessionStorage
migrateSessionIds()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
