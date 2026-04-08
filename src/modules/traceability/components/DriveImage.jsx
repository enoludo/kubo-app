// ─── DriveImage — charge une image Google Drive avec le Bearer token ───────────
//
// Pourquoi pas <img src={url}> directement ?
// Chrome 120+ bloque les cookies tiers. Drive requiert une session Google
// pour afficher les thumbnails. Depuis un domaine différent, les cookies
// ne sont pas envoyés → redirection vers la page de login → onError.
//
// Solution : fetch avec Authorization: Bearer (token OAuth déjà en mémoire)
// → blob URL injecté dans <img src> → aucune dépendance aux cookies.

import { useState, useEffect } from 'react'
import { getToken }       from '../../../services/googleAuth'
import { extractFileId }  from '../utils/traceabilityPhotos'

export default function DriveImage({ driveUrl, alt, className, onClick }) {
  const [blobUrl, setBlobUrl] = useState(null)

  useEffect(() => {
    if (!driveUrl) return

    const fileId = extractFileId(driveUrl)
    if (!fileId) return

    const token = getToken()
    if (!token) {
      console.warn('[drive] Token absent — impossible de charger l\'image')
      return
    }

    let objectUrl = null

    fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error(`Drive ${res.status}`)
        return res.blob()
      })
      .then(blob => {
        objectUrl = URL.createObjectURL(blob)
        setBlobUrl(objectUrl)
      })
      .catch(err => {
        console.error('[drive] Échec chargement image:', err.message, '— fileId:', fileId)
      })

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [driveUrl])

  if (!blobUrl) return null

  return (
    <img
      src={blobUrl}
      alt={alt}
      className={className}
      onClick={onClick}
    />
  )
}
