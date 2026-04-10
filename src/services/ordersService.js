// ─── Orders — service Supabase ─────────────────────────────────────────────────
import { supabase } from './supabase'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
function isUUID(s) { return !!s && UUID_RE.test(s) }

// ══════════════════════════════════════════════════════════════════════════════
// Conversion helpers
// ══════════════════════════════════════════════════════════════════════════════

function rowToOrder(row) {
  return {
    id:             row.id,
    channel:        row.channel,
    brunchSource:   row.brunch_source      ?? null,
    customer: {
      name:  row.customer_name  ?? '',
      phone: row.customer_phone ?? null,
      email: row.customer_email ?? null,
    },
    pickupDate:     row.pickup_date,
    pickupTime:     row.pickup_time        ?? null,
    paymentStatus:  row.payment_status     ?? 'unpaid',
    paidAmount:     row.paid_amount        ?? null,
    totalPrice:     row.total_price        ?? null,
    note:           row.note               ?? null,
    webflowOrderId: row.webflow_order_id   ?? null,
    createdAt:      row.created_at,
    updatedAt:      row.updated_at,
    items: (row.order_items ?? []).map(item => ({
      id:        item.id,
      productId: item.product_id  ?? null,
      label:     item.label,
      size:      item.size        ?? null,
      qty:       item.qty,
      unitPrice: item.unit_price  ?? null,
    })),
  }
}

function orderToRow(order) {
  return {
    id:               order.id,
    channel:          order.channel,
    brunch_source:    order.brunchSource      ?? null,
    customer_name:    order.customer?.name    ?? '',
    customer_phone:   order.customer?.phone   ?? null,
    customer_email:   order.customer?.email   ?? null,
    pickup_date:      order.pickupDate,
    pickup_time:      order.pickupTime        ?? null,
    payment_status:   order.paymentStatus     ?? 'unpaid',
    paid_amount:      order.paidAmount        ?? null,
    total_price:      order.totalPrice        ?? null,
    note:             order.note              ?? null,
    webflow_order_id: order.webflowOrderId    ?? null,
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Requêtes
// ══════════════════════════════════════════════════════════════════════════════

export async function fetchOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('pickup_date')
  if (error) throw error
  return data.map(rowToOrder)
}

// Upsert ordre + suppression/réinsertion des items
// - Commandes Webflow : conflit sur webflow_order_id (les UUIDs changent à chaque fetch)
// - Commandes locales : conflit sur id
export async function upsertOrder(order) {
  const row = orderToRow(order)

  let supabaseId

  if (order.webflowOrderId) {
    // Webflow : ne pas passer id (Supabase garde son propre id)
    // → évite d'écraser le PK existant et la FK violation sur order_items
    const { id: _id, ...rowWithoutId } = row
    const { data, error: orderErr } = await supabase
      .from('orders')
      .upsert(rowWithoutId, { onConflict: 'webflow_order_id' })
      .select('id')
      .single()
    if (orderErr) throw orderErr
    supabaseId = data.id
  } else {
    await supabase
      .from('orders')
      .upsert(row, { onConflict: 'id' })
    supabaseId = order.id
  }

  // Items : delete + reinsert avec l'id réel de la commande en base
  const { error: delErr } = await supabase
    .from('order_items')
    .delete()
    .eq('order_id', supabaseId)
  if (delErr) throw delErr

  if (order.items?.length > 0) {
    const rows = order.items.map(item => ({
      id:         crypto.randomUUID(),                          // toujours un UUID frais
      order_id:   supabaseId,
      product_id: isUUID(item.productId) ? item.productId : null, // Webflow IDs non-UUID → null
      label:      item.label || '(sans nom)',
      size:       item.size       ?? null,
      qty:        Math.round(Number(item.qty)) || 1,           // garantit un entier
      unit_price: item.unitPrice  ?? null,
    }))
    const { error: itemsErr } = await supabase.from('order_items').insert(rows)
    if (itemsErr) throw itemsErr
  }
}

export async function upsertOrders(orders) {
  await Promise.all(orders.map(upsertOrder))
}

export async function deleteOrder(id) {
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', id)
  if (error) throw error
}
