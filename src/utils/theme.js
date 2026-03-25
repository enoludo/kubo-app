// ─── Lecture des variables CSS ────────────────────────────────────────────────
function getCSSVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

export const COLORS = {
  // Types de shifts — planning-tokens.css
  work:          () => getCSSVar('--planning-shift-work-color'),
  leave:         () => getCSSVar('--planning-shift-leave-color'),
  sick:          () => getCSSVar('--planning-shift-sick-color'),
  school:        () => getCSSVar('--planning-shift-school-color'),
  rest:          () => getCSSVar('--planning-shift-rest-color'),
  absent:        () => getCSSVar('--planning-shift-absent-color'),
  // Canaux commandes — orders-tokens.css
  orderWeb:      () => getCSSVar('--orders-channel-web-color'),
  orderBoutique: () => getCSSVar('--orders-channel-boutique-color'),
  orderBrunch:   () => getCSSVar('--orders-channel-brunch-color'),
}

// Map type → couleur accent (appelée après montage DOM)
export function getTypeColor(type) {
  const map = {
    work:   '--planning-shift-work-color',
    leave:  '--planning-shift-leave-color',
    sick:   '--planning-shift-sick-color',
    school: '--planning-shift-school-color',
    rest:   '--planning-shift-rest-color',
    absent: '--planning-shift-absent-color',
  }
  return map[type] ? getCSSVar(map[type]) : '#cccccc'
}

// Map canal → couleur accent
export function getOrderChannelColor(channel) {
  const map = {
    web:      '--orders-channel-web-color',
    boutique: '--orders-channel-boutique-color',
    brunch:   '--orders-channel-brunch-color',
  }
  return map[channel] ? getCSSVar(map[channel]) : '#cccccc'
}
