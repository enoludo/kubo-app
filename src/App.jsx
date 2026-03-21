import { useState, useEffect } from 'react'
import Header               from './components/Header'
import ShiftModal           from './components/ShiftModal'
import EmployeeModal        from './components/EmployeeModal'
import EmployeeProfileModal from './components/EmployeeProfileModal'
import WeekPickerPanel      from './components/WeekPickerPanel'
import TableView            from './components/TableView'
import NavSidebar           from './components/NavSidebar'
import OrdersApp            from './modules/orders/OrdersApp'
import StartupModal         from './components/StartupModal'
import { useSchedule }      from './hooks/useSchedule'
import { useGoogleSync }    from './hooks/useGoogleSync'
import { useWeek }          from './hooks/useWeek'
import { useTeam }          from './hooks/useTeam'
import { useShiftActions }  from './hooks/useShiftActions'
import { useTemplates }     from './hooks/useTemplates'
import { useExports }       from './hooks/useExports'
import { useOrders }        from './hooks/useOrders'
import { sessionHasData }   from './utils/session'
import { mondayOf, dateToStr } from './utils/date'
import initialTeam from './data/team.json'
import './App.css'

export default function App() {
  const schedule = useSchedule()
  const week     = useWeek()

  const [activeModule,       setActiveModule]      = useState('planning')
  const [startupDismissed,   setStartupDismissed]  = useState(false)
  const [toast,              setToast]             = useState(null)
  const [dataSource,         setDataSource]        = useState(() => sessionHasData() ? 'session' : 'demo')
  const [copiedEmployeePlan, setCopiedEmployeePlan] = useState(null)

  function showToast(msg, color) {
    setToast({ msg, color })
    setTimeout(() => setToast(null), 3000)
  }

  const teamCtx = useTeam({ initialTeam, schedule, setDataSource, showToast })

  // ── Copier / coller un planning employé ─────────────────────────────────────
  function handleCopyEmployeePlan(employee, weekKey, shifts) {
    setCopiedEmployeePlan({ employee, weekKey, shifts })
    showToast(`Planning de ${employee.name.split(' ')[0]} copié ✓`, employee.color)
  }

  function handlePasteEmployeePlan(targetEmployee, targetWeekKey, mode) {
    const { employee: src, weekKey: srcWeekKey, shifts: srcShifts } = copiedEmployeePlan
    schedule.pasteShifts(targetEmployee.id, srcShifts, srcWeekKey, targetWeekKey, mode)
    setCopiedEmployeePlan(null)
    // Naviguer vers la semaine cible pour que l'utilisateur voie le résultat
    const todayMonday   = new Date(mondayOf(dateToStr(new Date())) + 'T00:00:00')
    const targetMonday  = new Date(targetWeekKey + 'T00:00:00')
    const offset        = Math.round((targetMonday - todayMonday) / (7 * 24 * 60 * 60 * 1000))
    week.goTo(offset)
    const isSame = src.id === targetEmployee.id
    const msg = isSame ? 'Planning reproduit ✓' : `Planning de ${src.name.split(' ')[0]} collé ✓`
    showToast(msg, targetEmployee.color)
  }

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

  const ordersCtx   = useOrders({ onToast: showToast })

  // Auto-dismiss startup modal quand les deux services sont connectés
  useEffect(() => {
    if (!startupDismissed && sync.status === 'synced' && ordersCtx.webflowStatus === 'connected') {
      const t = setTimeout(() => setStartupDismissed(true), 800)
      return () => clearTimeout(t)
    }
  }, [sync.status, ordersCtx.webflowStatus, startupDismissed])

  async function handleStartupSheetsConnect() {
    await sync.connect()
    ordersCtx.sheetsConnectFromShared()
  }
  const visibleIds  = new Set(teamCtx.team.filter(e => !e.archived).map(e => e.id))
  const shiftCtx    = useShiftActions({ schedule, team: teamCtx.team })
  const templateCtx = useTemplates({ schedule, week })
  const exportCtx   = useExports({ week, team: teamCtx.team, schedule })

  return (
    <div className="app-shell">
      {!startupDismissed && (
        <StartupModal
          sheetsStatus={sync.status}
          sheetsError={sync.errMsg}
          webflowStatus={ordersCtx.webflowStatus}
          webflowError={ordersCtx.webflowError}
          onSheetsConnect={handleStartupSheetsConnect}
          onDismiss={() => setStartupDismissed(true)}
        />
      )}
      <NavSidebar
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        badges={{ orders: ordersCtx.upcomingCount }}
      />

      {activeModule === 'orders' && <OrdersApp ordersCtx={ordersCtx} showToast={showToast} />}

      {activeModule === 'planning' && <>
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
          onSyncRetry={sync.retry}
          dataSource={dataSource}
          onReset={teamCtx.handleReset}
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
            copiedEmployeePlan={copiedEmployeePlan}
            onCopyPlan={handleCopyEmployeePlan}
            onPastePlan={handlePasteEmployeePlan}
          />
        )}

        {copiedEmployeePlan && (
          <div className="plan-clipboard-banner">
            <span className="plan-clipboard-msg">
              Planning de <strong>{copiedEmployeePlan.employee.name}</strong> copié — Ouvre une fiche employé pour coller
            </span>
            <button className="plan-clipboard-cancel" onClick={() => setCopiedEmployeePlan(null)}>✕</button>
          </div>
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
onSendToAll={offsets => { exportCtx.handleSendToAllSelection(offsets); exportCtx.setPickerOpen(false) }}
          />
        )}


        {sync.status === 'expired' && (
          <div className="sync-expired-banner" onClick={sync.connect} role="button" tabIndex={0}>
            ⚠ Session Google expirée — Cliquez pour reconnecter
          </div>
        )}

        {toast && (
          <div className="toast" style={{ borderLeftColor: toast.color }}>{toast.msg}</div>
        )}
      </div>
      </>}
    </div>
  )
}
