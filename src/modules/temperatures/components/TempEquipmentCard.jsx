import EntityCard from '../../../design-system/components/EntityCard/EntityCard'
import { getEquipColor, getTypeIcon } from '../utils/tempColors.jsx'

const TYPE_LABEL = {
  positif: 'Froid positif',
  negatif: 'Froid négatif',
}

export default function TempEquipmentCard({ equipment, onEdit }) {
  const palette = getEquipColor(equipment)

  return (
    <EntityCard
      avatar={{ bg: palette.c300, color: 'var(--color-white)', icon: getTypeIcon(equipment.type) }}
      title={equipment.name}
      subtitle={TYPE_LABEL[equipment.type] ?? equipment.type}
      metric={{ primary: `${equipment.minTemp}°C`, suffix: ` / ${equipment.maxTemp}°C` }}
      onClick={() => onEdit(equipment)}
    />
  )
}
