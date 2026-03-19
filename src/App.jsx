import { useState, useEffect, useRef } from 'react'
import Header                from './components/Header'
import ShiftModal            from './components/ShiftModal'
import EmployeeModal         from './components/EmployeeModal'
import EmployeeProfileModal  from './components/EmployeeProfileModal'
import WeekPickerPanel       from './components/WeekPickerPanel'
import TableView             from './components/TableView'
import NavSidebar            from './components/NavSidebar'
import { useSchedule, dateToStr } from './hooks/useSchedule'
import { useGoogleSync }          from './hooks/useGoogleSync'
import { exportToExcel }          from './utils/exportExcel'
import { sessionSave, sessionLoad, sessionClear, sessionHasData } from './utils/session'
import { generatePdf }            from './utils/exportPdf'
import { buildTeamMailto }        from './utils/emailPlanning'
import { useWeek }                from './hooks/useWeek'
import initialTeam from './data/team.json'
import './App.css'

export default function App() {
  const schedule = useSchedule()
  const week     = useWeek()

  const [team,          setTeam]         = useState(() => sessionLoad('team') ?? initialTeam)
  const [shiftModal,    setShiftModal]   = useState(null)
  const [profileModal,  setProfileModal] = useState(null)
  const [empModal,      setEmpModal]     = useState(null)
  const [pickerOpen,    setPickerOpen]   = useState(false)
  const [pdfGenerating, setPdfGenerating] = useState(false)
  const [toast,         setToast]         = useState(null)
  const [copiedPlan,    setCopiedPlan]    = useState(null)
  const [templates,     setTemplates]     = useState([])
  const [dataSource,    setDataSource]    = useState(() => sessionHasData() ? 'session' : 'demo')

  const teamSaveTimer = useRef(null)

  function showToast(msg, color) {
    setToast({ msg, color })
    setTimeout(() => setToast(null), 3000)
  }

  // Auto-save de l'équipe dans sessionStorage (debounce 500ms)
  useEffect(() => {
    clearTimeout(teamSaveTimer.current)
    teamSaveTimer.current = setTimeout(() => sessionSave('team', team), 500)
    return () => clearTimeout(teamSaveTimer.current)
  }, [team])

  // Toast au premier montage si des données de session ont été restaurées
  useEffect(() => {
    if (sessionHasData()) {
      showToast('Planning restauré depuis votre session précédente', '#7C6FCD')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Synchronisation Google Sheets ─────────────────────────────────────────
  const sync = useGoogleSync({
    shifts:              schedule.shifts,
    team,
    weekDates:           week.dates,
    setTeam,
    replaceWeekShifts:   schedule.replaceWeekShifts,
    onToast:             showToast,
  })

  // Suivi de la source de données selon l'état de la sync
  useEffect(() => {
    if (sync.status === 'synced') {
      setDataSource('synced')
    } else if (dataSource === 'synced') {
      setDataSource('session')
    }
  }, [sync.status]) // eslint-disable-line react-hooks/exhaustive-deps

  const visibleIds = new Set(team.filter(e => !e.archived).map(e => e.id))

  // ── Réinitialisation aux données de démo ─────────────────────────────────
  function handleReset() {
    sessionClear()
    schedule.resetShifts()
    setTeam(initialTeam)
    setDataSource('demo')
  }

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

  // ── Copy / Paste / Templates ──────────────────────────────────────────────

  function extractRelativeShifts() {
    return schedule.shifts
      .filter(s => week.dates.some(d => dateToStr(d) === s.date))
      .map(s => {
        const dayOffset = week.dates.findIndex(d => dateToStr(d) === s.date)
        return {
          employeeId: s.employeeId, dayOffset,
          startHour: s.startHour, endHour: s.endHour,
          pause: s.pause ?? 0, type: s.type ?? 'work',
        }
      })
  }

  function handleCopyPlan() {
    const shifts    = extractRelativeShifts()
    const d0        = week.dates[0]
    const d6        = week.dates[6]
    const weekLabel = `${d0.getDate()}/${d0.getMonth() + 1} – ${d6.getDate()}/${d6.getMonth() + 1}`
    setCopiedPlan({ weekLabel, shifts })
  }

  function handlePastePlan() {
    if (!copiedPlan) return
    copiedPlan.shifts.forEach(s => {
      const date = week.dates[s.dayOffset]
      if (date) schedule.addShift(s.employeeId, dateToStr(date), s.startHour, s.endHour, s.pause, s.type)
    })
  }

  function handleSaveTemplate(name) {
    const shifts = extractRelativeShifts()
    setTemplates(prev => [...prev, { id: Date.now(), name, shifts }])
  }

  function handleLoadTemplate(templateId) {
    const tpl = templates.find(t => t.id === templateId)
    if (!tpl) return
    tpl.shifts.forEach(s => {
      const date = week.dates[s.dayOffset]
      if (date) schedule.addShift(s.employeeId, dateToStr(date), s.startHour, s.endHour, s.pause, s.type)
    })
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
    <div className="app-shell">
    <NavSidebar activeModule="planning" />
    {sync.loading && (
      <div className="app-loading-overlay">
        <span className="app-loading-spinner" />
        <span>Chargement du planning…</span>
      </div>
    )}
    <div className="app">
      <Header
        week={week}
        onOpenPicker={() => setPickerOpen(v => !v)}
        onPdfExport={() => handlePdfExport([week.weekOffset])}
        pdfGenerating={pdfGenerating}
        onSendToAll={handleSendToAll}
        copiedPlan={copiedPlan}
        templates={templates}
        onCopyPlan={handleCopyPlan}
        onPastePlan={handlePastePlan}
        onSaveTemplate={handleSaveTemplate}
        onLoadTemplate={handleLoadTemplate}
        syncStatus={sync.status}
        syncError={sync.errMsg}
        onSyncConnect={sync.connect}
        onSyncDisconnect={sync.disconnect}
        onSyncRetry={sync.retry}
        dataSource={dataSource}
        onReset={handleReset}
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

      {sync.status === 'expired' && (
        <div className="sync-expired-banner" onClick={sync.connect} role="button" tabIndex={0}>
          ⚠ Session Google expirée — Cliquez pour reconnecter
        </div>
      )}

      {sync.conflict && (
        <div className="sync-conflict-banner">
          <span className="sync-conflict-msg">
            ⚡ Conflit — le Sheet a été modifié en même temps que l'app
          </span>
          <div className="sync-conflict-actions">
            <button onClick={() => sync.resolveConflict('local')}>Garder l'App</button>
            <button onClick={() => sync.resolveConflict('remote')}>Garder le Sheet</button>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast" style={{ borderLeftColor: toast.color }}>{toast.msg}</div>
      )}
    </div>
    </div>
  )
}
