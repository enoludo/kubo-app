// ─── Vue galerie — toutes les photos groupées par date ────────────────────────
import { useState, useMemo } from 'react'
import { createPortal }      from 'react-dom'
import { getSupplierColors } from '../utils/traceabilityColors'
import { extractFileId }     from '../utils/traceabilityPhotos'
import DriveImage             from './DriveImage'

function fmtDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

function fmtGroupDate(dateKey) {
  const [y, m, d] = dateKey.split('-')
  return new Date(Number(y), Number(m) - 1, Number(d))
    .toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

// ── Lightbox ──────────────────────────────────────────────────────────────────

function Lightbox({ item, onClose }) {
  return createPortal(
    <div className="tr-lightbox-overlay" onClick={onClose}>
      <div className="tr-lightbox" onClick={e => e.stopPropagation()}>
        <button className="tr-lightbox-close" onClick={onClose} aria-label="Fermer">×</button>
        <DriveImage
          driveUrl={item.photo_url}
          alt={item.label ?? item.productName}
          className="tr-lightbox-img"
        />
        <div className="tr-lightbox-caption">
          <span className="tr-lightbox-product">{item.label ?? item.productName}</span>
          {item.supplierName && (
            <span className="tr-lightbox-meta">{item.supplierName} — {fmtDate(item.date)}</span>
          )}
          {item.dlc && <span className="tr-lightbox-dlc">DLC : {fmtDate(item.dlc)}</span>}
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Carte photo unifiée ───────────────────────────────────────────────────────

function PhotoCard({ item, supplierColors, recentDeliveries, supplierMap, onAssociate, onClick }) {
  const isUnassociated = item.type === 'drive'

  return (
    <div
      className={`tr-gallery-card${isUnassociated ? ' tr-gallery-card--unassociated' : ''}`}
      onClick={onClick}
    >
      <div className="tr-gallery-img-wrap">
        <DriveImage
          driveUrl={item.photo_url}
          alt={item.label ?? item.productName}
          className="tr-gallery-img"
        />
        {isUnassociated && (
          <span className="tr-gallery-badge-unassociated">Non associée</span>
        )}
      </div>

      <div className="tr-gallery-caption">
        {isUnassociated ? (
          <span className="tr-gallery-product">{item.label}</span>
        ) : (
          <>
            <span className="tr-gallery-supplier"
              style={{ backgroundColor: supplierColors?.pillColor }}>
              {item.supplierName}
            </span>
            <span className="tr-gallery-product">{item.productName}</span>
          </>
        )}
      </div>

      {isUnassociated && (
        <div className="tr-gallery-associate-row" onClick={e => e.stopPropagation()}>
          <select
            className="tr-gallery-associate-select"
            defaultValue=""
            onChange={e => { if (e.target.value) onAssociate?.(e.target.value) }}
          >
            <option value="" disabled>Associer à un produit…</option>
            {recentDeliveries?.map(d => (
              <option key={d.id} value={d.id}>
                {d.productName} — {supplierMap?.[d.supplierId]?.name ?? '?'} — {fmtDate(d.date)}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}

// ── Vue principale ────────────────────────────────────────────────────────────

export default function TraceGalleryView({
  deliveries,
  allDeliveries,
  suppliers,
  drivePhotos = [],
  search = '',
  filterSupplier = '',
  onAssociatePhoto,
}) {
  const [lightboxItem, setLightboxItem] = useState(null)

  const supplierMap = useMemo(
    () => Object.fromEntries(suppliers.map(s => [s.id, s])),
    [suppliers]
  )

  // fileIds déjà liés à une livraison (toutes, pas seulement filtrées)
  const linkedFileIds = useMemo(() => {
    const ids = new Set()
    const source = allDeliveries ?? deliveries
    source.forEach(d => {
      const id = extractFileId(d.photo_url)
      if (id) ids.add(id)
    })
    return ids
  }, [allDeliveries, deliveries])

  // Photos associées — `deliveries` est déjà filtré par le parent
  const associatedItems = useMemo(() => {
    return deliveries
      .filter(d => d.photo_url && supplierMap[d.supplierId])
      .map(d => ({
        type:         'delivery',
        id:           d.id,
        photo_url:    d.photo_url,
        productName:  d.productName,
        supplierName: supplierMap[d.supplierId].name,
        supplierId:   d.supplierId,
        date:         d.date,
        dlc:          d.dlc ?? null,
        sortKey:      d.date,
      }))
  }, [deliveries, supplierMap])

  // Photos non associées — filtrées par search, masquées si supplier actif
  const unassociatedItems = useMemo(() => {
    if (filterSupplier) return []   // pas de supplier → on les masque
    const q = search.trim().toLowerCase()
    return drivePhotos
      .filter(p => !linkedFileIds.has(p.fileId))
      .filter(p => {
        if (!q) return true
        const label = (p.description || p.name || '').toLowerCase()
        return label.includes(q)
      })
      .map(p => ({
        type:        'drive',
        id:          `drive-${p.fileId}`,
        fileId:      p.fileId,
        photo_url:   p.url,
        label:       p.description || p.name,
        createdTime: p.createdTime,
        date:        p.createdTime?.slice(0, 10) ?? null,
        sortKey:     p.createdTime ?? p.createdTime?.slice(0, 10) ?? '',
      }))
  }, [drivePhotos, linkedFileIds, filterSupplier, search])

  // Livraisons récentes (30j) pour le select d'association
  const recentDeliveries = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    const cutoff = d.toISOString().slice(0, 10)
    const source = allDeliveries ?? deliveries
    return source
      .filter(d => d.date >= cutoff)
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [allDeliveries, deliveries])

  // Toutes les photos fusionnées et groupées par date
  const dateGroups = useMemo(() => {
    const all = [...associatedItems, ...unassociatedItems]
    if (all.length === 0) return []

    const map = new Map()
    all.forEach(item => {
      const key = item.date ?? '1970-01-01'
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(item)
    })

    // Tri intra-groupe : sortKey décroissant (ISO pour Drive, date pour livraison)
    map.forEach(items => items.sort((a, b) => (b.sortKey ?? '').localeCompare(a.sortKey ?? '')))

    // Tri des groupes : date décroissante
    return [...map.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([dateKey, items]) => ({ dateKey, items }))
  }, [associatedItems, unassociatedItems])

  const totalCount = dateGroups.reduce((n, g) => n + g.items.length, 0)

  return (
    <div className="tr-gallery-view">

      {totalCount === 0 ? (
        <div className="tr-list-empty">Aucune photo à afficher.</div>
      ) : (
        dateGroups.map(({ dateKey, items }) => (
          <div key={dateKey} className="tr-gallery-date-group">
            <div className="tr-gallery-date-label">{fmtGroupDate(dateKey)}</div>
            <div className="tr-gallery-grid">
              {items.map(item => (
                <PhotoCard
                  key={item.id}
                  item={item}
                  supplierColors={item.supplierId ? getSupplierColors(supplierMap[item.supplierId] ?? {}) : null}
                  recentDeliveries={recentDeliveries}
                  supplierMap={supplierMap}
                  onAssociate={deliveryId => onAssociatePhoto?.(deliveryId, item.photo_url)}
                  onClick={() => setLightboxItem(item)}
                />
              ))}
            </div>
          </div>
        ))
      )}

      {lightboxItem && (
        <Lightbox item={lightboxItem} onClose={() => setLightboxItem(null)} />
      )}
    </div>
  )
}
