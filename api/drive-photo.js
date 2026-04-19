// ─── Vercel Serverless Function — Proxy photos Google Drive ───────────────────
// GET /api/drive-photo?id=FILE_ID
//
// Fetch le fichier Drive côté serveur avec une API Key (read-only).
// Fonctionne pour les fichiers avec permission "anyone reader".
// L'API Key ne transite jamais côté client.
//
// Variables d'environnement requises :
//   GOOGLE_API_KEY — clé API Google restreinte à "Google Drive API"

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const { id } = req.query
  if (!id || !/^[-\w]+$/.test(id)) return res.status(400).end()

  const { GOOGLE_API_KEY } = process.env
  if (!GOOGLE_API_KEY) return res.status(500).end()

  let driveRes
  try {
    driveRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${id}?alt=media&key=${GOOGLE_API_KEY}`
    )
  } catch {
    return res.status(502).end()
  }

  if (!driveRes.ok) return res.status(driveRes.status).end()

  const contentType = driveRes.headers.get('content-type') ?? 'image/jpeg'
  res.setHeader('Content-Type', contentType)
  res.setHeader('Cache-Control', 'public, max-age=86400, immutable')

  const { Readable } = await import('stream')
  Readable.fromWeb(driveRes.body).pipe(res)
}
