import { useState, useEffect } from 'react'
import Header               from './components/Header'
import ShiftModal           from './components/ShiftModal'
import EmployeeModal        from './components/EmployeeModal'
import EmployeeProfileModal from './components/EmployeeProfileModal'
import WeekPickerPanel      from './components/WeekPickerPanel'
import TableView            from './components/TableView'
import NavSidebar           from './components/NavSidebar'
import TodayPanel           from './components/TodayPanel'
import { useSchedule }      from './hooks/useSchedule'
import { useGoogleSync }    from './hooks/useGoogleSync'
import { useWeek }          from './hooks/useWeek'
import { useTeam }          from './hooks/useTeam'
import { useShiftActions }  from './hooks/useShiftActions'
import { useTemplates }     from './hooks/useTemplates'
import { useExports }       from './hooks/useExports'
import { sessionHasData }   from './utils/session'
import initialTeam from './data/team.json'
import './App.css'

export default function App() {
  const schedule = useSchedule()
  const week     = useWeek()

  const [toast,      setToast]      = useState(null)
  const [dataSource, setDataSource] = useState(() => sessionHasData() ? 'session' : 'demo')
  const [todayOpen,  setTodayOpen]  = useState(false)

  function showToast(msg, color) {
    setToast({ msg, color })
    setTimeout(() => setToast(null), 3000)
  }

  const teamCtx = useTeam({ initialTeam, schedule, setDataSource, showToast })

  // ── Synchronisation Google Sheets ───────────────────────────────────────────
  const sync = useGoogleSync({
    shifts:            schedule.shifts,
    team:              teamCtx.team,
    weekDates:         week.dates,
    setTeam:           teamCtx.setTeam,
    replaceWeekShifts: schedule.replaceWeekShifts,
    onToast:           showToast,
  })

  // Suivi de la source de données selon l'état de la sync
  useEffect(() => {
    if (sync.status === 'synced') {
      setDataSource('synced')
    } else if (dataSource === 'synced') {
      setDataSource('session')
    }
  }, [sync.status]) // eslint-disable-line react-hooks/exhaustive-deps

  const visibleIds  = new Set(teamCtx.team.filter(e => !e.archived).map(e => e.id))
  const shiftCtx    = useShiftActions({ schedule, team: teamCtx.team })
  const templateCtx = useTemplates({ schedule, week })
  const exportCtx   = useExports({ week, team: teamCtx.team, schedule })

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
          onOpenPicker={() => exportCtx.setPickerOpen(v => !v)}
          onPdfExport={() => exportCtx.handlePdfExport([week.weekOffset])}
          pdfGenerating={exportCtx.pdfGenerating}
          onSendToAll={exportCtx.handleSendToAll}
          copiedPlan={templateCtx.copiedPlan}
          templates={templateCtx.templates}
          onCopyPlan={templateCtx.handleCopyPlan}
          onPastePlan={templateCtx.handlePastePlan}
          onSaveTemplate={templateCtx.handleSaveTemplate}
          onLoadTemplate={templateCtx.handleLoadTemplate}
          syncStatus={sync.status}
          syncError={sync.errMsg}
          onSyncConnect={sync.connect}
          onSyncDisconnect={sync.disconnect}
          onSyncRetry={sync.retry}
          dataSource={dataSource}
          onReset={teamCtx.handleReset}
          onTodayOpen={() => setTodayOpen(true)}
        />
        <div className="app-body">
          <TableView
            team={teamCtx.team}
            schedule={schedule}
            weekDates={week.dates}
            visibleIds={visibleIds}
            onAddForDay={shiftCtx.handleAddForDay}
            onEditShift={shiftCtx.handleEditShift}
            onToggleValidated={schedule.toggleValidated}
            onEmployeeClick={emp => teamCtx.setProfileModal(emp)}
            onAddEmployee={() => teamCtx.setEmpModal({ employee: null })}
          />
        </div>

        {shiftCtx.shiftModal && (
          <ShiftModal
            info={shiftCtx.shiftModal}
            onSave={shiftCtx.handleSaveShift}
            onDelete={shiftCtx.handleDeleteShift}
            onCancel={() => shiftCtx.setShiftModal(null)}
            onToggleValidated={schedule.toggleValidated}
            schedule={schedule}
            weekDates={week.dates}
          />
        )}

        {teamCtx.profileModal && (
          <EmployeeProfileModal
            employee={teamCtx.profileModal}
            weekDates={week.dates}
            schedule={schedule}
            onEdit={() => { teamCtx.setEmpModal({ employee: teamCtx.profileModal }); teamCtx.setProfileModal(null) }}
            onClose={() => teamCtx.setProfileModal(null)}
          />
        )}

        {teamCtx.empModal && (
          <EmployeeModal
            employee={teamCtx.empModal.employee}
            onSave={teamCtx.handleSaveEmployee}
            onCancel={() => teamCtx.setEmpModal(null)}
            onArchive={teamCtx.handleArchiveEmployee}
            onDelete={teamCtx.handleDeleteEmployee}
          />
        )}

        {exportCtx.pickerOpen && (
          <WeekPickerPanel
            shifts={schedule.shifts}
            team={teamCtx.team}
            currentOffset={week.weekOffset}
            onSelect={offset => { week.goTo(offset); exportCtx.setPickerOpen(false) }}
            onClose={() => exportCtx.setPickerOpen(false)}
            pdfGenerating={exportCtx.pdfGenerating}
            onPdfSelection={offsets => { exportCtx.setPickerOpen(false); exportCtx.handlePdfExport(offsets) }}
            onExportSelection={offsets => { exportCtx.handleExportSelection(offsets); exportCtx.setPickerOpen(false) }}
            onPrintSelection={exportCtx.handlePrintSelection}
          />
        )}

        <TodayPanel
          team={teamCtx.team}
          shifts={schedule.shifts}
          open={todayOpen}
          onClose={() => setTodayOpen(false)}
        />

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
