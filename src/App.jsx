import { useState, useEffect } from 'react'
import { useAuth }          from './hooks/useAuth.jsx'
import { signOut }          from './services/authService'
import ModeSelector         from './components/ModeSelector'
import NavSidebar           from './components/NavSidebar'
import OrdersApp            from './modules/orders/OrdersApp'
import ProductsApp          from './modules/products/ProductsApp'
import TemperaturesApp      from './modules/temperatures/TemperaturesApp'
import CleaningApp          from './modules/cleaning/CleaningApp'
import TraceabilityApp      from './modules/traceability/TraceabilityApp'
import DashboardApp         from './modules/dashboard/DashboardApp'
import StartupModal         from './components/StartupModal'
import PlanningApp          from './modules/planning/PlanningApp'
import { useOrders }        from './hooks/useOrders'
import { useProducts }      from './hooks/useProducts'
import { useSchedule }      from './modules/planning/hooks/useSchedule'
import { useTeam }          from './modules/planning/hooks/useTeam'
import { useCleaning }      from './modules/cleaning/hooks/useCleaning'
import { useTemperatures }  from './modules/temperatures/hooks/useTemperatures'
import { useTraceability }  from './modules/traceability/hooks/useTraceability'
import { sessionHasData }   from './utils/session'
import initialTeam          from './modules/planning/data/team.json'
import './App.css'

export default function App() {
  const { user, name, isManager, loading } = useAuth()

  if (loading) return null
  if (!user)   return <ModeSelector />

  return <AuthenticatedApp name={name} isManager={isManager} />
}

function AuthenticatedApp({ name, isManager }) {
  const [activeModule,     setActiveModule]   = useState('dashboard')
  const [startupDismissed, setStartupDismissed] = useState(false)
  const [toast,            setToast]          = useState(null)
  const [dataSource,       setDataSource]     = useState(() => sessionHasData() ? 'session' : 'demo')

  function showToast(msg, color) {
    setToast({ msg, color })
    setTimeout(() => setToast(null), 3000)
  }

  const ordersCtx   = useOrders({ onToast: showToast })
  const productsCtx = useProducts({ onToast: showToast })
  const schedule    = useSchedule()
  const teamCtx     = useTeam({ initialTeam, schedule, setDataSource, showToast })
  const cleanCtx    = useCleaning()
  const tempCtx     = useTemperatures({ onToast: showToast })
  const trCtx       = useTraceability()

  // Auto-dismiss startup modal quand Webflow est connecté
  useEffect(() => {
    if (!startupDismissed && ordersCtx.webflowStatus === 'connected') {
      const t = setTimeout(() => setStartupDismissed(true), 800)
      return () => clearTimeout(t)
    }
  }, [ordersCtx.webflowStatus, startupDismissed])

  return (
    <div className="app-shell">
      {!startupDismissed && (
        <StartupModal
          webflowStatus={ordersCtx.webflowStatus}
          webflowError={ordersCtx.webflowError}
          onDismiss={() => setStartupDismissed(true)}
        />
      )}

      <NavSidebar
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        badges={{ orders: ordersCtx.upcomingCount }}
        userName={name}
        onSignOut={signOut}
        connections={[
          {
            label:     'Webflow',
            status:    ordersCtx.webflowStatus === 'connected' ? 'connected'
                     : ordersCtx.webflowStatus === 'loading'   ? 'connecting'
                     : ordersCtx.webflowStatus === 'error'     ? 'error'
                     : 'disconnected',
            detail:    ordersCtx.webflowStatus === 'connected' ? 'Connecté'
                     : ordersCtx.webflowStatus === 'loading'   ? 'Connexion en cours…'
                     : ordersCtx.webflowStatus === 'error'     ? (ordersCtx.webflowError ?? 'Erreur de connexion')
                     : 'Non connecté',
            onRetry:   ordersCtx.webflowStatus === 'error' ? ordersCtx.retryWebflow : undefined,
          },
        ]}
      />

      {activeModule === 'dashboard'     && <DashboardApp     schedule={schedule} teamCtx={teamCtx} cleanCtx={cleanCtx} tempCtx={tempCtx} trCtx={trCtx} ordersCtx={ordersCtx} productsCtx={productsCtx} onNavigate={setActiveModule} />}
      {activeModule === 'orders'        && <OrdersApp        ordersCtx={ordersCtx} productsCtx={productsCtx} showToast={showToast} />}
      {activeModule === 'products'      && <ProductsApp      productsCtx={productsCtx} showToast={showToast} isManager={isManager} />}
      {activeModule === 'planning'      && <PlanningApp      showToast={showToast} schedule={schedule} teamCtx={teamCtx} dataSource={dataSource} isManager={isManager} />}
      {activeModule === 'temperatures'  && <TemperaturesApp  showToast={showToast} tempCtx={tempCtx} />}
      {activeModule === 'cleaning'      && <CleaningApp      showToast={showToast} cleanCtx={cleanCtx} />}
      {activeModule === 'tracability'   && <TraceabilityApp  showToast={showToast} trCtx={trCtx} />}

      {toast && (
        <div className="toast" style={{ borderLeftColor: toast.color }}>{toast.msg}</div>
      )}
    </div>
  )
}
