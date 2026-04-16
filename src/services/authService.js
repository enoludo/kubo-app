// ─── Auth — service Supabase ──────────────────────────────────────────────────
import { supabase } from './supabase'

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data.session
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function setTeamSession(access_token, refresh_token) {
  const { data, error } = await supabase.auth.setSession({ access_token, refresh_token })
  if (error) throw error
  return data.session
}

export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, name')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}
