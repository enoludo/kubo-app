// ─── Utilitaires photos Google Drive — Traçabilité ────────────────────────────
//
// Pourquoi thumbnail et pas uc?export=view ?
// uc?export=view redirige vers une page HTML (scan antivirus Google)
// au lieu de retourner les bytes de l'image — les balises <img> ne peuvent
// pas afficher une page HTML, donc l'image ne s'affiche pas.
// L'endpoint /thumbnail retourne l'image directement.

/**
 * Extrait le FILE_ID depuis n'importe quelle URL Google Drive.
 * Formats supportés :
 *   - https://drive.google.com/uc?export=view&id=FILE_ID
 *   - https://drive.google.com/file/d/FILE_ID/view
 */
export function extractFileId(driveUrl) {
  if (!driveUrl) return null
  // uc?export=view&id=FILE_ID  (format retourné par googleDrive.js)
  const ucMatch = driveUrl.match(/[?&]id=([^&/]+)/)
  if (ucMatch) return ucMatch[1]
  // /file/d/FILE_ID/
  const dMatch = driveUrl.match(/\/d\/([^/?]+)/)
  if (dMatch) return dMatch[1]
  return null
}

/**
 * Retourne une URL affichable dans <img> pour un fichier Google Drive public.
 * Utilise l'endpoint /thumbnail qui retourne l'image directement.
 *
 * @param {string|null} driveUrl — URL Google Drive (tout format)
 * @param {string}      size     — ex: 'w800', 'w400', 'w1600' (défaut: 'w1600')
 * @returns {string|null}
 */
export function getDisplayUrl(driveUrl, size = 'w1600') {
  const fileId = extractFileId(driveUrl)
  if (!fileId) return driveUrl ?? null
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=${size}`
}
