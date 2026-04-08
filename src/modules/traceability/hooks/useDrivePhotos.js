// ─── Hook — sync photos Google Drive ──────────────────────────────────────────
// Charge les photos au montage, puis toutes les 5 minutes.
// Ne plante jamais le module principal si Drive est inaccessible.

import { useState, useEffect, useCallback } from 'react'
import { listDrivePhotos } from '../../../services/googleDrive'

const POLL_MS = 5 * 60 * 1000

export function useDrivePhotos() {
  const [photos,  setPhotos]  = useState([])
  const [syncing, setSyncing] = useState(false)

  const sync = useCallback(async () => {
    setSyncing(true)
    try {
      const files = await listDrivePhotos()
      setPhotos(files)
    } catch (err) {
      console.error('[drive] useDrivePhotos sync:', err.message)
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
