// ─── EntityCard — composant générique partagé ────────────────────────────────
// Utilisé par tous les modules nécessitant une carte d'entité cliquable.
//
// Props :
//   avatar       { bg?, color?, icon?, initials? }
//   accentColor  string — couleur de bordure gauche (optionnel)
//   title        string — titre principal (requis)
//   subtitle     string — sous-titre (optionnel)
//   titleAddon   ReactNode — élément affiché après le titre (ex: icône email)
//   metric       { primary, suffix? } — métrique principale
//   note         { text, color? } — ligne colorée sous la métrique
//   bar          { pct, color? } — barre de progression 0-100
//   archived     boolean
//   onClick      function

import './EntityCard.css'

export default function EntityCard({
  avatar,
  accentColor,
  title,
  subtitle,
  titleAddon,
  metric,
  note,
  bar,
  archived,
  onClick,
}) {
  const hasStats = metric || note || bar

  return (
    <div
      className={`entity-card${archived ? ' entity-card--archived' : ''}`}
      style={accentColor ? { borderLeft: `3px solid ${accentColor}` } : undefined}
      onClick={onClick}
    >

      {/* ── Profil ── */}
      <div className="ec-profile">
        <div
          className="ec-avatar"
          style={avatar?.bg ? { background: avatar.bg, color: avatar.color } : undefined}
        >
          {avatar?.icon ?? avatar?.initials}
        </div>

        <div className="ec-identity">
          <div className="ec-title-row">
            <span className="ec-title">{title}</span>
            {titleAddon && (
              <span className="ec-title-addon">{titleAddon}</span>
            )}
          </div>
          {subtitle && <span className="ec-subtitle">{subtitle}</span>}
        </div>
      </div>

      {/* ── Stats ── */}
      {hasStats && (
        <div className="ec-stats">
          {metric && (
            <div className="ec-metric-row">
              <span className="ec-metric">
                {metric.primary}
                {metric.suffix && (
                  <span className="ec-metric-sub">{metric.suffix}</span>
                )}
              </span>
            </div>
          )}
          {note && (
            <span
              className="ec-note"
              style={note.color ? { color: note.color } : undefined}
            >
              {note.text}
            </span>
          )}
        </div>
      )}

    </div>
  )
}
