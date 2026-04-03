// ─── Palette couleurs équipements + icônes SVG ───────────────────────────────

export const COLOR_PALETTE = [
  { key: 'blue',   c300: 'var(--color-blue-300)',   c200: 'var(--color-blue-200)',   c100: 'var(--color-blue-100)'   },
  { key: 'green',  c300: 'var(--color-green-300)',  c200: 'var(--color-green-200)',  c100: 'var(--color-green-100)'  },
  { key: 'red',    c300: 'var(--color-red-300)',    c200: 'var(--color-red-200)',    c100: 'var(--color-red-100)'    },
  { key: 'orange', c300: 'var(--color-orange-300)', c200: 'var(--color-orange-200)', c100: 'var(--color-orange-100)' },
  { key: 'violet', c300: 'var(--color-violet-300)', c200: 'var(--color-violet-200)', c100: 'var(--color-violet-100)' },
  { key: 'yellow', c300: 'var(--color-yellow-300)', c200: 'var(--color-yellow-200)', c100: 'var(--color-yellow-100)' },
]

export function getEquipColor(equipment) {
  return COLOR_PALETTE[equipment.colorIndex ?? 0] ?? COLOR_PALETTE[0]
}

// ── Icône réfrigérateur filaire ───────────────────────────────────────────────

export function FrigoIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="24" viewBox="0 0 18 24" fill="currentcolor">
  <g id="Groupe_259" data-name="Groupe 259" transform="translate(-3)">
    <path id="Tracé_121" data-name="Tracé 121" d="M19.2,22.5H4.8A1.748,1.748,0,0,1,3,20.7V1.8A1.748,1.748,0,0,1,4.8,0H19.2A1.748,1.748,0,0,1,21,1.8V20.7A1.748,1.748,0,0,1,19.2,22.5ZM4.809,21H19.2c.107,0,.285,0,.3-.309V1.8c0-.107,0-.285-.309-.3H4.8c-.107,0-.285,0-.3.309V20.7C4.5,20.808,4.5,20.986,4.809,21Z" fill="#fff"/>
    <path id="Tracé_122" data-name="Tracé 122" d="M6.75,24A.75.75,0,0,1,6,23.25v-1.5a.75.75,0,0,1,1.5,0v1.5A.75.75,0,0,1,6.75,24Z" fill="#fff"/>
    <path id="Tracé_123" data-name="Tracé 123" d="M17.25,24a.75.75,0,0,1-.75-.75v-1.5a.75.75,0,0,1,1.5,0v1.5A.75.75,0,0,1,17.25,24Z" fill="#fff"/>
    <path id="Tracé_124" data-name="Tracé 124" d="M20.25,9H3.75a.75.75,0,0,1,0-1.5h16.5a.75.75,0,0,1,0,1.5Z" fill="#fff"/>
    <path id="Tracé_125" data-name="Tracé 125" d="M6.75,18A.75.75,0,0,1,6,17.25v-4.5a.75.75,0,0,1,1.5,0v4.5A.75.75,0,0,1,6.75,18Z" fill="#fff"/>
    <path id="Tracé_126" data-name="Tracé 126" d="M6.75,6A.75.75,0,0,1,6,5.25V3.75a.75.75,0,0,1,1.5,0v1.5A.75.75,0,0,1,6.75,6Z" fill="#fff"/>
  </g>
</svg>

  )
}

// ── Icône flocon filaire ──────────────────────────────────────────────────────

export function FloconIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="21.5" height="23.304" viewBox="0 0 21.5 23.304" fill="currentcolor">
  <g id="Groupe_258" data-name="Groupe 258" transform="translate(0.094 0.457)">
    <path id="Tracé_108" data-name="Tracé 108" d="M4.685,8.311a.75.75,0,0,1-.75-.75V.293a.75.75,0,0,1,1.5,0V7.561A.75.75,0,0,1,4.685,8.311Z" transform="translate(5.971 0)" fill="#fff"/>
    <path id="Tracé_109" data-name="Tracé 109" d="M6.855,4.536a.749.749,0,0,1-.469-.164L2.752,1.464A.75.75,0,0,1,3.689.293L6.855,2.825,10.021.293a.75.75,0,1,1,.937,1.171L7.324,4.371A.749.749,0,0,1,6.855,4.536Z" transform="translate(3.801 0.868)" fill="#fff"/>
    <path id="Tracé_110" data-name="Tracé 110" d="M7.175,6.873a.747.747,0,0,1-.374-.1L.506,3.138a.75.75,0,0,1,.75-1.3L7.55,5.473a.75.75,0,0,1-.376,1.4Z" transform="translate(0.333 3.255)" fill="#fff"/>
    <path id="Tracé_111" data-name="Tracé 111" d="M.656,8.559A.75.75,0,0,1,.383,7.11L4.159,5.635l-.61-4.008A.75.75,0,1,1,5.032,1.4l.7,4.6a.75.75,0,0,1-.468.811L.929,8.507A.748.748,0,0,1,.656,8.559Z" transform="translate(0 1.809)" fill="#fff"/>
    <path id="Tracé_112" data-name="Tracé 112" d="M.882,9.8A.75.75,0,0,1,.506,8.4L6.8,4.768a.75.75,0,0,1,.75,1.3L1.256,9.7A.747.747,0,0,1,.882,9.8Z" transform="translate(0.333 7.595)" fill="#fff"/>
    <path id="Tracé_113" data-name="Tracé 113" d="M4.291,12.365a.751.751,0,0,1-.742-.863l.61-4.008L.383,6.019a.75.75,0,0,1,.546-1.4L5.264,6.316a.75.75,0,0,1,.468.811l-.7,4.6A.75.75,0,0,1,4.291,12.365Z" transform="translate(0 7.452)" fill="#fff"/>
    <path id="Tracé_114" data-name="Tracé 114" d="M4.685,14.167a.75.75,0,0,1-.75-.75V6.149a.75.75,0,0,1,1.5,0v7.268A.75.75,0,0,1,4.685,14.167Z" transform="translate(5.971 8.68)" fill="#fff"/>
    <path id="Tracé_115" data-name="Tracé 115" d="M10.489,10.978a.747.747,0,0,1-.468-.164L6.855,8.281,3.689,10.813a.75.75,0,0,1-.937-1.171L6.386,6.735a.75.75,0,0,1,.937,0l3.634,2.907a.75.75,0,0,1-.469,1.336Z" transform="translate(3.801 10.416)" fill="#fff"/>
    <path id="Tracé_116" data-name="Tracé 116" d="M12.247,9.8a.747.747,0,0,1-.374-.1L5.578,6.067a.75.75,0,0,1,.75-1.3L12.622,8.4a.75.75,0,0,1-.376,1.4Z" transform="translate(7.851 7.595)" fill="#fff"/>
    <path id="Tracé_117" data-name="Tracé 117" d="M7.667,12.365a.75.75,0,0,1-.741-.637l-.7-4.6a.75.75,0,0,1,.468-.811l4.335-1.694a.75.75,0,1,1,.546,1.4L7.8,7.494l.61,4.008a.751.751,0,0,1-.742.863Z" transform="translate(9.354 7.452)" fill="#fff"/>
    <path id="Tracé_118" data-name="Tracé 118" d="M5.954,6.873a.75.75,0,0,1-.376-1.4l6.294-3.634a.75.75,0,0,1,.75,1.3L6.328,6.772A.747.747,0,0,1,5.954,6.873Z" transform="translate(7.851 3.255)" fill="#fff"/>
    <path id="Tracé_119" data-name="Tracé 119" d="M11.3,8.559a.748.748,0,0,1-.273-.052L6.694,6.813A.75.75,0,0,1,6.226,6l.7-4.6a.75.75,0,0,1,1.483.226L7.8,5.635,11.575,7.11A.75.75,0,0,1,11.3,8.559Z" transform="translate(9.354 1.809)" fill="#fff"/>
    <path id="Tracé_120" data-name="Tracé 120" d="M6.565,2.471a.749.749,0,0,1,.375.1l3.148,1.817a.75.75,0,0,1,.375.65V8.672a.75.75,0,0,1-.375.65L6.939,11.139a.75.75,0,0,1-.75,0L3.042,9.322a.75.75,0,0,1-.375-.65V5.038a.75.75,0,0,1,.375-.65L6.19,2.571A.749.749,0,0,1,6.565,2.471Zm2.4,3-2.4-1.384-2.4,1.384V8.239l2.4,1.384,2.4-1.384Z" transform="translate(4.092 4.34)" fill="#fff"/>
  </g>
</svg>

  )
}

export function getTypeIcon(type) {
  return type === 'negatif' ? <FloconIcon /> : <FrigoIcon />
}
