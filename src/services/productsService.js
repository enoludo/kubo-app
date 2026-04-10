// ─── Products — service Supabase ──────────────────────────────────────────────
//
// sizes, ingredients, recipeSteps stockés en JSONB dans la colonne products
// pour éviter les jointures — migration vers tables dédiées possible plus tard
//
import { supabase } from './supabase'

// ══════════════════════════════════════════════════════════════════════════════
// Conversion helpers
// ══════════════════════════════════════════════════════════════════════════════

function rowToProduct(row) {
  return {
    id:                     row.id,
    name:                   row.name              ?? '',
    category:               row.category          ?? '',
    description:            row.description       ?? null,
    photoUrl:               row.photo_url         ?? null,
    active:                 row.active            ?? true,
    pregnancySafe:          row.pregnancy_safe    ?? 'check',
    internalNotes:          row.internal_notes    ?? '',
    webflowProductId:       row.webflow_product_id ?? null,

    // Champs JSONB
    sizes:                  row.sizes             ?? [],
    allergens:              row.allergens         ?? [],
    ingredients:            row.ingredients       ?? [],
    recipeSteps:            row.recipe_steps      ?? [],

    // Champs enrichis
    pregnancyNote:          row.pregnancy_note            ?? null,
    totalProductionTimeMin: row.total_production_time_min ?? null,
    restTimeMin:            row.rest_time_min             ?? null,
    advancePrepDays:        row.advance_prep_days         ?? 0,
    storageConditions:      row.storage_conditions        ?? '',
    shelfLifeHours:         row.shelf_life_hours          ?? null,
    sanitaryNotes:          row.sanitary_notes            ?? '',

    createdAt:              row.created_at,
    updatedAt:              row.updated_at,
  }
}

function productToRow(product) {
  return {
    id:                           product.id,
    name:                         product.name              ?? '',
    category:                     product.category          ?? null,
    description:                  product.description       ?? null,
    photo_url:                    product.photoUrl          ?? null,
    active:                       product.active            ?? true,
    pregnancy_safe:               product.pregnancySafe     ?? 'check',
    internal_notes:               product.internalNotes     ?? null,
    webflow_product_id:           product.webflowProductId  ?? null,

    // JSONB
    sizes:                        product.sizes             ?? [],
    allergens:                    product.allergens         ?? [],
    ingredients:                  product.ingredients       ?? [],
    recipe_steps:                 product.recipeSteps       ?? [],

    // Champs enrichis
    pregnancy_note:               product.pregnancyNote            ?? null,
    total_production_time_min:    product.totalProductionTimeMin   ?? null,
    rest_time_min:                product.restTimeMin              ?? null,
    advance_prep_days:            product.advancePrepDays          ?? 0,
    storage_conditions:           product.storageConditions        ?? null,
    shelf_life_hours:             product.shelfLifeHours           ?? null,
    sanitary_notes:               product.sanitaryNotes            ?? null,
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Requêtes
// ══════════════════════════════════════════════════════════════════════════════

export async function fetchProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name')
  if (error) throw error
  return data.map(rowToProduct)
}

export async function upsertProduct(product) {
  const row = productToRow(product)
  if (product.webflowProductId) {
    const { id: _, ...rowWithoutId } = row
    const { error } = await supabase
      .from('products')
      .upsert(rowWithoutId, { onConflict: 'webflow_product_id' })
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('products')
      .upsert(row, { onConflict: 'id' })
    if (error) throw error
  }
}

function chunk(arr, size) {
  const chunks = []
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
  return chunks
}

export async function upsertProducts(products) {
  const CHUNK_SIZE = 20
  const webflow = products.filter(p => p.webflowProductId)
  const local   = products.filter(p => !p.webflowProductId)

  for (const batch of chunk(webflow, CHUNK_SIZE)) {
    const rows = batch.map(p => { const { id: _, ...r } = productToRow(p); return r })
    const { error } = await supabase
      .from('products')
      .upsert(rows, { onConflict: 'webflow_product_id' })
    if (error) throw error
  }

  for (const batch of chunk(local, CHUNK_SIZE)) {
    const rows = batch.map(p => productToRow(p))
    const { error } = await supabase
      .from('products')
      .upsert(rows, { onConflict: 'id' })
    if (error) throw error
  }
}

export async function deleteProduct(id) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
  if (error) throw error
}
