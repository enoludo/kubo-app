// ─── Liste d'étapes de recette — numérotée ───────────────────────────────────

function formatDuration(min) {
  if (!min) return null
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h} h ${m} min` : `${h} h`
}

export default function RecipeStepList({ steps = [] }) {
  if (!steps.length) {
    return <p className="recipe-empty">Aucune étape de recette renseignée.</p>
  }

  const sorted = [...steps].sort((a, b) => a.order - b.order)

  return (
    <ol className="recipe-steps">
      {sorted.map(step => (
        <li key={step.id} className="recipe-step">
          <div className="recipe-step-num">{step.order}</div>
          <div className="recipe-step-body">
            <p className="recipe-step-desc">{step.description}</p>
            <div className="recipe-step-meta">
              {step.temperatureC != null && (
                <span className="recipe-step-tag recipe-step-tag--temp">
                  🌡 {step.temperatureC} °C
                </span>
              )}
              {step.durationMin != null && (
                <span className="recipe-step-tag recipe-step-tag--time">
                  ⏱ {formatDuration(step.durationMin)}
                </span>
              )}
              {step.equipment && (
                <span className="recipe-step-tag recipe-step-tag--equip">
                  🔧 {step.equipment}
                </span>
              )}
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}
