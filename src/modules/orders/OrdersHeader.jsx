// ─── Header du module Commandes ───────────────────────────────────────────────
import ConnectionDot from '../../components/ConnectionDot'

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

function ArrowLeft() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12.728" height="12.728" viewBox="0 0 12.728 12.728" fill="currentColor">
      <path d="M613.332,602.91h-2v-9h9v2h-7Z" transform="translate(-852.235 18.683) rotate(-45)"/>
    </svg>
  )
}

function ArrowRight() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12.728" height="12.728" viewBox="0 0 12.728 12.728" fill="currentColor">
      <path d="M8,9H-1V0H1V7H8Z" transform="translate(5.657 12.021) rotate(-135)"/>
    </svg>
  )
}



// ── Header principal ──────────────────────────────────────────────────────────

export default function OrdersHeader({
  year, month, upcomingCount,
  onPrev, onNext, onNewOrder,
  webflowStatus, webflowError, onRetryWebflow,
  sheetsStatus, sheetsError, onSheetsConnect, onSheetsRetry,
}) {
  return (
    <header className="header">
      <div className="header-nav-box">

        {/* Gauche : badge commandes à venir */}
        <div className="header-nav-left">
          {upcomingCount > 0 ? (
            <span className="orders-upcoming-badge">
              <span className="orders-upcoming-badge-count">{upcomingCount}</span>
              <span>commande{upcomingCount > 1 ? 's' : ''} à venir</span>
            </span>
          ) : (
            <span className="orders-upcoming-empty">Aucune commande à venir</span>
          )}
        </div>

        {/* Centre : navigation mois */}
        <div className="header-nav-center">
          <button className="nav-btn" onClick={onPrev} aria-label="Mois précédent">
            <ArrowLeft />
          </button>
          <span className="orders-month-label">
            {MONTHS_FR[month]} {year}
          </span>
          <button className="nav-btn" onClick={onNext} aria-label="Mois suivant">
            <ArrowRight />
          </button>
        </div>

        {/* Droite : statut Webflow + nouvelle commande */}
        <div className="header-nav-right">
          
          <button className="orders-new-btn add-trigger add-trigger--labeled" onClick={onNewOrder}>
            + Nouvelle commande
          </button>
        </div>

      </div>
    </header>
  )
}
