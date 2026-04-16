// ─── DriveImage — charge une image Google Drive avec le Bearer token ───────────
//
// Flux HEIC/HEIF :
//  1. Fetch le blob via Drive API (Bearer token)
//  2. Tente un affichage natif (Safari/iOS supporte HEIF nativement)
//  3. Si onError → conversion heic2any → JPEG → blob URL
//
// Flux JPEG/PNG/WebP standard :
//  1. Fetch le blob → blob URL direct

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
  const [converting, setConverting] = useState(false)
  const [error,      setError]      = useState(false)
  const blobRef = useRef(null)  // blob original conservé pour fallback heic2any

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
        console.log('[drive] blob chargé:', { type: blob.type, mimeType, size: blob.size, heic })

        if (!heic) {
          // Image standard — affichage direct
          objectUrl = URL.createObjectURL(blob)
          setBlobUrl(objectUrl)
          return
        }

        // HEIC/HEIF — tenter affichage natif d'abord (Safari)
        // Si le navigateur ne supporte pas → onError déclenchera la conversion
        objectUrl = URL.createObjectURL(blob)
        setBlobUrl(objectUrl)
        setConverting(true)  // indique qu'une conversion est peut-être nécessaire
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

  // Appelé quand <img> échoue à afficher le blob (navigateur ne supporte pas HEIF)
  async function handleImgError() {
    const blob = blobRef.current
    if (!blob || !isHeicType(blob.type, mimeType)) {
      setError(true)
      return
    }
    console.log('[heic] affichage natif échoué — conversion en cours, size:', blob.size)
    try {
      const result = await heic2any({ blob, toType: 'image/jpeg', quality: 0.8 })
      const jpegBlob = Array.isArray(result) ? result[0] : result
      const jpegUrl  = URL.createObjectURL(jpegBlob)
      console.log('[heic] converted OK, size:', jpegBlob.size)
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
