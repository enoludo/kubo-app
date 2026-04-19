// ─── Hook — photos traçabilité depuis Supabase ─────────────────────────────────
// Lit la table trace_photos (métadonnées Drive) — pas d'OAuth requis.

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../services/supabase'

const POLL_MS = 5 * 60 * 1000

export function useDrivePhotos() {
  const [photos,  setPhotos]  = useState([])
  const [syncing, setSyncing] = useState(false)

  const sync = useCallback(async () => {
    setSyncing(true)
    try {
      const { data, error } = await supabase
        .from('trace_photos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)
      if (error) throw error
      setPhotos((data ?? []).map(row => ({
        fileId:      row.file_id,
        name:        row.name,
        mimeType:    row.mime_type,
        description: row.product_name ?? null,
        createdTime: row.created_at,
        url:         row.url,
      })))
    } catch (err) {
      console.error('[trace_photos] sync:', err.message)
    } finally {
      setSyncing(false)
    }
  }, [])

  useEffect(() => {
    sync()
    const timer = setInterval(sync, POLL_MS)
    return () => clearInterval(timer)
  }, [sync])

  return { photos, syncing, sync }
}
