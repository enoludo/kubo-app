// ─── Carte de pièce dans la colonne gauche du calendrier ─────────────────────
import EntityCard from '../../../design-system/components/EntityCard/EntityCard'

export default function CleaningZoneCard({ zone, zoneCount, activeCount, weekStats, onClick }) {
  const { done, total } = weekStats

  const subtitle  = `${zoneCount} zone${zoneCount !== 1 ? 's' : ''} · ${activeCount} tâche${activeCount !== 1 ? 's' : ''}`
  const noteText  = total > 0 ? `${done}/${total} faites` : null
  const noteColor = total > 0 && done === total
    ? 'var(--cln-status-done)'
    : 'var(--color-text-muted)'

  return (
    <EntityCard
      avatar={{ bg: zone.token, color: 'var(--color-white)', icon: zone.icon ?? undefined, initials: zone.icon ? undefined : zone.initials }}
      title={zone.label}
      subtitle={subtitle}
      note={noteText ? { text: noteText, color: noteColor } : undefined}
      onClick={onClick}
    />
  )
}
