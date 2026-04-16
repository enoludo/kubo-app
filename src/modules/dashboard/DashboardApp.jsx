// ─── Dashboard — Page d'accueil ────────────────────────────────────────────────
import DashPlanningBlock  from './components/DashPlanningBlock'
import DashTempBlock      from './components/DashTempBlock'
import DashCleaningBlock  from './components/DashCleaningBlock'
import DashOrdersBlock    from './components/DashOrdersBlock'
import { dateToStr }      from '../../utils/date'
import '../../design-system/layout/ModuleLayout.css'
import './dashboard-tokens.css'
import '../orders/orders-tokens.css'
import './DashboardApp.css'

function fmtTodayLabel(date) {
  const s = date.toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
  })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function ShareIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="21.5" height="22.5" viewBox="0 0 21.5 22.5" fill='currentcolor'>
  <path id="Union_14" data-name="Union 14" d="M3.1,22.566a3.086,3.086,0,0,1-2.9-2.75c-.107-1-.2-3.409-.2-5.255s.091-4.253.2-5.255A3.088,3.088,0,0,1,3.1,6.554c.865-.064,2.387-.112,3.5-.148l.626-.021a.75.75,0,0,1,.051,1.5l-.629.02c-1.1.035-2.6.084-3.433.145A1.588,1.588,0,0,0,1.689,9.464c-.1.943-.189,3.325-.189,5.1s.088,4.153.189,5.1A1.586,1.586,0,0,0,3.214,21.07c1.436.11,3.91.24,7.536.24s6.1-.13,7.536-.24a1.587,1.587,0,0,0,1.525-1.414c.1-.943.189-3.325.189-5.1s-.088-4.152-.189-5.095A1.589,1.589,0,0,0,18.284,8.05c-.829-.061-2.33-.11-3.426-.144l-.634-.021a.75.75,0,1,1,.051-1.5l.63.021c1.11.035,2.629.084,3.49.148A3.089,3.089,0,0,1,21.3,9.305c.107,1,.2,3.409.2,5.254s-.091,4.253-.2,5.256a3.086,3.086,0,0,1-2.9,2.75c-1.462.112-3.976.245-7.65.245S4.562,22.677,3.1,22.566ZM10,10.881V2.872L8.094,4.778a.75.75,0,1,1-1.06-1.061L10.22.53a.751.751,0,0,1,1.061,0l3.187,3.187a.75.75,0,0,1-1.061,1.061L11.5,2.871v8.01a.75.75,0,0,1-1.5,0Z" transform="translate(0 -0.311)"/>
</svg>
  )
}

export default function DashboardApp({
  schedule, teamCtx, cleanCtx, tempCtx,
  ordersCtx, productsCtx, onNavigate,
}) {
  const today    = new Date()
  const todayStr = dateToStr(today)

  return (
    <div className="app dash-app">

      {/* ── Header — même structure que les autres modules ── */}
      <header className="header">
        <div className="header-nav-box">

          <div className="header-nav-left">
            <span className="dash-header-title">Tableau de bord</span>
          </div>

          <div className="header-nav-center">
            <span className="week-label week-label--btn" style={{ cursor: 'default' }}>
              {fmtTodayLabel(today)}
            </span>
          </div>

          <div className="header-nav-right">
            <button
              className="header-menu-btn"
              onClick={() => window.print()}
              title="Imprimer / Exporter PDF"
              aria-label="Partager"
            >
              <ShareIcon />
            </button>
          </div>

        </div>
      </header>

      {/* ── Corps ── */}
      <div className="app-body dash-body">

        {/* Colonne gauche */}
        <div className="dash-col-left">

          <div className="dash-col-left-top">
            <DashPlanningBlock
              schedule={schedule}
              team={teamCtx.team}
              todayStr={todayStr}
              onNavigate={onNavigate}
            />
          </div>

          <div className="dash-col-left-bottom">
            <DashTempBlock
              equipment={tempCtx.activeEquipment}
              readings={tempCtx.readings}
              todayStr={todayStr}
            />
            <DashCleaningBlock
              rooms={cleanCtx.rooms}
              zones={cleanCtx.zones}
              subzones={cleanCtx.subzones}
              tasks={cleanCtx.tasks}
              records={cleanCtx.records}
              today={today}
              todayStr={todayStr}
            />
          </div>

        </div>

        {/* Colonne droite */}
        <div className="dash-col-right">
          <DashOrdersBlock
            orders={ordersCtx.orders}
            productsCtx={productsCtx}
            todayStr={todayStr}
          />
        </div>

      </div>

    </div>
  )
}
