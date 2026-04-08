// ─── Module Nettoyage — Shell principal ───────────────────────────────────────
import { useState, useRef }   from 'react'
import { useWeek }            from '../../hooks/useWeek'
import { useCleaning }        from './hooks/useCleaning'
import CleaningCalendar       from './components/CleaningCalendar'
import CleaningTaskModal       from './components/CleaningTaskModal'
import CleaningZoneDetailModal from './components/CleaningZoneDetailModal'
import CleaningZoneForm        from './components/CleaningZoneForm'
import Dropdown               from '../../design-system/components/Dropdown/Dropdown'
import { PdfIcon }            from '../../components/Icons'
import { generateCleaningPdf } from './utils/exportCleaningPdf'
import '../../design-system/layout/ModuleLayout.css'
import '../../design-system/components/WeekGrid/WeekGrid.css'
import '../../design-system/components/DayCard/DayCard.css'
import './cleaning-tokens.css'
import './CleaningApp.css'

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

export default function CleaningApp({ showToast }) {
  const week       = useWeek()
  const cleanCtx   = useCleaning()
  const menuBtnRef = useRef(null)

  const [menuOpen,       setMenuOpen]       = useState(false)
  const [pdfLoading,     setPdfLoading]     = useState(false)
  const [taskModal,       setTaskModal]       = useState(null)
  const [zoneDetailModal, setZoneDetailModal] = useState(null)
  const [zoneFormModal,   setZoneFormModal]   = useState(null)

  const fmt   = d => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  const range = `${fmt(week.dates[0])} – ${fmt(week.dates[6])}`

  function action(fn) { setMenuOpen(false); fn() }

  async function handleExportPdf() {
    setPdfLoading(true)
    try {
      await generateCleaningPdf(
        cleanCtx.tasks,
        cleanCtx.records,
        week.dates.map(d => {
          const y = d.getFullYear()
          const m = String(d.getMonth() + 1).padStart(2, '0')
          const day = String(d.getDate()).padStart(2, '0')
          return `${y}-${m}-${day}`
        }),
        week.dates[0],
      )
    } finally {
      setPdfLoading(false)
    }
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

          {/* Droite — menu actions */}
          <div className="header-nav-right">
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
          <button
            onClick={() => action(handleExportPdf)}
            disabled={pdfLoading}
          >
            <PdfIcon size={15} /><span>{pdfLoading ? 'Génération…' : 'Exporter PDF'}</span>
          </button>
        </Dropdown>
      </header>

      {/* Corps */}
      <div className="app-body">
        <CleaningCalendar
          weekDates={week.dates}
          zones={cleanCtx.zones}
          getTasksForDay={cleanCtx.getTasksForDay}
          getZoneStats={(zone, dates) => cleanCtx.getZoneStats(zone, dates)}
          getZoneActiveCount={cleanCtx.getZoneActiveCount}
          onCellClick={(zone, dateStr, tasks) => setTaskModal({ zone, dateStr, tasks })}
          onZoneClick={zone => setZoneDetailModal({ zone })}
          onAddZone={() => setZoneFormModal({})}
        />
      </div>

      {/* Modal validation tâches */}
      {taskModal && (
        <CleaningTaskModal
          zone={taskModal.zone}
          dateStr={taskModal.dateStr}
          tasks={taskModal.tasks}
          getRecordForDay={cleanCtx.getRecordForDay}
          markDone={cleanCtx.markDone}
          unmarkDone={cleanCtx.unmarkDone}
          onClose={() => setTaskModal(null)}
        />
      )}

      {/* Modal détail zone */}
      {zoneDetailModal && (
        <CleaningZoneDetailModal
          zone={zoneDetailModal.zone}
          tasks={cleanCtx.tasks.filter(t => t.zone === zoneDetailModal.zone.id)}
          onEdit={() => {
            setZoneDetailModal(null)
            setZoneFormModal({ zone: zoneDetailModal.zone })
          }}
          onClose={() => setZoneDetailModal(null)}
        />
      )}

      {/* Modal création / édition zone */}
      {zoneFormModal !== null && (
        <CleaningZoneForm
          zone={zoneFormModal.zone ?? null}
          tasks={zoneFormModal.zone ? cleanCtx.tasks.filter(t => t.zone === zoneFormModal.zone.id) : []}
          onSave={(zoneData, tasksData) => {
            if (zoneFormModal.zone) {
              cleanCtx.updateZone(zoneFormModal.zone.id, zoneData, tasksData)
              showToast?.('Zone modifiée ✓', 'var(--color-success)')
            } else {
              cleanCtx.addZone(zoneData, tasksData)
              showToast?.('Zone créée ✓', 'var(--color-success)')
            }
            setZoneFormModal(null)
          }}
          onDelete={id => {
            cleanCtx.deleteZone(id)
            showToast?.('Zone supprimée', 'var(--color-danger)')
            setZoneFormModal(null)
          }}
          onClose={() => setZoneFormModal(null)}
        />
      )}

    </div>
  )
}
