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
      // Préfixe wf- pour correspondre à product.id dans useProducts
      productId: item.productId ? `wf-${item.productId}` : null,
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

// ── Mapping allergènes Webflow (IDs CMS → clés internes) ─────────────────────
// Clés internes : 'gluten' | 'lait' | 'oeufs' | 'fruits-a-coques' |
//                 'arachides' | 'soja' | 'poisson' | 'sesame'

const WEBFLOW_ALLERGEN_MAP = {
  '68cd0a4b8979761c86bafd01': 'lait',            // Produits laitiers (confirmé)
  '68cd0a4b8979761c86bafcbe': 'oeufs',           // Œuf (confirmé)
  '68cd0a4b8979761c86bafc37': 'gluten',          // Farine de blé (confirmé par sarrasin)
  '68cd0a4b8979761c86bafc36': 'fruits-a-coques', // Amandes
  '68cd0a4b8979761c86bafced': 'poisson',         // Gélatine de poisson
  '68cd0a4b8979761c86bafc89': 'fruits-a-coques', // Noisettes
  '68cd0a4b8979761c86bafc71': 'fruits-a-coques', // Noix / pécan
  '68cd0a4b8979761c86bafcd6': 'fruits-a-coques', // Pistache
  '68cd0a4b8979761c86bafd0f': 'sesame',          // Tahini / sésame
  '68cd0a4b8979761c86bafc38': 'arachides',       // Cacahuète (confirmé)
  '68f7f43e45ded89ea808c607': 'soja',            // Poudre de soja grillé
}

function resolveAllergens(ids = []) {
  const seen = new Set()
  const result = []
  for (const id of ids) {
    const key = WEBFLOW_ALLERGEN_MAP[id]
    if (key && !seen.has(key)) {
      seen.add(key)
      result.push(key)
    }
  }
  return result
}

// ── Mapping produits Webflow → format interne ─────────────────────────────────

function buildSizeValueMap(skuProperties) {
  // Construit : { propertyId: { valueId: labelString } }
  // pour la propriété "Taille" uniquement
  const tailleProp = (skuProperties ?? []).find(
    p => p.name?.toLowerCase().includes('taille')
  )
  if (!tailleProp) return null

  const valueMap = {}
  for (const entry of tailleProp.enum ?? []) {
    valueMap[entry.id] = entry.name
  }
  return { propertyId: tailleProp.id, valueMap }
}

function mapProduct(item) {
  // item.product + item.skus depuis l'API v2 Webflow ecommerce
  const p           = item.product ?? item
  const skus        = item.skus    ?? []
  const fd          = p.fieldData  ?? {}
  const productName = fd.name      ?? ''

  // Construit le dictionnaire Taille à partir de sku-properties
  const taille = buildSizeValueMap(fd['sku-properties'])

  const sizes = skus.map(sku => {
    const sfd        = sku.fieldData ?? {}
    const price      = sfd.price?.value != null ? sfd.price.value / 100 : null
    const skuValues  = sfd['sku-values'] ?? {}

    // Résolution via sku-properties (source fiable)
    let label = null
    if (taille) {
      const valueId = skuValues[taille.propertyId]
      label = valueId ? taille.valueMap[valueId] ?? null : null
    }
    // Fallback : extraire "Taille: XXX" du nom du SKU
    if (!label) {
      const match = (sfd.name ?? '').match(/Taille\s*:\s*(.+)/i)
      label = match ? match[1].trim() : (sfd.name?.replace(productName, '').trim() || 'Standard')
    }

    return { id: sku.id ?? crypto.randomUUID(), label, price, costPerUnit: null }
  }).filter(s => s.price != null)

  // Actif = publié et ni archivé ni brouillon
  const active = !p.isArchived && !p.isDraft

  return {
    id:                `wf-${p.id}`,
    webflowProductId:  p.id,
    name:              productName || p.slug || '',
    description:       fd.description ?? null,
    category:          fd.categorie   ?? '',
    photoUrl:          fd['image-01']?.url ?? null,
    active,
    sizes:             sizes.length ? sizes : [],
    allergens:         resolveAllergens(fd['produits-allergene']),
    pregnancySafe:     'check',
    pregnancyNote:     null,
    ingredients:       [],
    recipeSteps:       [],
    totalProductionTimeMin: null,
    restTimeMin:            null,
    advancePrepDays:        0,
    storageConditions:      '',
    shelfLifeHours:         null,
    sanitaryNotes:          '',
    internalNotes:          '',
    createdAt:              new Date().toISOString(),
    updatedAt:              new Date().toISOString(),
  }
}

// ── Export principal ──────────────────────────────────────────────────────────

// "10:30" → "10h30"  /  "10h30" → "10h30"
function normalizeTimeKey(str) {
  return str.replace(':', 'h')
}

/**
 * Récupère les prix par tranche horaire du produit "Brunch du Samedi".
 * @returns {Promise<Record<string, number>>} Ex : { '10h30': 45, '12h00': 45, '13h30': 45 }
 */
export async function fetchBrunchPrices() {
  try {
    const url = `${API_BASE}/api/webflow-products?limit=100`
    const res = await fetch(url)
    if (!res.ok) return {}

    const data  = await res.json()
    const items = data.items ?? data.products ?? []

    const brunchItem = items.find(item => {
      const name = item.product?.fieldData?.name ?? item.product?.name ?? item.fieldData?.name ?? ''
      return name.toLowerCase().includes('brunch du samedi')
    })
    if (!brunchItem) return {}

    const prices = {}
    for (const sku of brunchItem.skus ?? []) {
      const sfd   = sku.fieldData ?? {}
      const price = sfd.price?.value != null ? sfd.price.value / 100 : null
      if (price == null) continue

      const timeMatch = (sfd.name ?? '').match(/Horaire\s*:\s*(\d{1,2}:\d{2})/i)
      if (!timeMatch) continue

      const key = normalizeTimeKey(timeMatch[1])
      if (!(key in prices)) prices[key] = price
    }

    return prices
  } catch {
    return {}
  }
}

/**
 * Récupère les produits Webflow.
 * RÈGLE : exclut tout produit dont le nom contient "brunch" (insensible à la casse).
 * @returns {Promise<Array>} Produits mappés au format interne
 */
export async function fetchProducts() {
  const url = `${API_BASE}/api/webflow-products?limit=100`
  console.log('[webflow] fetchProducts appelé →', url)

  const res = await fetch(url)

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const err  = new Error(body.error ?? `HTTP ${res.status}`)
    err.status = res.status
    throw err
  }

  const data  = await res.json()
  // Webflow v2 retourne { items: [...] } pour les produits
  const items = data.items ?? data.products ?? []

  const mapped = items
    .filter(item => {
      const name = item.product?.fieldData?.name ?? item.product?.name ?? item.fieldData?.name ?? ''
      return !name.toLowerCase().includes('brunch')
    })
    .map(mapProduct)
    .filter(p => !p.name.toLowerCase().includes('brunch'))

  console.log('[webflow] produits reçus:', mapped.length)
  return mapped
}

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
