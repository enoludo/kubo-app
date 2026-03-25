// ─── Module Commandes — Shell principal ───────────────────────────────────────
import { useState } from 'react'
import OrdersHeader         from './OrdersHeader'
import OrdersCalendar       from './OrdersCalendar'
import OrderDayModal        from './OrderDayModal'
import SaturdayChoiceModal  from './SaturdayChoiceModal'
import NewOrderModal        from './NewOrderModal'
import BrunchModal          from './BrunchModal'
import OrderDetailModal     from './OrderDetailModal'
import { dateToStr }        from '../../utils/date'
import './orders-tokens.css'
import './OrdersApp.css'

export default function OrdersApp({ ordersCtx, productsCtx, showToast }) {
  const now = new Date()
  const [year,  setYear]  = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  // ── États modales ──────────────────────────────────────────────────────────

  // Modal "commandes du jour" : { date: Date } | null
  const [dayModal, setDayModal] = useState(null)

  // Mini-modal de choix samedi vide : { date: Date } | null
  const [satChoiceModal, setSatChoiceModal] = useState(null)

  // Modal "nouvelle commande boutique" : { date: string, channel: string } | null
  const [newOrderModal, setNewOrderModal] = useState(null)

  // Modal "nouveau brunch" : { date: string } | null
  const [brunchModal, setBrunchModal] = useState(null)

  // Modal "détail commande" : order | null
  const [detailOrder, setDetailOrder] = useState(null)

  // Modal "modifier commande" : order | null
  const [editOrder, setEditOrder] = useState(null)

  // ── Données live pour la modal du jour ────────────────────────────────────
  const dayModalOrders = dayModal
    ? ordersCtx.ordersForDate(dateToStr(dayModal.date))
    : []

  const monthOrders = ordersCtx.ordersForMonth(year, month)

  // ── Navigation mois ───────────────────────────────────────────────────────

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  // ── Handlers calendrier ───────────────────────────────────────────────────

  // Jour avec commandes → OrderDayModal
  function handleDayClick(date) {
    setDayModal({ date })
  }

  // Cellule vide non-samedi → NewOrderModal
  function handleAddOrder(date) {
    setNewOrderModal({ date: dateToStr(date), channel: 'boutique' })
  }

  // Cellule vide samedi → SaturdayChoiceModal
  function handleSaturdayClick(date) {
    setSatChoiceModal({ date })
  }

  // ── Handlers SaturdayChoiceModal ──────────────────────────────────────────

  function handleSatChoiceNewOrder() {
    setNewOrderModal({ date: dateToStr(satChoiceModal.date), channel: 'boutique' })
    setSatChoiceModal(null)
  }

  function handleSatChoiceBrunch() {
    setBrunchModal({ date: dateToStr(satChoiceModal.date) })
    setSatChoiceModal(null)
  }

  // ── Handlers OrderDayModal ────────────────────────────────────────────────

  function handleOpenNewOrder(date, channel) {
    setDayModal(null)
    setNewOrderModal({
      date:    dateToStr(date),
      channel: channel ?? 'boutique',
    })
  }

  function handleOpenDetail(order) {
    setDayModal(null)
    setDetailOrder(order)
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  function handleEditOrder(order) {
    setDayModal(null)
    setEditOrder(order)
  }

  function handleSaveOrder(data) {
    if (data.id) {
      ordersCtx.updateOrder(data.id, data)
      setEditOrder(null)
      showToast?.('Commande modifiée ✓', '#66DA9B')
    } else {
      ordersCtx.addOrder(data)
      setNewOrderModal(null)
      showToast?.('Commande ajoutée ✓', '#66DA9B')
    }
  }

  function handleSaveBrunch(data) {
    ordersCtx.addOrder(data)
    setBrunchModal(null)
    showToast?.('Brunch ajouté ✓', '#FFD866')
  }

  function handleDelete(id) {
    ordersCtx.deleteOrder(id)
    showToast?.('Commande supprimée', '#FF9594')
  }

  return (
    <div className="app">
      <OrdersHeader
        year={year}
        month={month}
        upcomingCount={ordersCtx.upcomingCount}
        onPrev={prevMonth}
        onNext={nextMonth}
        onNewOrder={() => setNewOrderModal({ date: dateToStr(new Date()), channel: 'boutique' })}
        webflowStatus={ordersCtx.webflowStatus}
        webflowError={ordersCtx.webflowError}
        onRetryWebflow={ordersCtx.retryWebflow}
        sheetsStatus={ordersCtx.sheetsStatus}
        sheetsError={ordersCtx.sheetsError}
        onSheetsConnect={ordersCtx.sheetsConnect}
        onSheetsRetry={ordersCtx.sheetsRetry}
      />
      <div className="app-body orders-body">
        <OrdersCalendar
          year={year}
          month={month}
          orders={monthOrders}
          onAddOrder={handleAddOrder}
          onDayClick={handleDayClick}
          onSaturdayClick={handleSaturdayClick}
        />
      </div>

      {/* Modal commandes du jour */}
      {dayModal && (
        <OrderDayModal
          date={dayModal.date}
          orders={dayModalOrders}
          onNewOrder={handleOpenNewOrder}
          onEdit={handleEditOrder}
          onDelete={handleDelete}
          onOpenDetail={handleOpenDetail}
          onClose={() => setDayModal(null)}
          getProduct={productsCtx?.getById}
        />
      )}

      {/* Mini-modal choix samedi */}
      {satChoiceModal && (
        <SaturdayChoiceModal
          date={satChoiceModal.date}
          onNewOrder={handleSatChoiceNewOrder}
          onNewBrunch={handleSatChoiceBrunch}
          onClose={() => setSatChoiceModal(null)}
        />
      )}

      {/* Modal nouvelle commande boutique */}
      {newOrderModal && (
        <NewOrderModal
          initialDate={newOrderModal.date}
          initialChannel={newOrderModal.channel}
          onSave={handleSaveOrder}
          onCancel={() => setNewOrderModal(null)}
        />
      )}

      {/* Modal nouveau brunch */}
      {brunchModal && (
        <BrunchModal
          initialDate={brunchModal.date}
          onSave={handleSaveBrunch}
          onCancel={() => setBrunchModal(null)}
        />
      )}

      {/* Modal modifier commande */}
      {editOrder && (
        <NewOrderModal
          initialOrder={editOrder}
          onSave={handleSaveOrder}
          onCancel={() => setEditOrder(null)}
        />
      )}

      {/* Modal détail commande */}
      {detailOrder && (
        <OrderDetailModal
          order={detailOrder}
          getProduct={productsCtx?.getById}
          onDelete={handleDelete}
          onClose={() => setDetailOrder(null)}
        />
      )}
    </div>
  )
}
