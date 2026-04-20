// ─── Module Traçabilité — Shell principal ─────────────────────────────────────
import { useState, useRef, useMemo } from 'react'
import { useWeek }               from '../../hooks/useWeek'
import { useGoogleExport }       from '../../hooks/useGoogleExport'
import { useDrivePhotos }        from './hooks/useDrivePhotos'
import TraceCalendar             from './components/TraceCalendar'
import TraceListView             from './components/TraceListView'
import TraceGalleryView          from './components/TraceGalleryView'
import TraceCellModal            from './components/TraceCellModal'
import TraceDeliveryForm         from './components/TraceDeliveryForm'
import TraceSupplierForm         from './components/TraceSupplierForm'
import Dropdown                  from '../../design-system/components/Dropdown/Dropdown'
import { supabase }              from '../../services/supabase'
import '../../design-system/layout/ModuleLayout.css'
import '../../design-system/components/WeekGrid/WeekGrid.css'
import '../../design-system/components/DayCard/DayCard.css'
import './traceability-tokens.css'
import './TraceabilityApp.css'

const SHEET_URL = `https://docs.google.com/spreadsheets/d/${import.meta.env.VITE_SHEET_ID_TRACEABILITY ?? ''}/edit`
const DRIVE_URL = 'https://drive.google.com/drive/search?q=Kubo-App'

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

function MenuIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="21.5" height="22.5" viewBox="0 0 21.5 22.5" fill='currentcolor'>
  <path id="Union_14" data-name="Union 14" d="M3.1,22.566a3.086,3.086,0,0,1-2.9-2.75c-.107-1-.2-3.409-.2-5.255s.091-4.253.2-5.255A3.088,3.088,0,0,1,3.1,6.554c.865-.064,2.387-.112,3.5-.148l.626-.021a.75.75,0,0,1,.051,1.5l-.629.02c-1.1.035-2.6.084-3.433.145A1.588,1.588,0,0,0,1.689,9.464c-.1.943-.189,3.325-.189,5.1s.088,4.153.189,5.1A1.586,1.586,0,0,0,3.214,21.07c1.436.11,3.91.24,7.536.24s6.1-.13,7.536-.24a1.587,1.587,0,0,0,1.525-1.414c.1-.943.189-3.325.189-5.1s-.088-4.152-.189-5.095A1.589,1.589,0,0,0,18.284,8.05c-.829-.061-2.33-.11-3.426-.144l-.634-.021a.75.75,0,1,1,.051-1.5l.63.021c1.11.035,2.629.084,3.49.148A3.089,3.089,0,0,1,21.3,9.305c.107,1,.2,3.409.2,5.254s-.091,4.253-.2,5.256a3.086,3.086,0,0,1-2.9,2.75c-1.462.112-3.976.245-7.65.245S4.562,22.677,3.1,22.566ZM10,10.881V2.872L8.094,4.778a.75.75,0,1,1-1.06-1.061L10.22.53a.751.751,0,0,1,1.061,0l3.187,3.187a.75.75,0,0,1-1.061,1.061L11.5,2.871v8.01a.75.75,0,0,1-1.5,0Z" transform="translate(0 -0.311)"/>
</svg>

  )
}

const VIEWS = [
  { id: 'calendar', label: (
    <svg xmlns="http://www.w3.org/2000/svg" width="22.5" height="22.5" viewBox="0 0 22.5 22.5" fill='currentcolor'>
  <path id="Union_16" data-name="Union 16" d="M3.176,22.045A3.164,3.164,0,0,1,.437,19.336,48.625,48.625,0,0,1,0,12.5,48.6,48.6,0,0,1,.437,5.665,3.163,3.163,0,0,1,3.176,2.956c.314-.041.933-.076,1.533-.11.4-.023.779-.043.971-.062A.748.748,0,0,1,6,2.823V.75a.75.75,0,0,1,1.5,0V2.58a.749.749,0,0,1,.234-.043C8.879,2.512,10.079,2.5,11.3,2.5c1.151,0,2.318.013,3.468.038A.749.749,0,0,1,15,2.58V.75a.75.75,0,0,1,1.5,0V2.823a.748.748,0,0,1,.32-.039c.192.019.571.04.971.062.6.033,1.219.068,1.532.11a3.163,3.163,0,0,1,2.74,2.709A48.6,48.6,0,0,1,22.5,12.5a48.626,48.626,0,0,1-.437,6.835,3.162,3.162,0,0,1-2.739,2.708,61.978,61.978,0,0,1-8.074.456A62.178,62.178,0,0,1,3.176,22.045ZM1.5,12.5a47.321,47.321,0,0,0,.421,6.622,1.659,1.659,0,0,0,1.453,1.435A60.555,60.555,0,0,0,11.25,21a60.384,60.384,0,0,0,7.876-.443,1.657,1.657,0,0,0,1.453-1.435A47.321,47.321,0,0,0,21,12.5c0-.916-.021-1.758-.055-2.526A.75.75,0,0,1,20.75,10h-19a.75.75,0,0,1-.194-.025C1.521,10.742,1.5,11.584,1.5,12.5Zm19.25-4a.756.756,0,0,1,.107.008c-.081-1.088-.185-1.968-.279-2.63a1.657,1.657,0,0,0-1.454-1.435c-.256-.034-.9-.07-1.417-.1-.434-.024-.808-.045-1.031-.066a.752.752,0,0,1-.177-.039V5.75a.75.75,0,1,1-1.5,0V3.994a.748.748,0,0,1-.25.043h-.016C13.579,4.012,12.406,4,11.25,4c-1.193,0-2.364.013-3.484.037A.748.748,0,0,1,7.5,3.994V5.75a.75.75,0,0,1-1.5,0V4.239a.752.752,0,0,1-.177.039c-.222.021-.6.041-1.03.066-.517.029-1.162.065-1.418.1A1.657,1.657,0,0,0,1.922,5.877c-.095.662-.2,1.543-.279,2.63A.755.755,0,0,1,1.75,8.5Z"/>
</svg>

  )},
  { id: 'list', label: (
    <svg xmlns="http://www.w3.org/2000/svg" width="22.5" height="22.5" viewBox="0 0 22.5 22.5" fill='currentcolor'>
  <path id="Union_17" data-name="Union 17" d="M3.317,22.228A3.3,3.3,0,0,1,.272,19.183C.148,17.653,0,15.036,0,11.25s.148-6.4.272-7.933A3.3,3.3,0,0,1,3.317.272C4.846.148,7.464,0,11.25,0s6.4.148,7.933.272a3.3,3.3,0,0,1,3.046,3.046c.124,1.529.272,4.146.272,7.933s-.148,6.4-.272,7.933a3.3,3.3,0,0,1-3.046,3.046c-1.529.124-4.146.272-7.933.272S4.846,22.352,3.317,22.228ZM11.25,21c3.737,0,6.31-.145,7.811-.266a1.8,1.8,0,0,0,1.672-1.673c.068-.843.144-2.024.2-3.56H7.5v5.447C8.586,20.979,9.835,21,11.25,21ZM1.767,19.061A1.8,1.8,0,0,0,3.44,20.733c.65.053,1.5.11,2.56.157V15.5H1.57C1.623,17.036,1.7,18.218,1.767,19.061ZM20.972,14Q21,12.748,21,11.25T20.972,8.5H7.5V14ZM6,14V8.5H1.528Q1.5,9.752,1.5,11.25T1.528,14ZM20.93,7c-.053-1.536-.129-2.718-.2-3.561A1.8,1.8,0,0,0,19.06,1.767c-1.5-.122-4.073-.266-7.81-.266-1.415,0-2.664.021-3.75.053V7ZM6,7V1.609c-1.06.048-1.911.1-2.561.157A1.8,1.8,0,0,0,1.767,3.44C1.7,4.283,1.623,5.464,1.57,7Z"/>
</svg>

  )},
  { id: 'gallery', label: (
    <svg xmlns="http://www.w3.org/2000/svg" width="22.5" height="22.5" viewBox="0 0 22.5 22.5" fill='currentcolor'>
  <path id="Union_18" data-name="Union 18" d="M7.72,22.321A3.259,3.259,0,0,1,4.679,19.28C4.56,17.632,4.5,15.687,4.5,13.5s.06-4.122.179-5.78A3.259,3.259,0,0,1,7.72,4.679C9.368,4.56,11.313,4.5,13.5,4.5s4.122.06,5.78.179a3.258,3.258,0,0,1,3.041,3.042c.119,1.657.179,3.6.179,5.779,0,1.428-.026,2.756-.077,3.969,0,.005,0,.011,0,.016q-.04.945-.1,1.8a3.259,3.259,0,0,1-3.041,3.041c-1.658.119-3.6.179-5.78.179S9.378,22.44,7.72,22.321ZM6.175,19.172a1.75,1.75,0,0,0,1.652,1.653C9.45,20.941,11.358,21,13.5,21s4.05-.059,5.673-.175a1.75,1.75,0,0,0,1.652-1.651q.048-.676.083-1.417c-.85-.791-1.595-1.447-2.215-1.954a1.118,1.118,0,0,0-1.381-.1,23.965,23.965,0,0,0-2.24,1.735.749.749,0,0,1-1.006-.027c-1.232-1.178-2.283-2.125-3.126-2.814a1.118,1.118,0,0,0-1.381-.1A28.915,28.915,0,0,0,6.074,17.34C6.1,17.991,6.134,18.605,6.175,19.172Zm5.716-5.739c.758.62,1.672,1.435,2.724,2.427a22.969,22.969,0,0,1,1.867-1.408,2.617,2.617,0,0,1,3.163.19c.4.325.843.708,1.331,1.145Q21,14.694,21,13.5c0-2.142-.059-4.05-.175-5.673a1.75,1.75,0,0,0-1.652-1.652C17.55,6.059,15.642,6,13.5,6c-2.121,0-4.082.06-5.672.175A1.75,1.75,0,0,0,6.175,7.826C6.059,9.45,6,11.358,6,13.5c0,.64.005,1.265.016,1.87a26.715,26.715,0,0,1,2.712-2.127,2.594,2.594,0,0,1,1.444-.444A2.709,2.709,0,0,1,11.891,13.432ZM2.553,17.71A3.208,3.208,0,0,1,.18,14.8C.06,13.132,0,11.179,0,9S.06,4.874.178,3.22A3.259,3.259,0,0,1,3.22.179C4.877.06,6.822,0,9,0s4.141.06,5.8.18A3.208,3.208,0,0,1,17.71,2.552a.75.75,0,1,1-1.447.4A1.723,1.723,0,0,0,14.7,1.677C13.069,1.56,11.153,1.5,9,1.5s-4.051.058-5.673.175A1.749,1.749,0,0,0,1.675,3.327C1.559,4.945,1.5,6.854,1.5,9s.059,4.06.176,5.7a1.724,1.724,0,0,0,1.271,1.567.75.75,0,0,1-.394,1.447ZM14.5,10.25a2.25,2.25,0,1,1,2.25,2.25A2.253,2.253,0,0,1,14.5,10.25Zm1.5,0a.75.75,0,1,0,.75-.75A.751.751,0,0,0,16,10.25Z"/>
</svg>

  )},
]


export default function TraceabilityApp({ showToast, trCtx }) {
  const week        = useWeek()
  const { photos: drivePhotos, sync: syncDrivePhotos } = useDrivePhotos()
  const photoInputRef  = useRef(null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [syncing,        setSyncing]        = useState(false)
  const menuBtnRef  = useRef(null)

  const productSuggestions = useMemo(() => {
    const names = [...new Set(trCtx.deliveries.map(d => d.productName).filter(Boolean))]
    return names.sort((a, b) => a.localeCompare(b, 'fr'))
  }, [trCtx.deliveries])

  const { exporting: sheetsExporting, runExport } = useGoogleExport({ onToast: showToast })

  const [view,           setView]           = useState('calendar')
  const [menuOpen,       setMenuOpen]       = useState(false)
  const [cellModal,      setCellModal]      = useState(null)   // { supplier, dateStr, deliveries }
  const [deliveryForm,   setDeliveryForm]   = useState(null)   // { supplier, dateStr, delivery }
  const [supplierForm,   setSupplierForm]   = useState(null)
  const [search,         setSearch]         = useState('')
  const [filterSupplier, setFilterSupplier] = useState('')

  const filteredDeliveries = useMemo(() => {
    const q = search.trim().toLowerCase()
    return trCtx.deliveries.filter(d => {
      if (q && !d.productName?.toLowerCase().includes(q)) return false
      if (filterSupplier && d.supplierId !== filterSupplier) return false
      return true
    })
  }, [trCtx.deliveries, search, filterSupplier])

  const fmt   = d => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  const range = `${fmt(week.dates[0])} – ${fmt(week.dates[6])}`

  // ── Handlers cellule ─────────────────────────────────────────────────────────

  function handleCellClick(supplier, dateStr, deliveries) {
    if (deliveries.length === 0) {
      setDeliveryForm({ supplier, dateStr, delivery: null })
    } else {
      setCellModal({ supplier, dateStr, deliveries })
    }
  }

  function handleAddDelivery() {
    if (!cellModal) return
    setCellModal(null)
    setDeliveryForm({ supplier: cellModal.supplier, dateStr: cellModal.dateStr, delivery: null })
  }

  function handleEditDelivery(delivery) {
    const supplier = trCtx.allSuppliers.find(s => s.id === delivery.supplierId)
    setCellModal(null)
    setDeliveryForm({ supplier, dateStr: delivery.date, delivery })
  }

  function handleSaveDelivery(data) {
    if (deliveryForm.delivery) {
      trCtx.updateDelivery(deliveryForm.delivery.id, data)
      showToast?.('Produit modifié ✓', 'var(--color-success)')
    } else {
      trCtx.addDelivery(data)
      showToast?.('Produit enregistré ✓', 'var(--color-success)')
    }
    setDeliveryForm(null)
  }

  function handleDeleteDelivery(id) {
    trCtx.deleteDelivery(id)
    showToast?.('Produit supprimé', 'var(--color-danger)')
    setDeliveryForm(null)
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

  // ── Handler upload photo directe ─────────────────────────────────────────────

  async function handleAddPhotoFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setPhotoUploading(true)
    try {
      const today = new Date().toISOString().slice(0, 10)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('dateStr', today)
      formData.append('supplierName', '')
      formData.append('productName', '')
      formData.append('categoryLabel', '')
      const res = await fetch('/api/upload-photo', { method: 'POST', body: formData })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Erreur upload')
      await syncDrivePhotos()
      showToast?.('Photo ajoutée ✓', 'var(--color-success)')
    } catch (err) {
      showToast?.(`Échec upload : ${err.message}`, 'var(--color-danger)')
    } finally {
      setPhotoUploading(false)
    }
  }

  // ── Synchronisation Drive → Supabase (Edge Function) ────────────────────────

  async function handleSyncDrive() {
    setSyncing(true)
    try {
      const { data, error } = await supabase.functions.invoke('sync-drive-photos')
      if (error) throw error
      const msg = data?.message ?? 'Synchronisation terminée'
      showToast?.(msg, data?.synced > 0 ? 'var(--color-success)' : null)
      if (data?.synced > 0) await syncDrivePhotos()
    } catch (err) {
      showToast?.(`Erreur sync : ${err.message}`, 'var(--color-danger)')
    } finally {
      setSyncing(false)
    }
  }


  // ── Handler association photo Drive ──────────────────────────────────────────

  function handleAssociatePhoto(deliveryId, photoUrl) {
    trCtx.updateDelivery(deliveryId, { photo_url: photoUrl })
    showToast?.('Photo associée ✓', 'var(--color-success)')
  }

  return (
    <div className="app">

      <header className="header">
        <div className="header-nav-box">

          {/* Gauche — toggle vue */}
          <div className="header-nav-left">
            <div className="tr-view-toggle">
              {VIEWS.map(v => (
                <button
                  key={v.id}
                  className={`tr-view-toggle-btn${view === v.id ? ' tr-view-toggle-btn--active' : ''}`}
                  onClick={() => setView(v.id)}
                  aria-label={v.id}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Centre — navigation semaine (calendrier) ou filtres (liste/photos) */}
          <div className="header-nav-center">
            {view === 'calendar' && (
              <>
                <button className="nav-btn" onClick={week.prev} aria-label="Semaine précédente">
                  <NavPrevIcon />
                </button>
                <button className="week-label week-label--btn" onClick={week.today} title="Revenir à aujourd'hui">
                  {range}
                </button>
                <button className="nav-btn" onClick={week.next} aria-label="Semaine suivante">
                  <NavNextIcon />
                </button>
              </>
            )}
            {(view === 'list' || view === 'gallery') && (
              <div className="tr-filter-center">
                <input
                  className="tr-search-input field-input"
                  type="text"
                  placeholder="Rechercher un produit…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <select
                  className="tr-filter-select field-input"
                  value={filterSupplier}
                  onChange={e => setFilterSupplier(e.target.value)}
                >
                  <option value="">Tous les fournisseurs</option>
                  {trCtx.suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Droite — menu actions */}
          <div className="header-nav-right">
            {view === 'gallery' && (
              <>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*,.heic,.heif"
                  capture="environment"
                  style={{ display: 'none' }}
                  onChange={handleAddPhotoFile}
                />
                <button
                  className="nav-btn"
                  onClick={syncDrivePhotos}
                  aria-label="Rafraîchir les photos"
                  title="Rafraîchir les photos depuis Drive"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10"/>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                  </svg>
                </button>
                <button
                  className="add-trigger add-trigger--labeled"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={photoUploading}
                  aria-label="Ajouter une photo"
                >
                  {photoUploading ? '…' : '+ Photo'}
                </button>
              </>
            )}
            <button
              ref={menuBtnRef}
              className={`header-menu-btn${menuOpen ? ' active' : ''}`}
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Menu actions"
            >
              <MenuIcon />
            </button>
          </div>

        </div>

        <Dropdown
          triggerRef={menuBtnRef}
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          align="right"
          className="header-menu-dropdown"
        >
          <a href={SHEET_URL} target="_blank" rel="noopener noreferrer"
            className="tr-menu-link" onClick={() => setMenuOpen(false)}>
            <span>Voir Google Sheet</span>
          </a>
          <button onClick={() => { setMenuOpen(false); runExport('traceability') }} disabled={sheetsExporting}>
            <span>{sheetsExporting ? 'Export en cours…' : 'Exporter vers Sheets'}</span>
          </button>
          <a href={DRIVE_URL} target="_blank" rel="noopener noreferrer"
            className="tr-menu-link" onClick={() => setMenuOpen(false)}>
            <span>Voir Google Drive</span>
          </a>
          <button onClick={() => { setMenuOpen(false); showToast?.('Export PDF — bientôt disponible', 'var(--color-grey-500)') }}>
            <span>Exporter PDF</span>
          </button>
          <button onClick={() => { setMenuOpen(false); handleSyncDrive() }} disabled={syncing}>
            <span>{syncing ? 'Synchronisation…' : 'Synchroniser photos Drive'}</span>
          </button>
        </Dropdown>
      </header>

      {/* Corps */}
      <div className="app-body">
        {view === 'calendar' && (
          <TraceCalendar
            weekDates={week.dates}
            suppliers={trCtx.suppliers}
            getDeliveriesForDay={trCtx.getDeliveriesForDay}
            onCellClick={handleCellClick}
            onSupplierClick={supplier => setSupplierForm({ supplier })}
            onAddSupplier={() => setSupplierForm({ supplier: null })}
          />
        )}
        {view === 'list' && (
          <TraceListView
            deliveries={filteredDeliveries}
            suppliers={trCtx.allSuppliers}
            onEditDelivery={handleEditDelivery}
          />
        )}
        {view === 'gallery' && (
          <TraceGalleryView
            deliveries={filteredDeliveries}
            allDeliveries={trCtx.deliveries}
            suppliers={trCtx.allSuppliers}
            drivePhotos={drivePhotos}
            search={search}
            filterSupplier={filterSupplier}
            onAssociatePhoto={handleAssociatePhoto}
          />
        )}
      </div>

      {cellModal && (
        <TraceCellModal
          supplier={cellModal.supplier}
          dateStr={cellModal.dateStr}
          deliveries={cellModal.deliveries}
          onAddDelivery={handleAddDelivery}
          onEditDelivery={handleEditDelivery}
          onClose={() => setCellModal(null)}
        />
      )}

      {deliveryForm && (
        <TraceDeliveryForm
          supplier={deliveryForm.supplier}
          dateStr={deliveryForm.dateStr}
          delivery={deliveryForm.delivery}
          suggestions={productSuggestions}
          onSave={handleSaveDelivery}
          onDelete={handleDeleteDelivery}
          onClose={() => setDeliveryForm(null)}
        />
      )}

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
