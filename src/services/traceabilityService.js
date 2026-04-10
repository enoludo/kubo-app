// ─── Traceability — service Supabase ──────────────────────────────────────────
import { supabase } from './supabase'

// ══════════════════════════════════════════════════════════════════════════════
// Conversion helpers
// ══════════════════════════════════════════════════════════════════════════════

function rowToSupplier(row) {
  return {
    id:          row.slug       ?? row.id,
    _supabaseId: row.id,
    name:        row.name       ?? '',
    contactName: row.contact_name ?? null,
    contact:     row.phone      ?? null,
    colorIndex:  row.color_index ?? 0,
    active:      row.active     ?? true,
    createdAt:   row.created_at,
  }
}

function supplierToRow(supplier) {
  return {
    name:         supplier.name         ?? '',
    contact_name: supplier.contactName  ?? null,
    phone:        supplier.contact      ?? null,
    color_index:  supplier.colorIndex   ?? 0,
    active:       supplier.active       ?? true,
    slug:         supplier.id,          // legacy id (ex: "sup-001") or UUID
  }
}

function rowToDelivery(row) {
  return {
    id:                row.slug       ?? row.id,
    _supabaseId:       row.id,
    supplierId:        row.supplier_slug ?? row.supplier_id,
    date:              row.date,
    productName:       row.product_name       ?? '',
    weight:            row.weight_text        ?? null,
    lot:               row.lot                ?? null,
    dlc:               row.dlc                ?? null,
    temperature:       row.temperature        ?? null,
    conformity:        row.conformity         ?? 'compliant',
    nonConformityNote: row.non_conformity_note ?? null,
    photo_url:         row.photo_url          ?? null,
    createdAt:         row.created_at,
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Suppliers
// ══════════════════════════════════════════════════════════════════════════════

export async function fetchSuppliers() {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('name')
  if (error) throw error
  return data.map(rowToSupplier)
}

export async function upsertSupplier(supplier) {
  const row = supplierToRow(supplier)
  const { data, error } = await supabase
    .from('suppliers')
    .upsert(row, { onConflict: 'slug' })
    .select('id, slug')
    .single()
  if (error) throw error
  return data  // { id (UUID), slug }
}

export async function upsertSuppliers(suppliers) {
  const rows = suppliers.map(supplierToRow)
  const { data, error } = await supabase
    .from('suppliers')
    .upsert(rows, { onConflict: 'slug' })
    .select('id, slug')
  if (error) throw error
  return data  // [{ id, slug }]
}

export async function deleteSupplier(slug) {
  const { error } = await supabase
    .from('suppliers')
    .delete()
    .eq('slug', slug)
  if (error) throw error
}

// ══════════════════════════════════════════════════════════════════════════════
// Deliveries
// ══════════════════════════════════════════════════════════════════════════════

export async function fetchDeliveries() {
  const { data, error } = await supabase
    .from('delivered_products')
    .select('*, suppliers!inner(slug)')
    .order('date', { ascending: false })
  if (error) throw error
  return data.map(row => rowToDelivery({
    ...row,
    supplier_slug: row.suppliers?.slug,
  }))
}

export async function upsertDelivery(delivery, supplierSupabaseId) {
  const row = {
    supplier_id:          supplierSupabaseId,
    date:                 delivery.date,
    product_name:         delivery.productName      ?? '',
    weight_text:          delivery.weight           ?? null,
    lot:                  delivery.lot              ?? null,
    dlc:                  delivery.dlc              ?? null,
    temperature:          delivery.temperature !== undefined && delivery.temperature !== null
                            ? Number(delivery.temperature) : null,
    conformity:           delivery.conformity        ?? 'compliant',
    non_conformity_note:  delivery.nonConformityNote ?? null,
    photo_url:            delivery.photo_url         ?? null,
    slug:                 delivery.id,
  }
  const { error } = await supabase
    .from('delivered_products')
    .upsert(row, { onConflict: 'slug' })
  if (error) throw error
}

export async function upsertDeliveries(deliveries, slugToSupabaseId) {
  const rows = deliveries.map(d => ({
    supplier_id:          slugToSupabaseId[d.supplierId] ?? d.supplierId,
    date:                 d.date,
    product_name:         d.productName      ?? '',
    weight_text:          d.weight           ?? null,
    lot:                  d.lot              ?? null,
    dlc:                  d.dlc              ?? null,
    temperature:          d.temperature !== undefined && d.temperature !== null
                            ? Number(d.temperature) : null,
    conformity:           d.conformity        ?? 'compliant',
    non_conformity_note:  d.nonConformityNote ?? null,
    photo_url:            d.photo_url         ?? null,
    slug:                 d.id,
  }))
  const { error } = await supabase
    .from('delivered_products')
    .upsert(rows, { onConflict: 'slug' })
  if (error) throw error
}

export async function deleteDelivery(slug) {
  const { error } = await supabase
    .from('delivered_products')
    .delete()
    .eq('slug', slug)
  if (error) throw error
}
