// ─── Lecture des variables CSS ────────────────────────────────────────────────
function getCSSVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

export const COLORS = {
  // Types de shifts
  work:          () => getCSSVar('--type-work'),
  leave:         () => getCSSVar('--type-leave'),
  sick:          () => getCSSVar('--type-sick'),
  school:        () => getCSSVar('--type-school'),
  rest:          () => getCSSVar('--type-rest'),
  absent:        () => getCSSVar('--type-absent'),
  // Canaux commandes
  orderWeb:      () => getCSSVar('--order-web'),
  orderBoutique: () => getCSSVar('--order-boutique'),
  orderBrunch:   () => getCSSVar('--order-brunch'),
}

// Map type → couleur (appelée après montage DOM)
export function getTypeColor(type) {
  const map = {
    work:   '--type-work',
    leave:  '--type-leave',
    sick:   '--type-sick',
    school: '--type-school',
    rest:   '--type-rest',
    absent: '--type-absent',
  }
  return map[type] ? getCSSVar(map[type]) : '#cccccc'
}

// Map canal → couleur
export function getOrderChannelColor(channel) {
  const map = {
    web:      '--order-web',
    boutique: '--order-boutique',
    brunch:   '--order-brunch',
  }
  return map[channel] ? getCSSVar(map[channel]) : '#cccccc'
}
