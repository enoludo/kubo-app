import { useState, useEffect } from 'react'
import NavSidebar           from './components/NavSidebar'
import OrdersApp            from './modules/orders/OrdersApp'
import ProductsApp          from './modules/products/ProductsApp'
import StartupModal         from './components/StartupModal'
import PlanningApp          from './modules/planning/PlanningApp'
import { useOrders }        from './hooks/useOrders'
import { useProducts }      from './hooks/useProducts'
import './App.css'

const INITIAL_SYNC = { status: 'disconnected', errMsg: null, loading: false, connect: null, retry: null, getToken: null }

export default function App() {
  const [activeModule,     setActiveModule]   = useState('planning')
  const [startupDismissed, setStartupDismissed] = useState(false)
  const [toast,            setToast]          = useState(null)
  const [sync,             setSync]           = useState(INITIAL_SYNC)

  function showToast(msg, color) {
    setToast({ msg, color })
    setTimeout(() => setToast(null), 3000)
  }

  const ordersCtx   = useOrders({ onToast: showToast })
  const productsCtx = useProducts({ onToast: showToast })

  // Auto-dismiss startup modal quand les deux services sont connectés
  useEffect(() => {
    if (!startupDismissed && sync.status === 'synced' && ordersCtx.webflowStatus === 'connected') {
      const t = setTimeout(() => setStartupDismissed(true), 800)
      return () => clearTimeout(t)
    }
  }, [sync.status, ordersCtx.webflowStatus, startupDismissed])

  async function handleStartupSheetsConnect() {
    await sync.connect?.()
    ordersCtx.sheetsConnectFromShared()
  }

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
        connections={[
          {
            label:     'Google Sheets',
            status:    sync.status === 'synced' ? 'connected' : sync.status,
            detail:    sync.status === 'synced'       ? 'Synchronisé'
                     : sync.status === 'disconnected' ? 'Non connecté'
                     : sync.status === 'expired'      ? 'Session expirée'
                     : sync.status === 'error'        ? (sync.errMsg ?? 'Erreur de synchronisation')
                     : 'Connexion en cours…',
            onConnect: sync.status === 'disconnected' ? sync.connect : undefined,
            onRetry:   (sync.status === 'error' || sync.status === 'expired') ? sync.retry : undefined,
          },
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

      {activeModule === 'orders'   && <OrdersApp   ordersCtx={ordersCtx} productsCtx={productsCtx} showToast={showToast} />}
      {activeModule === 'products' && <ProductsApp productsCtx={productsCtx} showToast={showToast} getToken={sync.getToken} />}
      {activeModule === 'planning' && <PlanningApp showToast={showToast} onSyncChange={setSync} />}

      {toast && (
        <div className="toast" style={{ borderLeftColor: toast.color }}>{toast.msg}</div>
      )}
    </div>
  )
}
