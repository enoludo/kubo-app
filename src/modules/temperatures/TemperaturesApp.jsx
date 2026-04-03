import { useState, useRef }  from 'react'
import { useWeek }           from '../../hooks/useWeek'
import { useTemperatures }   from './hooks/useTemperatures'
import { useTemperaturesGoogleSync } from './hooks/useTemperaturesGoogleSync'
import { generateTempPdf }   from './utils/exportTempPdf'
import TempCalendar          from './components/TempCalendar'
import TempModal             from './components/TempModal'
import TempEquipmentModal    from './components/TempEquipmentModal'
import Dropdown              from '../../design-system/components/Dropdown/Dropdown'
import { PdfIcon }           from '../../components/Icons'
import '../../design-system/layout/ModuleLayout.css'
import '../../design-system/components/WeekGrid/WeekGrid.css'
import '../../design-system/components/DayCard/DayCard.css'
import './temperatures-tokens.css'
import './TemperaturesApp.css'

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

function SheetsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <line x1="3"  y1="9"  x2="21" y2="9"/>
      <line x1="3"  y1="15" x2="21" y2="15"/>
      <line x1="9"  y1="3"  x2="9"  y2="21"/>
      <line x1="15" y1="3"  x2="15" y2="21"/>
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="17" viewBox="0 0 14.391 19.078" fill="currentColor"><g transform="translate(-2.18 0.164)"><path d="M14.648,18.914H4.1A1.924,1.924,0,0,1,2.18,16.992V7.617A1.924,1.924,0,0,1,4.1,5.7H5.273a.75.75,0,0,1,0,1.5H4.1a.422.422,0,0,0-.422.422v9.375a.422.422,0,0,0,.422.422H14.648a.422.422,0,0,0,.422-.422V7.617a.422.422,0,0,0-.422-.422H13.477a.75.75,0,0,1,0-1.5h1.172A1.924,1.924,0,0,1,16.57,7.617v9.375A1.924,1.924,0,0,1,14.648,18.914Z"></path><path d="M9.375,9.539a.75.75,0,0,1-.75-.75V.586a.75.75,0,0,1,1.5,0v8.2A.75.75,0,0,1,9.375,9.539Z"></path><path d="M12.3,4.266a.748.748,0,0,1-.53-.22l-2.4-2.4-2.4,2.4A.75.75,0,0,1,5.915,2.985L8.845.056a.75.75,0,0,1,1.061,0l2.93,2.93a.75.75,0,0,1-.53,1.28Z"></path></g></svg>
  )
}

export default function TemperaturesApp({ showToast }) {
  const week    = useWeek()
  const tempCtx = useTemperatures()
  const menuBtnRef = useRef(null)

  const [equipModal, setEquipModal] = useState(null)
  const [tempModal,  setTempModal]  = useState(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [menuOpen,   setMenuOpen]   = useState(false)

  // Google Sheets sync
  useTemperaturesGoogleSync({
    equipment:       tempCtx.equipment,
    readings:        tempCtx.readings,
    onPullEquipment: tempCtx.setEquipment,
    onPullReadings:  tempCtx.setReadings,
    onToast:         showToast,
  })

  const fmt    = d => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  const range  = `${fmt(week.dates[0])} – ${fmt(week.dates[6])}`
  const sheetId = import.meta.env.VITE_GOOGLE_SHEET_ID

  function action(fn) { setMenuOpen(false); fn() }

  async function handleExportPdf() {
    setPdfLoading(true)
    try {
      await generateTempPdf(
        tempCtx.activeEquipment,
        tempCtx.readings,
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

          {/* Gauche — vide, le bouton + Équipement est dans le tableau */}
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
          {sheetId && (
            <button onClick={() => action(() => window.open(`https://docs.google.com/spreadsheets/d/${sheetId}`, '_blank'))}>
              <SheetsIcon /><span>Voir Google Sheet</span>
            </button>
          )}
          <button
            onClick={() => action(handleExportPdf)}
            disabled={pdfLoading || tempCtx.activeEquipment.length === 0}
          >
            <PdfIcon size={15} /><span>{pdfLoading ? 'Génération…' : 'Exporter PDF'}</span>
          </button>
        </Dropdown>
      </header>

      {/* Corps */}
      <div className="app-body">
        <TempCalendar
          equipment={tempCtx.activeEquipment}
          readings={tempCtx.readings}
          weekDates={week.dates}
          onCellClick={(eq, date) => setTempModal({ equipment: eq, date })}
          onEditEquipment={eq => setEquipModal({ equipment: eq })}
          onAddEquipment={() => setEquipModal({})}
        />
      </div>

      {/* TempModal */}
      {tempModal && (
        <TempModal
          equipment={tempModal.equipment}
          date={tempModal.date}
          readings={tempCtx.getReadingsForDay(tempModal.equipment.id, tempModal.date)}
          onSave={newReadings => tempCtx.saveReadingsForDay(tempModal.equipment.id, tempModal.date, newReadings)}
          onClose={() => setTempModal(null)}
        />
      )}

      {/* TempEquipmentModal */}
      {equipModal && (
        <TempEquipmentModal
          equipment={equipModal.equipment ?? null}
          onSave={data => {
            if (equipModal.equipment) {
              tempCtx.updateEquipment(equipModal.equipment.id, data)
              showToast(`${data.name} mis à jour`, null)
            } else {
              tempCtx.addEquipment(data)
              showToast(`${data.name} ajouté`, null)
            }
            setEquipModal(null)
          }}
          onArchive={() => {
            tempCtx.archiveEquipment(equipModal.equipment.id)
            showToast(`${equipModal.equipment.name} archivé`, null)
            setEquipModal(null)
          }}
          onCancel={() => setEquipModal(null)}
        />
      )}

    </div>
  )
}
