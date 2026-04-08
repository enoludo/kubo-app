// ─── Vue liste — tous les produits livrés, triés par date décroissante ─────────
import { useState, useMemo } from 'react'
import DriveImage from './DriveImage'

const CONFORMITY_META = {
  compliant:     { label: 'Conforme',     bg: 'var(--tr-status-compliant-bg)',     color: 'var(--tr-status-compliant-text)'     },
  non_compliant: { label: 'Non conforme', bg: 'var(--tr-status-non-compliant-bg)', color: 'var(--tr-status-non-compliant-text)' },
}

function fmtDate(dateStr) {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

function fmtDlc(dlc) {
  if (!dlc) return null
  const [y, m, d] = dlc.split('-')
  const date  = new Date(Number(y), Number(m) - 1, Number(d))
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const diff  = Math.round((date - today) / 86400000)
  const label = `${d}/${m}/${y}`
  if (diff < 0)  return { label, expired: true }
  if (diff <= 3) return { label, soon: true }
  return { label }
}

export default function TraceListView({ deliveries, suppliers, onEditDelivery }) {
  const [filterStatus, setFilterStatus] = useState('')

  const supplierMap = useMemo(
    () => Object.fromEntries(suppliers.map(s => [s.id, s])),
    [suppliers]
  )

  const rows = useMemo(() => {
    return [...deliveries]
      .filter(d => supplierMap[d.supplierId])
      .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
  }, [deliveries, supplierMap])

  const filtered = useMemo(() => {
    if (!filterStatus) return rows
    return rows.filter(d => d.conformity === filterStatus)
  }, [rows, filterStatus])

  return (
    <div className="tr-list-view">

      {/* ── Filtre statut (conformité) ── */}
      <div className="tr-list-filters">
        <select className="tr-list-filter-select" value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)} aria-label="Filtrer par statut">
          <option value="">Tous statuts</option>
          <option value="compliant">Conforme</option>
          <option value="non_compliant">Non conforme</option>
        </select>

        {filterStatus && (
          <button className="tr-list-filter-reset" onClick={() => setFilterStatus('')}>Effacer</button>
        )}

        <span className="tr-list-count">{filtered.length} entrée{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── Tableau ── */}
      {filtered.length === 0 ? (
        <div className="tr-list-empty">Aucun produit correspondant aux filtres.</div>
      ) : (
        <div className="tr-list-table-wrap">
          <table className="tr-list-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Fournisseur</th>
                <th>Produit</th>
                <th>Poids / Volume</th>
                <th>N° lot</th>
                <th>DLC / DDM</th>
                <th>Temp.</th>
                <th>Statut</th>
                <th>Photo</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => {
                const meta     = CONFORMITY_META[d.conformity] ?? CONFORMITY_META.compliant
                const supplier = supplierMap[d.supplierId]
                const dlc      = fmtDlc(d.dlc)
                return (
                  <tr key={d.id} className="tr-list-row"
                    onClick={() => onEditDelivery(d)}>
                    <td className="tr-list-cell tr-list-cell--date">{fmtDate(d.date)}</td>
                    <td className="tr-list-cell tr-list-cell--supplier">{supplier?.name ?? '—'}</td>
                    <td className="tr-list-cell tr-list-cell--product">{d.productName}</td>
                    <td className="tr-list-cell">{d.weight ?? '—'}</td>
                    <td className="tr-list-cell">{d.lot ?? '—'}</td>
                    <td className={`tr-list-cell tr-list-cell--dlc${dlc?.expired ? ' tr-dlc--expired' : dlc?.soon ? ' tr-dlc--soon' : ''}`}>
                      {dlc?.label ?? '—'}
                    </td>
                    <td className="tr-list-cell tr-list-cell--temp">
                      {d.temperature != null ? `${Number(d.temperature).toFixed(1)} °C` : '—'}
                    </td>
                    <td className="tr-list-cell tr-list-cell--status">
                      <span className="tr-list-status-pill"
                        style={{ backgroundColor: meta.bg, color: meta.color }}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="tr-list-cell tr-list-cell--photo">
                      {d.photo_url
                        ? <DriveImage driveUrl={d.photo_url} alt="étiquette" className="tr-list-thumb" />
                        : <span className="tr-list-no-photo">—</span>
                      }
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
