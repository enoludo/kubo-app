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
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="17" viewBox="0 0 14.391 19.078" fill="currentColor"><g transform="translate(-2.18 0.164)"><path d="M14.648,18.914H4.1A1.924,1.924,0,0,1,2.18,16.992V7.617A1.924,1.924,0,0,1,4.1,5.7H5.273a.75.75,0,0,1,0,1.5H4.1a.422.422,0,0,0-.422.422v9.375a.422.422,0,0,0,.422.422H14.648a.422.422,0,0,0,.422-.422V7.617a.422.422,0,0,0-.422-.422H13.477a.75.75,0,0,1,0-1.5h1.172A1.924,1.924,0,0,1,16.57,7.617v9.375A1.924,1.924,0,0,1,14.648,18.914Z"/><path d="M9.375,9.539a.75.75,0,0,1-.75-.75V.586a.75.75,0,0,1,1.5,0v8.2A.75.75,0,0,1,9.375,9.539Z"/><path d="M12.3,4.266a.748.748,0,0,1-.53-.22l-2.4-2.4-2.4,2.4A.75.75,0,0,1,5.915,2.985L8.845.056a.75.75,0,0,1,1.061,0l2.93,2.93a.75.75,0,0,1-.53,1.28Z"/></g></svg>
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
