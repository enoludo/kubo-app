// ─── DriveImage — charge une image Google Drive ────────────────────────────────
//
// Deux chemins selon la présence d'un token OAuth :
//
// Avec token (local / gérant connecté à Google) :
//   Fetch blob via Drive API → blob URL.
//   HEIC : tente affichage natif (Safari), sinon conversion heic2any → JPEG.
//
// Sans token (production, mode team) :
//   <img src> direct sur l'endpoint thumbnail public de Drive.
//   Pas de fetch → pas de CORS. Google sert un JPEG même pour les sources HEIC.

import { useState, useEffect, useRef } from 'react'
import heic2any     from 'heic2any'
import { getToken } from '../../../services/googleAuth'
import { extractFileId } from '../utils/traceabilityPhotos'

function isHeicType(blobType, mimeType) {
  const t = blobType || mimeType || ''
  return t.includes('heic') || t.includes('heif')
}

export default function DriveImage({ driveUrl, mimeType, alt, className, onClick }) {
  const [blobUrl,    setBlobUrl]    = useState(null)
  const [directUrl,  setDirectUrl]  = useState(null)
  const [converting, setConverting] = useState(false)
  const [error,      setError]      = useState(false)
  const blobRef = useRef(null)

  useEffect(() => {
    if (!driveUrl) return

    const fileId = extractFileId(driveUrl)
    if (!fileId) return

    const token = getToken()

    if (!token) {
      // Sans token — URL thumbnail directe, Google convertit HEIC → JPEG côté serveur
      setDirectUrl(`/api/drive-photo?id=${fileId}`)
      return
    }

    // Avec token — fetch blob pour support HEIC natif + conversion fallback
    let objectUrl = null
    let cancelled = false

    fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error(`Drive ${res.status}`)
        return res.blob()
      })
      .then(blob => {
        if (cancelled) return
        blobRef.current = blob

        const heic = isHeicType(blob.type, mimeType)
        if (!heic) {
          objectUrl = URL.createObjectURL(blob)
          setBlobUrl(objectUrl)
          return
        }
        // HEIC — tenter affichage natif (Safari), onError déclenchera heic2any si besoin
        objectUrl = URL.createObjectURL(blob)
        setBlobUrl(objectUrl)
        setConverting(true)
      })
      .catch(err => {
        if (!cancelled) {
          console.error('[drive] Échec chargement image:', err.message, '— fileId:', fileId)
          setError(true)
        }
      })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      blobRef.current = null
    }
  }, [driveUrl, mimeType])

  async function handleImgError() {
    const blob = blobRef.current
    if (!blob || !isHeicType(blob.type, mimeType)) {
      setError(true)
      return
    }
    try {
      const result  = await heic2any({ blob, toType: 'image/jpeg', quality: 0.8 })
      const jpegBlob = Array.isArray(result) ? result[0] : result
      const jpegUrl  = URL.createObjectURL(jpegBlob)
      setBlobUrl(prev => {
        if (prev) URL.revokeObjectURL(prev)
        return jpegUrl
      })
    } catch (err) {
      console.error('[heic] conversion failed:', err.message)
      setError(true)
    } finally {
      setConverting(false)
    }
  }

  if (error) return null

  // Chemin sans token — rendu direct, pas de blob
  if (directUrl) {
    return (
      <img
        src={directUrl}
        alt={alt}
        className={className}
        onClick={onClick}
      />
    )
  }

  if (!blobUrl) {
    return <div className="drive-image-loading" aria-hidden="true" />
  }

  return (
    <img
      src={blobUrl}
      alt={alt}
      className={className}
      onClick={converting ? undefined : onClick}
      onError={handleImgError}
      style={converting ? { opacity: 0.5 } : undefined}
    />
  )
}
