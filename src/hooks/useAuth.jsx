// ─── Hook useAuth — session + rôle ────────────────────────────────────────────
import { createContext, useContext, useState, useEffect } from 'react'
import { supabase }       from '../services/supabase'
import { fetchProfile }   from '../services/authService'
import { sessionClear }   from '../utils/session'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(null)
  const [role,      setRole]      = useState(null)
  const [name,      setName]      = useState(null)
  const [loading,   setLoading]   = useState(true)

  async function loadProfile(supabaseUser) {
    try {
      const profile = await fetchProfile(supabaseUser.id)
      setRole(profile.role)
      setName(profile.name ?? supabaseUser.email)
    } catch {
      // Fallback si le profil n'existe pas encore
      setRole('team')
      setName(supabaseUser.email)
    }
  }

  useEffect(() => {
    // Pas de restauration de session — reconnexion obligatoire à chaque chargement
    supabase.auth.signOut().finally(() => setLoading(false))

    // Écoute les changements d'état auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        loadProfile(session.user)
      } else {
        // Nettoyage du cache session : évite qu'une nouvelle session hérite
        // des données d'une session précédente (ex: gérant → team)
        sessionClear()
        setUser(null)
        setRole(null)
        setName(null)
      }
    })

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isManager = role === 'manager'

  return (
    <AuthContext.Provider value={{ user, role, name, isManager, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
