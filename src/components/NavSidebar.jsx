// ─── Navigation globale — barre de modules ────────────────────────────────────
// Ce composant fait partie du shell global de l'application.
// Il sera partagé par tous les modules (Planning, Hygiène, Commandes, etc.)
// Active module : 'planning' (hardcodé jusqu'à l'ajout du routing)

function IconPlanning() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8"  y1="2" x2="8"  y2="6"/>
      <line x1="3"  y1="10" x2="21" y2="10"/>
    </svg>
  )
}

function IconHygiene() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L3 7v6c0 5 4 9.3 9 10.3C17 22.3 21 18 21 13V7z"/>
      <polyline points="9 12 11 14 15 10"/>
    </svg>
  )
}

function IconOrders() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  )
}

function IconProducts() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9h18M3 9a9 9 0 0 1 18 0M3 9c0 5 4 9 9 9s9-4 9-9"/>
      <path d="M12 9v9M8 13h8"/>
    </svg>
  )
}

function IconRecipes() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      <line x1="9" y1="7"  x2="15" y2="7"/>
      <line x1="9" y1="11" x2="15" y2="11"/>
    </svg>
  )
}

function IconSuppliers() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="1"/>
      <path d="M16 8h4l3 5v3h-7V8z"/>
      <circle cx="5.5"  cy="18.5" r="2.5"/>
      <circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  )
}

function IconSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )
}

function IconProfile() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

// Modules de la plateforme — à compléter au fur et à mesure
const MODULES = [
  { id: 'planning',   label: 'Planning',      icon: IconPlanning,  available: true  },
  { id: 'hygiene',    label: 'Hygiène',       icon: IconHygiene,   available: false },
  { id: 'orders',     label: 'Commandes',     icon: IconOrders,    available: false },
  { id: 'products',   label: 'Produits',      icon: IconProducts,  available: false },
  { id: 'recipes',    label: 'Recettes',      icon: IconRecipes,   available: false },
  { id: 'suppliers',  label: 'Fournisseurs',  icon: IconSuppliers, available: false },
]

export default function NavSidebar({ activeModule = 'planning' }) {
  return (
    <nav className="nav-sidebar">

      {/* Logo */}
      <div className="nav-logo">
        <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width="36" height="36" viewBox="0 0 48 47.999" fill="currentColor">
          <defs><clipPath id="clip-path"><rect width="48" height="47.999"/></clipPath></defs>
          <g transform="translate(0 0.004)">
            <path d="M320.276,279.849l1.649-1.648,4.237,5.562h2.589l-5.349-7.038,5.273-5.273h-1.155l-7.248,7.248v-7.248h-2.065v12.31h2.067Z" transform="translate(-306.901 -261.809)"/>
            <g transform="translate(0 -0.004)">
              <g transform="translate(0 0)" clipPath="url(#clip-path)">
                <path d="M17.8,677.692h0a3.424,3.424,0,0,0,1.366-6.563,3.131,3.131,0,0,0-1.73-5.741H11.694v8.639L.566,662.9l-.566.56L23.883,687.34l.564-.561-9.086-9.087Zm-1.614-6.86H13.757v-4.626h2.429a2.313,2.313,0,0,1,0,4.626m-2.428.81h2.8a2.618,2.618,0,1,1,0,5.237H14.547l-.789-.789Z" transform="translate(0 -639.341)"/>
                <path d="M663.43,0l-.563.563L674.1,11.793v4.986a3.617,3.617,0,0,1-6.977,1.343l0-.009a2.973,2.973,0,0,1-.265-1.223V9.643h-2.066v7.25a5.071,5.071,0,0,0,5.063,5h.059a5.064,5.064,0,0,0,5-5.006V12.607L686.75,24.441l.561-.564Z" transform="translate(-639.312 0.004)"/>
                <path d="M692.54,732.86v-.005h-.232a6.183,6.183,0,1,0,.232.005m-4.312,6.824,0-.112v-1.057c0-2.668,1.837-4.842,4.087-4.845s4.085,2.179,4.089,4.845v.419a.342.342,0,0,0,0,.075v.679a5.269,5.269,0,0,1-1.256,3.318,3.632,3.632,0,0,1-5.655,0,5.27,5.27,0,0,1-1.256-3.322" transform="translate(-661.77 -706.812)"/>
              </g>
            </g>
          </g>
        </svg>
      </div>

      {/* Modules */}
      <div className="nav-modules">
        {MODULES.map(mod => {
          const Icon = mod.icon
          const isActive = mod.id === activeModule
          return (
            <button
              key={mod.id}
              className={`nav-item${isActive ? ' nav-item--active' : ''}${!mod.available ? ' nav-item--disabled' : ''}`}
              title={mod.available ? mod.label : `${mod.label} (bientôt)`}
              disabled={!mod.available}
            >
              <Icon />
            </button>
          )
        })}
      </div>

      {/* Actions globales */}
      <div className="nav-bottom">
        <button className="nav-item nav-item--sm" title="Paramètres" disabled>
          <IconSettings />
        </button>
        <button className="nav-item nav-item--sm" title="Profil" disabled>
          <IconProfile />
        </button>
      </div>

    </nav>
  )
}
