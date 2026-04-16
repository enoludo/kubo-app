// ─── Module Nettoyage — Shell principal ───────────────────────────────────────
import { useState, useRef }      from 'react'
import { useWeek }               from '../../hooks/useWeek'
import CleaningCalendar          from './components/CleaningCalendar'
import CleaningTaskModal          from './components/CleaningTaskModal'
import CleaningRoomDetailModal   from './components/CleaningRoomDetailModal'
import CleaningRoomForm          from './components/CleaningRoomForm'
import Dropdown                  from '../../design-system/components/Dropdown/Dropdown'
import { PdfIcon }               from '../../components/Icons'
import { generateCleaningPdf }   from './utils/exportCleaningPdf'
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
      <path d="M3.1,22.566a3.086,3.086,0,0,1-2.9-2.75c-.107-1-.2-3.409-.2-5.255s.091-4.253.2-5.255A3.088,3.088,0,0,1,3.1,6.554c.865-.064,2.387-.112,3.5-.148l.626-.021a.75.75,0,0,1,.051,1.5l-.629.02c-1.1.035-2.6.084-3.433.145A1.588,1.588,0,0,0,1.689,9.464c-.1.943-.189,3.325-.189,5.1s.088,4.153.189,5.1A1.586,1.586,0,0,0,3.214,21.07c1.436.11,3.91.24,7.536.24s6.1-.13,7.536-.24a1.587,1.587,0,0,0,1.525-1.414c.1-.943.189-3.325.189-5.1s-.088-4.152-.189-5.095A1.589,1.589,0,0,0,18.284,8.05c-.829-.061-2.33-.11-3.426-.144l-.634-.021a.75.75,0,1,1,.051-1.5l.63.021c1.11.035,2.629.084,3.49.148A3.089,3.089,0,0,1,21.3,9.305c.107,1,.2,3.409.2,5.254s-.091,4.253-.2,5.256a3.086,3.086,0,0,1-2.9,2.75c-1.462.112-3.976.245-7.65.245S4.562,22.677,3.1,22.566ZM10,10.881V2.872L8.094,4.778a.75.75,0,1,1-1.06-1.061L10.22.53a.751.751,0,0,1,1.061,0l3.187,3.187a.75.75,0,0,1-1.061,1.061L11.5,2.871v8.01a.75.75,0,0,1-1.5,0Z" transform="translate(0 -0.311)"/>
    </svg>
  )
}

export default function CleaningApp({ showToast, cleanCtx }) {
  const week      = useWeek()
  const menuBtnRef = useRef(null)

  const [menuOpen,        setMenuOpen]        = useState(false)
  const [pdfLoading,      setPdfLoading]      = useState(false)
  const [taskModal,        setTaskModal]        = useState(null) // { room, roomId, dateStr, tasks }
  const [roomDetailModal,  setRoomDetailModal]  = useState(null) // { room }
  const [roomFormModal,    setRoomFormModal]    = useState(null) // {} | { room }

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
          const y   = d.getFullYear()
          const m   = String(d.getMonth() + 1).padStart(2, '0')
          const day = String(d.getDate()).padStart(2, '0')
          return `${y}-${m}-${day}`
        }),
        week.dates[0],
      )
    } finally {
      setPdfLoading(false)
    }
  }

  // Données filtrées pour la room active dans les modals
  function zonesForRoom(roomId) {
    return cleanCtx.zones.filter(z => z.roomId === roomId)
  }

  function subzonesForRoom(roomId) {
    const zoneIds = zonesForRoom(roomId).map(z => z.id)
    return cleanCtx.subzones.filter(s => zoneIds.includes(s.zoneId))
  }

  function tasksForRoom(roomId) {
    const zoneIds    = zonesForRoom(roomId).map(z => z.id)
    const subzoneIds = subzonesForRoom(roomId).map(s => s.id)
    return cleanCtx.tasks.filter(t =>
      zoneIds.includes(t.zoneId) || subzoneIds.includes(t.subzoneId)
    )
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
          <button onClick={() => action(handleExportPdf)} disabled={pdfLoading}>
            <PdfIcon size={15} /><span>{pdfLoading ? 'Génération…' : 'Exporter PDF'}</span>
          </button>
        </Dropdown>
      </header>

      {/* Corps */}
      <div className="app-body">
        <CleaningCalendar
          weekDates={week.dates}
          rooms={cleanCtx.rooms}
          zones={cleanCtx.zones}
          getTasksForRoomDay={cleanCtx.getTasksForRoomDay}
          getRoomStats={(roomId, dates) => cleanCtx.getRoomStats(roomId, dates)}
          getRoomActiveTaskCount={cleanCtx.getRoomActiveTaskCount}
          onCellClick={(room, roomId, dateStr, tasks) => setTaskModal({ room, roomId, dateStr, tasks })}
          onRoomClick={room => setRoomDetailModal({ room })}
          onAddRoom={() => setRoomFormModal({})}
        />
      </div>

      {/* Modal validation tâches */}
      {taskModal && (
        <CleaningTaskModal
          room={taskModal.room}
          dateStr={taskModal.dateStr}
          tasks={taskModal.tasks}
          zones={zonesForRoom(taskModal.room.id)}
          subzones={subzonesForRoom(taskModal.room.id)}
          getRecordForDay={cleanCtx.getRecordForDay}
          markDone={cleanCtx.markDone}
          unmarkDone={cleanCtx.unmarkDone}
          onClose={() => setTaskModal(null)}
        />
      )}

      {/* Modal détail pièce */}
      {roomDetailModal && (
        <CleaningRoomDetailModal
          room={roomDetailModal.room}
          zones={zonesForRoom(roomDetailModal.room.id)}
          subzones={subzonesForRoom(roomDetailModal.room.id)}
          tasks={tasksForRoom(roomDetailModal.room.id)}
          onEdit={() => {
            setRoomDetailModal(null)
            setRoomFormModal({ room: roomDetailModal.room })
          }}
          onClose={() => setRoomDetailModal(null)}
        />
      )}

      {/* Modal création / édition pièce */}
      {roomFormModal !== null && (
        <CleaningRoomForm
          room={roomFormModal.room ?? null}
          zones={roomFormModal.room ? zonesForRoom(roomFormModal.room.id) : []}
          subzones={roomFormModal.room ? subzonesForRoom(roomFormModal.room.id) : []}
          tasks={roomFormModal.room ? tasksForRoom(roomFormModal.room.id) : []}
          onSave={(roomData, zonesData) => {
            cleanCtx.saveRoomFull(roomFormModal.room?.id ?? null, roomData, zonesData)
            showToast?.(roomFormModal.room ? 'Pièce modifiée ✓' : 'Pièce créée ✓', 'var(--color-success)')
            setRoomFormModal(null)
          }}
          onDelete={id => {
            cleanCtx.deleteRoom(id)
            showToast?.('Pièce supprimée', 'var(--color-danger)')
            setRoomFormModal(null)
          }}
          onClose={() => setRoomFormModal(null)}
        />
      )}

    </div>
  )
}
