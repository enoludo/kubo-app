// ─── Tableau tailles / prix / coût / marge ───────────────────────────────────

function formatPrice(n) {
  if (n == null) return '—'
  return n.toFixed(2).replace('.', ',') + ' €'
}

function formatMargin(price, cost) {
  if (!price || !cost) return null
  const margin = ((price - cost) / price) * 100
  return Math.round(margin)
}

function formatDuration(min) {
  if (!min) return '—'
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h} h ${m} min` : `${h} h`
}

export default function SizeTable({ sizes = [], showCost = false }) {
  if (!sizes.length) {
    return <p className="size-table-empty">Aucune taille renseignée.</p>
  }

  return (
    <div className="size-table-wrap">
      <table className="size-table">
        <thead>
          <tr>
            <th>Taille</th>
            <th>Prix</th>
            {showCost && <th>Coût mat.</th>}
            {showCost && <th>Marge</th>}
            <th>Poids</th>
            <th>Temps prod.</th>
            <th>Qté min</th>
          </tr>
        </thead>
        <tbody>
          {sizes.map(s => {
            const margin = showCost ? formatMargin(s.price, s.costPerUnit) : null
            return (
              <tr key={s.id}>
                <td className="size-table-label">{s.label}</td>
                <td className="size-table-price">{formatPrice(s.price)}</td>
                {showCost && <td>{formatPrice(s.costPerUnit)}</td>}
                {showCost && (
                  <td>
                    {margin != null ? (
                      <span className={`size-table-margin${margin >= 60 ? ' size-table-margin--good' : margin >= 40 ? ' size-table-margin--ok' : ' size-table-margin--low'}`}>
                        {margin} %
                      </span>
                    ) : '—'}
                  </td>
                )}
                <td>{s.weightG ? `${s.weightG} g` : '—'}</td>
                <td>{formatDuration(s.productionTimeMin)}</td>
                <td>{s.minOrderQty ?? 1}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
