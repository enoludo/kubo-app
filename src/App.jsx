import { useState } from 'react'
import Header                from './components/Header'
import ShiftModal            from './components/ShiftModal'
import EmployeeModal         from './components/EmployeeModal'
import EmployeeProfileModal  from './components/EmployeeProfileModal'
import WeekPickerPanel       from './components/WeekPickerPanel'
import TableView             from './components/TableView'
import { useSchedule, dateToStr } from './hooks/useSchedule'
import { exportToExcel }          from './utils/exportExcel'
import { generatePdf }            from './utils/exportPdf'
import { buildTeamMailto }        from './utils/emailPlanning'
import { useWeek }                from './hooks/useWeek'
import initialTeam from './data/team.json'
import './App.css'

export default function App() {
  const schedule = useSchedule()
  const week     = useWeek()

  const [team,         setTeam]         = useState(initialTeam)
  const [shiftModal,   setShiftModal]   = useState(null)
  const [profileModal, setProfileModal] = useState(null)   // null | employee
  const [empModal,     setEmpModal]     = useState(null)   // null | { employee: obj|null }
  const [pickerOpen,   setPickerOpen]   = useState(false)
  const [pdfGenerating, setPdfGenerating] = useState(false)
  const [toast,         setToast]         = useState(null)

  function showToast(msg, color) {
    setToast({ msg, color })
    setTimeout(() => setToast(null), 3000)
  }

  const visibleIds = new Set(team.filter(e => !e.archived).map(e => e.id))

  // ── Shift handlers ────────────────────────────────────────────────────────

  function handleEditShift(shiftId) {
    const shift    = schedule.shifts.find(s => s.id === shiftId)
    const employee = team.find(e => e.id === shift.employeeId)
    if (!employee || employee.archived) return
    const date = new Date(shift.date + 'T00:00:00')
    setShiftModal({ employee, date, startHour: shift.startHour, shift })
  }

  function handleSaveShift(startHour, endHour, pause, type, extra = {}) {
    if (shiftModal.shift) {
      schedule.updateShift(shiftModal.shift.id, startHour, endHour, pause, type, extra)
    } else {
      schedule.addShift(shiftModal.employee.id, dateToStr(shiftModal.date), startHour, endHour, pause, type, extra)
    }
    setShiftModal(null)
  }

  function handleAddForDay(employeeId, date, defaultType) {
    const employee = team.find(e => e.id === employeeId)
    if (!employee || employee.archived) return
    setShiftModal({ employee, date, startHour: 9, shift: null, ...(defaultType ? { defaultType } : {}) })
  }

  function handleDeleteShift() {
    schedule.removeShift(shiftModal.shift.id)
    setShiftModal(null)
  }

  // ── Email ─────────────────────────────────────────────────────────────────

  function handleSendToAll() {
    const href = buildTeamMailto(team, week.dates, schedule.shifts)
    if (href) window.location.href = href
  }

  // ── PDF export ────────────────────────────────────────────────────────────

  async function handlePdfExport(offsets) {
    if (pdfGenerating || !offsets.length) return
    setPdfGenerating(true)
    const sorted     = [...offsets].sort((a, b) => a - b)
    const origOffset = week.weekOffset
    const captures   = []
    try {
      const html2canvas = (await import('html2canvas')).default
      for (const offset of sorted) {
        week.goTo(offset)
        await new Promise(resolve => setTimeout(resolve, 600))
        const calEl = document.querySelector('.table-view')
        if (!calEl) continue
        const canvas = await html2canvas(calEl, {
          scale: 1.5, useCORS: true, allowTaint: true,
          backgroundColor: '#ffffff', logging: false,
          ignoreElements: el =>
            el.classList?.contains('modal-overlay') ||
            el.classList?.contains('week-picker-overlay'),
        })
        captures.push({ imgData: canvas.toDataURL('image/png'), offset })
      }
      if (captures.length > 0) await generatePdf(captures, team, schedule.shifts)
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
      setTeam(prev => prev.map(e =>
        e.id === empModal.employee.id
          ? { ...e, name: data.name, role: data.role, email: data.email,
              contract: data.contract, color: data.color, initials: data.initials,
              startBalance: data.startBalance ?? 0 }
          : e
      ))
    } else {
      const newId = Math.max(0, ...team.map(e => e.id)) + 1
      setTeam(prev => [...prev, {
        id: newId, name: data.name, role: data.role, email: data.email,
        contract: data.contract ?? 35, color: data.color, initials: data.initials,
        archived: false, startBalance: data.startBalance ?? 0,
      }])
    }
    setEmpModal(null)
  }

  function handleArchiveEmployee() {
    if (!empModal?.employee) return
    setTeam(prev => prev.map(e =>
      e.id === empModal.employee.id ? { ...e, archived: true } : e
    ))
    setEmpModal(null)
  }

  function handleDeleteEmployee() {
    if (!empModal?.employee) return
    schedule.removeEmployeeShifts(empModal.employee.id)
    setTeam(prev => prev.filter(e => e.id !== empModal.employee.id))
    setEmpModal(null)
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
        <TableView
          team={team}
          schedule={schedule}
          weekDates={week.dates}
          visibleIds={visibleIds}
          onAddForDay={handleAddForDay}
          onEditShift={handleEditShift}
          onToggleValidated={schedule.toggleValidated}
          onEmployeeClick={emp => setProfileModal(emp)}
          onAddEmployee={() => setEmpModal({ employee: null })}
        />
      </div>

      {shiftModal && (
        <ShiftModal
          info={shiftModal}
          onSave={handleSaveShift}
          onDelete={handleDeleteShift}
          onCancel={() => setShiftModal(null)}
          onToggleValidated={schedule.toggleValidated}
          schedule={schedule}
          weekDates={week.dates}
        />
      )}

      {profileModal && (
        <EmployeeProfileModal
          employee={profileModal}
          weekDates={week.dates}
          schedule={schedule}
          onEdit={() => { setEmpModal({ employee: profileModal }); setProfileModal(null) }}
          onClose={() => setProfileModal(null)}
        />
      )}

      {empModal && (
        <EmployeeModal
          employee={empModal.employee}
          onSave={handleSaveEmployee}
          onCancel={() => setEmpModal(null)}
          onArchive={handleArchiveEmployee}
          onDelete={handleDeleteEmployee}
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
          onPdfSelection={offsets => { setPickerOpen(false); handlePdfExport(offsets) }}
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
          onPrintSelection={() => {
            setPickerOpen(false)
            document.body.classList.add('printing-selection')
            setTimeout(() => {
              window.print()
              document.body.classList.remove('printing-selection')
            }, 100)
          }}
        />
      )}

      {toast && (
        <div className="toast" style={{ borderLeftColor: toast.color }}>{toast.msg}</div>
      )}
    </div>
  )
}
