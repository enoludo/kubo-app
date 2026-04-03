// ─── Module Traçabilité — Shell principal ─────────────────────────────────────
import { useState }              from 'react'
import { useWeek }               from '../../hooks/useWeek'
import { useTraceability }       from './hooks/useTraceability'
import { CATEGORIES }            from '../../data/categories'
import TraceCalendar             from './components/TraceCalendar'
import TraceCellModal            from './components/TraceCellModal'
import TraceReceptionForm        from './components/TraceReceptionForm'
import TraceSupplierForm         from './components/TraceSupplierForm'
import '../../design-system/layout/ModuleLayout.css'
import '../../design-system/components/WeekGrid/WeekGrid.css'
import '../../design-system/components/DayCard/DayCard.css'
import './traceability-tokens.css'
import './TraceabilityApp.css'

function NavPrevIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12.728" height="12.728" fill="currentcolor" viewBox="0 0 12.728 12.728">
      <path d="M613.332,602.91h-2v-9h9v2h-7Z" transform="translate(-852.235 18.683) rotate(-45)" fill="#7e7e7e"/>
    </svg>
  )
}

function NavNextIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12.728" height="12.728" fill="currentcolor" viewBox="0 0 12.728 12.728">
      <path d="M8,9H-1V0H1V7H8Z" transform="translate(5.657 12.021) rotate(-135)" fill="#7e7e7e"/>
    </svg>
  )
}

export default function TraceabilityApp({ showToast }) {
  const week  = useWeek()
  const trCtx = useTraceability()

  // ── States modals ────────────────────────────────────────────────────────────
  // cellModal        : { supplier, dateStr, receptions }
  // receptionForm    : { supplier, dateStr, reception: null | existing }
  // supplierForm     : { supplier: null | existing }
  const [cellModal,     setCellModal]     = useState(null)
  const [receptionForm, setReceptionForm] = useState(null)
  const [supplierForm,  setSupplierForm]  = useState(null)

  const fmt   = d => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  const range = `${fmt(week.dates[0])} – ${fmt(week.dates[6])}`

  // ── Handlers cellule ─────────────────────────────────────────────────────────

  function handleCellClick(supplier, dateStr, receptions) {
    if (receptions.length === 0) {
      // Cellule vide → ouvre directement le formulaire de création
      setReceptionForm({ supplier, dateStr, reception: null })
    } else {
      setCellModal({ supplier, dateStr, receptions })
    }
  }

  function handleAddReception() {
    if (!cellModal) return
    setCellModal(null)
    setReceptionForm({ supplier: cellModal.supplier, dateStr: cellModal.dateStr, reception: null })
  }

  function handleEditReception(rec) {
    if (!cellModal) return
    const supplier = trCtx.allSuppliers.find(s => s.id === rec.supplierId)
    setCellModal(null)
    setReceptionForm({ supplier, dateStr: rec.date, reception: rec })
  }

  function handleSaveReception(data) {
    if (receptionForm.reception) {
      trCtx.updateReception(receptionForm.reception.id, data)
      showToast?.('Réception modifiée ✓', 'var(--color-success)')
    } else {
      trCtx.addReception(data)
      showToast?.('Réception enregistrée ✓', 'var(--color-success)')
    }
    setReceptionForm(null)
  }

  function handleDeleteReception(id) {
    trCtx.deleteReception(id)
    showToast?.('Réception supprimée', 'var(--color-danger)')
    setReceptionForm(null)
  }

  // ── Handlers fournisseur ──────────────────────────────────────────────────────

  function handleSaveSupplier(data) {
    if (supplierForm.supplier) {
      trCtx.updateSupplier(supplierForm.supplier.id, data)
      showToast?.('Fournisseur modifié ✓', 'var(--color-success)')
    } else {
      trCtx.addSupplier(data)
      showToast?.('Fournisseur ajouté ✓', 'var(--color-success)')
    }
    setSupplierForm(null)
  }

  function handleDeleteSupplier(id) {
    trCtx.deleteSupplier(id)
    showToast?.('Fournisseur supprimé', 'var(--color-danger)')
    setSupplierForm(null)
  }

  return (
    <div className="app">

      <header className="header">
        <div className="header-nav-box">

          <div className="header-nav-left" />

          {/* Centre — navigation semaine */}
          <div className="header-nav-center">
            <button className="nav-btn" onClick={week.prev} aria-label="Semaine précédente">
              <NavPrevIcon />
            </button>
            <button className="week-label week-label--btn" onClick={week.today} title="Revenir à aujourd'hui">
              {range}
            </button>
            <button className="nav-btn" onClick={week.next} aria-label="Semaine suivante">
              <NavNextIcon />
            </button>
          </div>

          <div className="header-nav-right" />

        </div>
      </header>

      {/* Corps */}
      <div className="app-body">
        <TraceCalendar
          weekDates={week.dates}
          suppliers={trCtx.suppliers}
          categories={CATEGORIES}
          getReceptionsForDay={trCtx.getReceptionsForDay}
          onCellClick={handleCellClick}
          onSupplierClick={supplier => setSupplierForm({ supplier })}
          onAddSupplier={() => setSupplierForm({ supplier: null })}
        />
      </div>

      {/* Modal liste réceptions du jour */}
      {cellModal && (
        <TraceCellModal
          supplier={cellModal.supplier}
          dateStr={cellModal.dateStr}
          receptions={cellModal.receptions}
          onAddReception={handleAddReception}
          onEditReception={handleEditReception}
          onClose={() => setCellModal(null)}
        />
      )}

      {/* Formulaire réception */}
      {receptionForm && (
        <TraceReceptionForm
          supplier={receptionForm.supplier}
          dateStr={receptionForm.dateStr}
          reception={receptionForm.reception}
          onSave={handleSaveReception}
          onDelete={handleDeleteReception}
          onClose={() => setReceptionForm(null)}
        />
      )}

      {/* Formulaire fournisseur */}
      {supplierForm !== null && (
        <TraceSupplierForm
          supplier={supplierForm.supplier ?? null}
          onSave={handleSaveSupplier}
          onDelete={handleDeleteSupplier}
          onClose={() => setSupplierForm(null)}
        />
      )}

    </div>
  )
}
