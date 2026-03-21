// ─── Navigation globale — barre de modules ────────────────────────────────────
// Ce composant fait partie du shell global de l'application.
// Il sera partagé par tous les modules (Planning, Hygiène, Commandes, etc.)
// Active module : 'planning' (hardcodé jusqu'à l'ajout du routing)
import { ENABLED_MODULES } from '../config/modules'

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
    <svg xmlns="http://www.w3.org/2000/svg" width="19.069" height="19.068" fill="currentcolor" viewBox="0 0 19.069 19.068">
  <g id="Groupe_33" data-name="Groupe 33" transform="translate(0.159 0.161)" opacity="0.5">
    <path id="Tracé_48" data-name="Tracé 48" d="M12.386-.161a2.281,2.281,0,0,1,2.277,2.4l-.055,1.094a.78.78,0,0,0,.817.818l1.092-.055.114,0a2.28,2.28,0,0,1,1.529,3.972l-.815.735a.781.781,0,0,0,0,1.159l.814.734a2.28,2.28,0,0,1-1.644,3.97L15.421,14.6H15.38a.78.78,0,0,0-.779.82l.056,1.094a2.28,2.28,0,0,1-3.96,1.646l-.738-.817a.78.78,0,0,0-1.159,0l-.74.815a2.28,2.28,0,0,1-3.965-1.638l.056-1.1a.78.78,0,0,0-.819-.819l-1.094.056c-.039,0-.079,0-.118,0A2.28,2.28,0,0,1,.59,10.694L1.4,9.959A.781.781,0,0,0,1.4,8.8L.59,8.06A2.28,2.28,0,0,1,2.23,4.095l1.1.056h.042a.78.78,0,0,0,.778-.821l-.053-1.1A2.28,2.28,0,0,1,8.059.589l.735.812a.779.779,0,0,0,1.159,0L10.7.589A2.283,2.283,0,0,1,12.386-.161Zm3,5.809A2.28,2.28,0,0,1,13.11,3.254l.055-1.094A.78.78,0,0,0,11.806,1.6l-.741.813a2.279,2.279,0,0,1-3.383,0L6.949,1.6a.78.78,0,0,0-1.356.563l.052,1.094a2.28,2.28,0,0,1-2.4,2.394L2.157,5.593H2.121A.78.78,0,0,0,1.6,6.949l.813.738a2.281,2.281,0,0,1,0,3.385l-.813.734a.78.78,0,0,0,.565,1.356l1.095-.056.117,0a2.28,2.28,0,0,1,2.277,2.4l-.056,1.094a.78.78,0,0,0,1.357.557l.738-.813a2.28,2.28,0,0,1,3.384,0l.735.813a.78.78,0,0,0,1.352-.565L13.1,15.5A2.28,2.28,0,0,1,15.5,13.106l1.093.055h.04a.78.78,0,0,0,.523-1.36l-.814-.734a2.281,2.281,0,0,1,0-3.386l.814-.735a.78.78,0,0,0-.562-1.358L15.5,5.645Z"/>
    <path id="Tracé_49" data-name="Tracé 49" d="M9.375,13.641a4.266,4.266,0,0,1,0-8.531h0a4.266,4.266,0,1,1,0,8.531ZM6.609,9.373s0,0,0,0a2.766,2.766,0,1,0,.81-1.956A2.769,2.769,0,0,0,6.609,9.376Z"/>
  </g>
</svg>

  )
}

function IconProfile() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16.734" height="19.078" fill="currentcolor" viewBox="0 0 16.734 19.078">
  <g id="Groupe_34" data-name="Groupe 34" transform="translate(-1.008 0.164)" opacity="0.5">
    <path id="Tracé_22" data-name="Tracé 22" d="M9.375,9.539a4.852,4.852,0,1,1,4.852-4.852A4.857,4.857,0,0,1,9.375,9.539ZM6.023,4.687a3.352,3.352,0,1,0,.982-2.37A3.355,3.355,0,0,0,6.023,4.687Z"/>
    <path id="Tracé_23" data-name="Tracé 23" d="M10.745,5.438h0A7.593,7.593,0,0,1,5.3,3.125a.75.75,0,0,1,1.08-1.041,6.082,6.082,0,0,0,4.361,1.853,6.015,6.015,0,0,0,2.4-.494.75.75,0,1,1,.594,1.378A7.512,7.512,0,0,1,10.745,5.438Z"/>
    <path id="Tracé_24" data-name="Tracé 24" d="M16.992,18.914a.75.75,0,0,1-.75-.75,6.867,6.867,0,1,0-13.734,0,.75.75,0,0,1-1.5,0,8.367,8.367,0,0,1,16.734,0A.75.75,0,0,1,16.992,18.914Z"/>
    <path id="Tracé_25" data-name="Tracé 25" d="M9.375,15.4a3.68,3.68,0,0,1-3.68-3.68v-.587a.75.75,0,0,1,1.5,0v.587a2.18,2.18,0,0,0,4.359,0v-.587a.75.75,0,0,1,1.5,0v.587A3.684,3.684,0,0,1,9.375,15.4Z"/>
  </g>
</svg>

  )
}

// Modules de la plateforme — à compléter au fur et à mesure
const MODULES = [
  { id: 'planning',   label: 'Planning',      icon: IconPlanning,  available: true  },
  { id: 'hygiene',    label: 'Hygiène',       icon: IconHygiene,   available: false },
  { id: 'orders',     label: 'Commandes',     icon: IconOrders,    available: true  },
  { id: 'products',   label: 'Produits',      icon: IconProducts,  available: false },
  { id: 'recipes',    label: 'Recettes',      icon: IconRecipes,   available: false },
  { id: 'suppliers',  label: 'Fournisseurs',  icon: IconSuppliers, available: false },
]

export default function NavSidebar({ activeModule = 'planning', onModuleChange, badges = {} }) {
  return (
    <nav className="nav-sidebar">

      {/* Logo */}
      <div className="nav-logo">
        <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width="48px" height="48px" viewBox="0 0 48 47.999" fill="currentColor">
          <defs><clipPath id="clip-path"><rect width="48px" height="48px"/></clipPath></defs>
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
        {MODULES.filter(mod => ENABLED_MODULES.includes(mod.id)).map(mod => {
          const Icon    = mod.icon
          const isActive = mod.id === activeModule
          const badge   = badges[mod.id]
          return (
            <button
              key={mod.id}
              className={`nav-item${isActive ? ' nav-item--active' : ''}${!mod.available ? ' nav-item--disabled' : ''}`}
              title={mod.available ? mod.label : `${mod.label} (bientôt)`}
              disabled={!mod.available}
              onClick={() => mod.available && onModuleChange?.(mod.id)}
            >
              <Icon />
              {badge > 0 && <span className="nav-badge">{badge}</span>}
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
