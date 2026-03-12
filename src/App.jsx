import { useState } from 'react'
import Header           from './components/Header'
import Sidebar          from './components/Sidebar'
import Calendar         from './components/Calendar'
import ShiftModal       from './components/ShiftModal'
import EmployeeModal    from './components/EmployeeModal'
import ArchiveModal     from './components/ArchiveModal'
import WeekPickerPanel  from './components/WeekPickerPanel'
import PrintCalendars   from './components/PrintCalendars'
import { useSchedule, dateToStr } from './hooks/useSchedule'
import { exportToExcel }          from './utils/exportExcel'
import { generatePdf }            from './utils/exportPdf'
import { buildIndividualMailto, buildTeamMailto } from './utils/emailPlanning'
import { useWeek }                from './hooks/useWeek'
import initialTeam from './data/team.json'
import './App.css'

export default function App() {
  const schedule = useSchedule()
  const week     = useWeek()

  const [team,       setTeam]       = useState(initialTeam)
  const [empFilter,  setEmpFilter]  = useState('active')
  const [shiftModal, setShiftModal] = useState(null)
  const [empModal,   setEmpModal]   = useState(null)   // null | { employee: obj|null }
  const [archModal,  setArchModal]  = useState(null)   // null | { employee: obj }
  const [pickerOpen, setPickerOpen] = useState(false)
  const [printWeeks,    setPrintWeeks]    = useState(null)   // null | number[]
  const [pdfGenerating, setPdfGenerating] = useState(false)

  // IDs visibles dans le calendrier selon le filtre
  const archivedIds = new Set(team.filter(e => e.archived).map(e => e.id))
  const visibleIds  = new Set(
    team.filter(e => {
      if (empFilter === 'active')   return !e.archived
      if (empFilter === 'archived') return  e.archived
      return true
    }).map(e => e.id)
  )

  // ── Shift handlers ────────────────────────────────────────────────────────

  function handleDropEmployee(employeeId, date, startHour) {
    const employee = team.find(e => e.id === employeeId)
    if (!employee || employee.archived) return
    setShiftModal({ employee, date, startHour, shift: null })
  }

  function handleEditShift(shiftId) {
    const shift    = schedule.shifts.find(s => s.id === shiftId)
    const employee = team.find(e => e.id === shift.employeeId)
    if (!employee || employee.archived) return
    const date = new Date(shift.date + 'T00:00:00')
    setShiftModal({ employee, date, startHour: shift.startHour, shift })
  }

  function handleSaveShift(startHour, endHour, pause) {
    if (shiftModal.shift) {
      schedule.updateShift(shiftModal.shift.id, startHour, endHour, pause)
    } else {
      schedule.addShift(shiftModal.employee.id, dateToStr(shiftModal.date), startHour, endHour, pause)
    }
    setShiftModal(null)
  }

  function handleDeleteShift() {
    schedule.removeShift(shiftModal.shift.id)
    setShiftModal(null)
  }

  // ── Email ─────────────────────────────────────────────────────────────────

  function handleSendEmail(emp) {
    if (!emp.email) {
      setEmpModal({ employee: emp })
      return
    }
    const href = buildIndividualMailto(emp, week.dates, schedule.shifts)
    if (href) window.location.href = href
  }

  function handleSendToAll() {
    const href = buildTeamMailto(team, week.dates, schedule.shifts)
    if (href) window.location.href = href
  }

  // ── PDF export ────────────────────────────────────────────────────────────

  async function handlePdfExport(offsets) {
    if (pdfGenerating || !offsets.length) return
    setPdfGenerating(true)
    const sorted      = [...offsets].sort((a, b) => a - b)
    const origOffset  = week.weekOffset
    const captures    = []
    try {
      const html2canvas = (await import('html2canvas')).default
      for (const offset of sorted) {
        week.goTo(offset)
        await new Promise(resolve => setTimeout(resolve, 600))
        const calEl = document.querySelector('.calendar-wrap')
        if (!calEl) continue
        const canvas = await html2canvas(calEl, {
          scale: 1.5,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          ignoreElements: el =>
            el.classList?.contains('modal-overlay') ||
            el.classList?.contains('week-picker-overlay'),
        })
        captures.push({ imgData: canvas.toDataURL('image/png'), offset })
      }
      if (captures.length > 0) {
        await generatePdf(captures, team, schedule.shifts)
      }
    } catch (err) {
      console.error('PDF generation failed:', err)
    } finally {
      week.goTo(origOffset)
      setPdfGenerating(false)
    }
  }

  // ── Employee handlers ─────────────────────────────────────────────────────

  function handleSaveEmployee(data) {
    if (empModal.employee) {
      // Edit
      setTeam(prev => prev.map(e =>
        e.id === empModal.employee.id
          ? { ...e, name: data.name, role: data.role, email: data.email, color: data.color, initials: data.initials }
          : e
      ))
    } else {
      // Add
      const newId = Math.max(0, ...team.map(e => e.id)) + 1
      setTeam(prev => [...prev, {
        id: newId,
        name: data.name,
        role: data.role,
        email: data.email,
        color: data.color,
        initials: data.initials,
        contract: 35,
        archived: false,
      }])
    }
    setEmpModal(null)
  }

  function handleConfirmAction() {
    if (archModal.mode === 'delete') {
      schedule.removeEmployeeShifts(archModal.employee.id)
      setTeam(prev => prev.filter(e => e.id !== archModal.employee.id))
    } else {
      setTeam(prev => prev.map(e =>
        e.id === archModal.employee.id ? { ...e, archived: true } : e
      ))
    }
    setArchModal(null)
  }

  return (
    <div className="app">
      <Header
        week={week}
        onExport={() => exportToExcel(schedule.shifts, team)}
        onOpenPicker={() => setPickerOpen(v => !v)}
        onPdfExport={() => handlePdfExport([week.weekOffset])}
        pdfGenerating={pdfGenerating}
        onSendToAll={handleSendToAll}
      />
      <div className="app-body">
        <Sidebar
          team={team}
          schedule={schedule}
          weekDates={week.dates}
          empFilter={empFilter}
          setEmpFilter={setEmpFilter}
          onAddEmployee={() => setEmpModal({ employee: null })}
          onEditEmployee={emp => setEmpModal({ employee: emp })}
          onArchiveEmployee={emp => setArchModal({ employee: emp, mode: 'archive' })}
          onDeleteEmployee={emp => setArchModal({ employee: emp, mode: 'delete' })}
          onSendEmail={handleSendEmail}
        />
        <Calendar
          team={team}
          schedule={schedule}
          dates={week.dates}
          visibleIds={visibleIds}
          archivedIds={archivedIds}
          onDropEmployee={handleDropEmployee}
          onEditShift={handleEditShift}
        />
      </div>

      {shiftModal && (
        <ShiftModal
          info={shiftModal}
          onSave={handleSaveShift}
          onDelete={handleDeleteShift}
          onCancel={() => setShiftModal(null)}
          schedule={schedule}
          weekDates={week.dates}
        />
      )}
      {empModal && (
        <EmployeeModal
          employee={empModal.employee}
          onSave={handleSaveEmployee}
          onCancel={() => setEmpModal(null)}
        />
      )}
      {archModal && (
        <ArchiveModal
          employee={archModal.employee}
          mode={archModal.mode}
          onConfirm={handleConfirmAction}
          onCancel={() => setArchModal(null)}
        />
      )}

      {pickerOpen && (
        <WeekPickerPanel
          shifts={schedule.shifts}
          team={team}
          currentOffset={week.weekOffset}
          onSelect={offset => { week.goTo(offset); setPickerOpen(false) }}
          onClose={() => setPickerOpen(false)}
          pdfGenerating={pdfGenerating}
          onPdfSelection={offsets => {
            setPickerOpen(false)
            handlePdfExport(offsets)
          }}
          onExportSelection={offsets => {
            const todayMonday = (() => {
              const d = new Date(); const day = d.getDay()
              d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day)); d.setHours(0,0,0,0)
              return d
            })()
            const dateStrs = new Set(offsets.flatMap(off => {
              const mon = new Date(todayMonday)
              mon.setDate(mon.getDate() + off * 7)
              return Array.from({ length: 7 }, (_, i) => {
                const d = new Date(mon); d.setDate(mon.getDate() + i)
                return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
              })
            }))
            exportToExcel(schedule.shifts.filter(s => dateStrs.has(s.date)), team)
            setPickerOpen(false)
          }}
          onPrintSelection={offsets => {
            setPickerOpen(false)
            setPrintWeeks(offsets)
            document.body.classList.add('printing-selection')
            setTimeout(() => {
              window.print()
              document.body.classList.remove('printing-selection')
              setPrintWeeks(null)
            }, 100)
          }}
        />
      )}

      {printWeeks && (
        <PrintCalendars
          weekOffsets={printWeeks}
          shifts={schedule.shifts}
          team={team}
        />
      )}
    </div>
  )
}
