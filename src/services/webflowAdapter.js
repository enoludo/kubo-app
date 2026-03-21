// ─── Webflow Ecommerce → format interne commandes ─────────────────────────────
//
// Appelle /api/webflow-orders (Vercel proxy sécurisé),
// mappe les orders Webflow vers le schéma interne Kubo.
//
// RÈGLE BRUNCH : si un item.productName contient "Brunch du Samedi"
// (insensible à la casse) → channel = 'brunch', brunchSource = 'web'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

// ── Détection brunch ──────────────────────────────────────────────────────────

function isBrunchOrder(purchasedItems = []) {
  return purchasedItems.some(
    item => item.productName?.toLowerCase().includes('brunch du samedi')
  )
}

function getBrunchItem(purchasedItems = []) {
  return purchasedItems.find(
    item => item.productName?.toLowerCase().includes('brunch du samedi')
  ) ?? null
}

// ── Parsing variantName brunch ────────────────────────────────────────────────
// Format : "Brunch du Samedi Horaire: 10:30, Date: Samedi 14 Février"

const MOIS_FR = {
  janvier: '01', février: '02', fevrier: '02', mars: '03', avril: '04',
  mai: '05', juin: '06', juillet: '07', août: '08', aout: '08',
  septembre: '09', octobre: '10', novembre: '11', décembre: '12', decembre: '12',
}

function parseBrunchVariant(variantName, acceptedOn) {
  if (!variantName) return { date: null, time: null }

  // Heure : "Horaire: HH:MM"
  const timeMatch = variantName.match(/Horaire\s*:\s*(\d{1,2}:\d{2})/i)
  const time = timeMatch ? timeMatch[1].padStart(5, '0') : null

  // Date : "Date: Samedi DD Mois" — [^\s,]+ pour capturer les mois accentués (Février, Août…)
  const dateMatch = variantName.match(/Date\s*:\s*[^\s,]+\s+(\d{1,2})\s+([^\s,]+)/i)
  if (!dateMatch) {
    console.warn('[webflowAdapter] brunch: date non parseable dans variantName:', variantName)
    return { date: null, time }
  }

  const day   = dateMatch[1].padStart(2, '0')
  const month = MOIS_FR[dateMatch[2].toLowerCase()]
  if (!month) {
    console.warn('[webflowAdapter] brunch: mois inconnu:', dateMatch[2])
    return { date: null, time }
  }

  // Année : déduire depuis acceptedOn
  const baseYear = acceptedOn ? parseInt(acceptedOn.slice(0, 4), 10) : new Date().getFullYear()
  const candidate = `${baseYear}-${month}-${day}`
  // Si la date candidate est > 60 jours avant acceptedOn, on passe à l'année suivante
  // (cas commande en décembre pour brunch en janvier)
  const diff = new Date(candidate) - new Date(acceptedOn?.slice(0, 10) ?? candidate)
  const year = diff < -60 * 86400000 ? baseYear + 1 : baseYear

  return { date: `${year}-${month}-${day}`, time }
}

// ── Extraction date/heure de retrait ─────────────────────────────────────────

// Cherche YYYY-MM-DD, DD/MM/YYYY ou DD-MM-YYYY dans une chaîne
function parseFlexDate(str) {
  if (!str) return null
  const isoMatch = str.match(/(\d{4}-\d{2}-\d{2})/)
  if (isoMatch) return isoMatch[1]
  // DD/MM/YYYY ou DD-MM-YYYY
  const frMatch = str.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/)
  if (frMatch) return `${frMatch[3]}-${frMatch[2]}-${frMatch[1]}`
  return null
}

// Extrait HH:MM ou HHhMM depuis une chaîne
function parseTime(str) {
  if (!str) return null
  const m = str.match(/(\d{1,2})[h:H](\d{2})/)
  if (m) return `${m[1].padStart(2, '0')}:${m[2]}`
  return null
}

function extractPickupDate(order) {
  // 1. customData (champs personnalisés checkout Webflow)
  if (Array.isArray(order.customData)) {
    for (const field of order.customData) {
      const key = (field.name ?? '').toLowerCase()
      if (key.includes('date') || key.includes('retrait') || key.includes('livraison')) {
        const parsed = parseFlexDate(field.textInput?.trim())
        if (parsed) return parsed
      }
    }
  }
  // 2. Note/commentaire libre
  if (order.comment) {
    const parsed = parseFlexDate(order.comment)
    if (parsed) return parsed
  }
  // 3. Fallback : date de commande
  return order.orderedOn ? order.orderedOn.slice(0, 10) : null
}

function extractPickupTime(order) {
  if (Array.isArray(order.customData)) {
    for (const field of order.customData) {
      const key = (field.name ?? '').toLowerCase()
      // Champ dédié à l'heure
      if (key.includes('heure') || key.includes('time') || key.includes('créneau') || key.includes('creneau')) {
        const t = parseTime(field.textInput?.trim())
        if (t) return t
      }
      // Heure embarquée dans le même champ que la date (ex: "21-03-2026 / 10:30")
      if (key.includes('date') || key.includes('retrait') || key.includes('livraison')) {
        const t = parseTime(field.textInput?.trim())
        if (t) return t
      }
    }
  }
  return null
}

// ── Nettoyage du champ size ───────────────────────────────────────────────────

function cleanSize(variantName) {
  if (!variantName) return null
  const rawSize   = variantName
  const sizeMatch = rawSize.match(/Taille[:\s].*/i)
  return sizeMatch ? sizeMatch[0].trim() : rawSize
}

// ── Mapping principal ─────────────────────────────────────────────────────────

function mapOrder(order) {
  const isBrunch     = isBrunchOrder(order.purchasedItems)
  const channel      = isBrunch ? 'brunch' : 'web'
  const brunchSource = isBrunch ? 'web'    : null

  const items = (order.purchasedItems ?? []).map(item => {
    const sizeRaw     = isBrunch ? null : item.variantName
    const sizeCleaned = isBrunch ? null : cleanSize(item.variantName)
    console.log('[webflow] size brut:', sizeRaw)
    console.log('[webflow] size nettoyé:', sizeCleaned)
    return {
      label:     item.productName ?? '',
      size:      sizeCleaned,
      qty:       item.count        ?? 1,
      unitPrice: item.variantPrice?.value != null ? item.variantPrice.value / 100 : null,
    }
  })

  const paid =
    order.status        === 'fulfilled'  ||
    order.paymentStatus === 'paid'       ||
    order.paymentStatus === 'authorized'

  // Date et heure de retrait
  let pickupDate, pickupTime
  if (isBrunch) {
    const brunchItem = getBrunchItem(order.purchasedItems)
    const parsed = parseBrunchVariant(brunchItem?.variantName, order.acceptedOn)
    pickupDate = parsed.date ?? order.acceptedOn?.slice(0, 10) ?? null
    pickupTime = parsed.time
  } else {
    pickupDate = extractPickupDate(order)
    pickupTime = extractPickupTime(order)
  }

  const createdAt = order.acceptedOn ?? new Date().toISOString()

  return {
    id:             crypto.randomUUID(),
    webflowOrderId: order.orderId,
    channel,
    status:         'new',
    paid,
    customer: {
      name:  order.customerInfo?.fullName ?? '',
      phone: order.customerInfo?.phone    ?? null,
      email: order.customerInfo?.email    ?? null,
    },
    items,
    totalPrice:  order.totals?.subtotal?.value != null ? order.totals.subtotal.value / 100 : 0,
    pickupDate,
    pickupTime,
    createdAt,
    updatedAt:   createdAt,
    brunchSource,
    note:        order.comment || null,
  }
}

// ── Export principal ──────────────────────────────────────────────────────────

/**
 * Récupère les commandes Webflow et retourne uniquement les nouvelles.
 * @param {Set<string>} existingWebflowIds — IDs déjà importés (déduplication)
 * @returns {Promise<Array>} Nouvelles commandes mappées au format interne
 */
export async function fetchOrders(existingWebflowIds = new Set()) {
  const url = `${API_BASE}/api/webflow-orders?limit=100`
  console.log('[webflowAdapter] fetch →', url)

  const res = await fetch(url)

  console.log('[webflowAdapter] status:', res.status)

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    console.error('[webflowAdapter] erreur:', body)
    const err  = new Error(body.error ?? `HTTP ${res.status}`)
    err.status = res.status
    throw err
  }

  const data   = await res.json()
  // Webflow v2 retourne { orders: [...] } ou { items: [...] }
  const orders = data.orders ?? data.items ?? []
  console.log('[webflow] premier item:', orders[0]?.purchasedItems?.[0])

  return orders
    .filter(o => o.orderId && !existingWebflowIds.has(o.orderId))
    .map(mapOrder)
}
