// ─── Edge Function — export-to-sheets ─────────────────────────────────────────
//
// Lit les données depuis Supabase et les écrit dans Google Sheets
// via Service Account (pas d'OAuth utilisateur).
//
// Invocation :
//   POST /functions/v1/export-to-sheets
//   Body : { module: 'planning' | 'temperatures' | 'cleaning' | 'traceability' | 'all' }
//
// Secrets requis (Supabase Dashboard → Settings → Edge Functions → Secrets) :
//   GOOGLE_SERVICE_ACCOUNT_EMAIL
//   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
//   GOOGLE_SHEET_ID_PLANNING
//   GOOGLE_SHEET_ID_TEMPERATURES
//   GOOGLE_SHEET_ID_CLEANING
//   GOOGLE_SHEET_ID_TRACEABILITY

import { createClient }    from 'https://esm.sh/@supabase/supabase-js@2'
import { getAccessToken }  from './googleAuth.ts'
import { exportPlanning }  from './modules/planning.ts'
import { exportTemperatures } from './modules/temperatures.ts'
import { exportCleaning }  from './modules/cleaning.ts'
import { exportTraceability } from './modules/traceability.ts'

// ── Supabase client (service role — accès complet) ────────────────────────────

function makeSupabase() {
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) throw new Error('SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant')
  return createClient(url, key)
}

// ── Handler principal ─────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin':  '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      },
    })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  let body: { module?: string } = {}
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const module = body.module ?? 'all'
  const validModules = ['planning', 'temperatures', 'cleaning', 'traceability', 'all']
  if (!validModules.includes(module)) {
    return json({ error: `Module inconnu : ${module}. Valeurs valides : ${validModules.join(', ')}` }, 400)
  }

  console.log(`[export-to-sheets] module=${module} — démarrage`)

  try {
    const supabase = makeSupabase()
    const token    = await getAccessToken()

    const results: Record<string, string> = {}

    if (module === 'planning' || module === 'all') {
      const sheetId = Deno.env.get('GOOGLE_SHEET_ID_PLANNING')
      if (!sheetId) throw new Error('GOOGLE_SHEET_ID_PLANNING manquant')
      await exportPlanning(supabase, token, sheetId)
      results.planning = 'ok'
      console.log('[export-to-sheets] planning ✓')
    }

    if (module === 'temperatures' || module === 'all') {
      const sheetId = Deno.env.get('GOOGLE_SHEET_ID_TEMPERATURES')
      if (!sheetId) throw new Error('GOOGLE_SHEET_ID_TEMPERATURES manquant')
      await exportTemperatures(supabase, token, sheetId)
      results.temperatures = 'ok'
      console.log('[export-to-sheets] températures ✓')
    }

    if (module === 'cleaning' || module === 'all') {
      const sheetId = Deno.env.get('GOOGLE_SHEET_ID_CLEANING')
      if (!sheetId) throw new Error('GOOGLE_SHEET_ID_CLEANING manquant')
      await exportCleaning(supabase, token, sheetId)
      results.cleaning = 'ok'
      console.log('[export-to-sheets] nettoyage ✓')
    }

    if (module === 'traceability' || module === 'all') {
      const sheetId = Deno.env.get('GOOGLE_SHEET_ID_TRACEABILITY')
      if (!sheetId) throw new Error('GOOGLE_SHEET_ID_TRACEABILITY manquant')
      await exportTraceability(supabase, token, sheetId)
      results.traceability = 'ok'
      console.log('[export-to-sheets] traçabilité ✓')
    }

    console.log(`[export-to-sheets] terminé`, results)
    return json({ success: true, exported: results, exportedAt: new Date().toISOString() })

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[export-to-sheets] erreur:', message)
    return json({ error: message }, 500)
  }
})

// ── Utilitaire ────────────────────────────────────────────────────────────────

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type':                'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
