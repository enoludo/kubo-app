// ─── Données de démonstration — Commandes Mars 2026 ──────────────────────────
// Tableau vidé — les commandes réelles viennent de Webflow via polling.
// Remettre des données ici uniquement pour tester hors connexion Webflow.

const demoOrders = [
  // (vide)
]

/*
const _demoOrders_archive = [

  // ── Samedi 7 mars — 2 boutique + 1 site web + 1 brunch ──────────────────

  {
    id: 'demo-o-01',
    channel: 'boutique',
    status: 'delivered',
    paid: false,
    customer: { name: 'Marie Lecomte', phone: '06 12 34 56 78', email: null },
    pickupDate: '2026-03-07',
    pickupTime: '10:00',
    items: [
      { productId: 'p-01', label: 'Fraisier', qty: 1, unitPrice: 42 },
    ],
    note: null,
    totalPrice: 42,
    createdAt: '2026-03-04T09:15:00.000Z',
    updatedAt: '2026-03-07T10:12:00.000Z',
    webflowOrderId: null,
  },

  {
    id: 'demo-o-02',
    channel: 'boutique',
    status: 'delivered',
    paid: false,
    customer: { name: 'Thomas Garnier', phone: '07 89 01 23 45', email: null },
    pickupDate: '2026-03-07',
    pickupTime: '11:30',
    items: [
      { productId: 'p-06', label: 'Tarte citron meringuée', qty: 1, unitPrice: 26 },
      { productId: 'p-12', label: 'Macaron (à la pièce)',   qty: 6, unitPrice: 2.0 },
    ],
    note: 'Boîte cadeau si possible',
    totalPrice: 38,
    createdAt: '2026-03-05T14:30:00.000Z',
    updatedAt: '2026-03-07T11:35:00.000Z',
    webflowOrderId: null,
  },

  {
    id: 'demo-o-03',
    channel: 'web',
    status: 'delivered',
    paid: true,
    customer: { name: 'Sophie Durand', phone: '06 55 66 77 88', email: 'sophie.durand@email.com' },
    pickupDate: '2026-03-07',
    pickupTime: '14:00',
    items: [
      { productId: 'p-03', label: 'Paris-Brest', qty: 1, unitPrice: 36 },
    ],
    note: null,
    totalPrice: 36,
    createdAt: '2026-03-03T18:20:00.000Z',
    updatedAt: '2026-03-07T14:05:00.000Z',
    webflowOrderId: 'wf-order-001',
  },

  {
    id: 'demo-o-04',
    channel: 'brunch',
    status: 'delivered',
    paid: false,
    customer: { name: 'Famille Martin', phone: '06 33 44 55 66', email: null },
    pickupDate: '2026-03-07',
    pickupTime: '10:00',
    items: [
      { productId: 'p-15', label: 'Formule brunch 2 pers.', qty: 2, unitPrice: 38 },
    ],
    note: '1 végétarien',
    totalPrice: 76,
    createdAt: '2026-03-02T11:00:00.000Z',
    updatedAt: '2026-03-07T10:00:00.000Z',
    webflowOrderId: null,
  },

  // ── Lundi 10 mars — 1 boutique ────────────────────────────────────────────

  {
    id: 'demo-o-05',
    channel: 'boutique',
    status: 'delivered',
    paid: false,
    customer: { name: 'Isabelle Morin', phone: '06 71 82 93 04', email: null },
    pickupDate: '2026-03-10',
    pickupTime: '09:00',
    items: [
      { productId: 'p-05', label: 'Tarte aux fraises', qty: 1, unitPrice: 28 },
    ],
    note: null,
    totalPrice: 28,
    createdAt: '2026-03-08T16:45:00.000Z',
    updatedAt: '2026-03-10T09:08:00.000Z',
    webflowOrderId: null,
  },

  // ── Mercredi 11 mars — 1 site web ─────────────────────────────────────────

  {
    id: 'demo-o-06',
    channel: 'web',
    status: 'delivered',
    paid: true,
    customer: { name: 'Lucas Bernard', phone: '07 14 25 36 47', email: 'lucas.b@gmail.com' },
    pickupDate: '2026-03-11',
    pickupTime: '15:00',
    items: [
      { productId: 'p-02', label: 'Charlotte aux framboises', qty: 1, unitPrice: 38 },
      { productId: 'p-13', label: 'Éclair chocolat / café',   qty: 2, unitPrice: 4.5 },
    ],
    note: null,
    totalPrice: 47,
    createdAt: '2026-03-07T10:30:00.000Z',
    updatedAt: '2026-03-11T15:03:00.000Z',
    webflowOrderId: 'wf-order-002',
  },

  // ── Vendredi 13 mars — 1 site web ─────────────────────────────────────────

  {
    id: 'demo-o-07',
    channel: 'web',
    status: 'delivered',
    paid: true,
    customer: { name: 'Camille Petit', phone: '06 58 69 70 81', email: 'camille.petit@email.fr' },
    pickupDate: '2026-03-13',
    pickupTime: '12:00',
    items: [
      { productId: 'p-04', label: 'Opéra', qty: 1, unitPrice: 40 },
    ],
    note: 'Écrire "Joyeux anniversaire Léa" sur le gâteau',
    totalPrice: 40,
    createdAt: '2026-03-10T09:00:00.000Z',
    updatedAt: '2026-03-13T12:07:00.000Z',
    webflowOrderId: 'wf-order-003',
  },

  // ── Vendredi 20 mars — 2 boutique (à venir) + 1 site web (livré) ──────────

  {
    id: 'demo-o-08',
    channel: 'boutique',
    status: 'new',
    paid: false,
    customer: { name: 'Nathalie Rousseau', phone: '06 92 03 14 25', email: null },
    pickupDate: '2026-03-20',
    pickupTime: '10:30',
    items: [
      { productId: 'p-01', label: 'Fraisier',            qty: 1, unitPrice: 42 },
      { productId: 'p-12', label: 'Macaron (à la pièce)', qty: 8, unitPrice: 2.0 },
    ],
    note: 'Anniversaire — prévoir bougies',
    totalPrice: 58,
    createdAt: '2026-03-16T11:20:00.000Z',
    updatedAt: '2026-03-16T11:20:00.000Z',
    webflowOrderId: null,
  },

  {
    id: 'demo-o-09',
    channel: 'boutique',
    status: 'preparing',
    paid: false,
    customer: { name: 'Antoine Lefèvre', phone: '07 36 47 58 69', email: null },
    pickupDate: '2026-03-20',
    pickupTime: '16:00',
    items: [
      { productId: 'p-07', label: 'Tarte Tatin',     qty: 1, unitPrice: 24 },
      { productId: 'p-14', label: 'Chou à la crème', qty: 4, unitPrice: 3.8 },
    ],
    note: null,
    totalPrice: 39.2,
    createdAt: '2026-03-17T08:50:00.000Z',
    updatedAt: '2026-03-19T07:30:00.000Z',
    webflowOrderId: null,
  },

  {
    id: 'demo-o-10',
    channel: 'web',
    status: 'delivered',
    paid: true,
    customer: { name: 'Julie Fontaine', phone: '06 74 85 96 07', email: 'j.fontaine@pro.com' },
    pickupDate: '2026-03-20',
    pickupTime: '11:00',
    items: [
      { productId: 'p-08', label: 'Tarte au chocolat', qty: 1, unitPrice: 26 },
    ],
    note: null,
    totalPrice: 26,
    createdAt: '2026-03-14T19:10:00.000Z',
    updatedAt: '2026-03-19T16:00:00.000Z',
    webflowOrderId: 'wf-order-004',
  },
]
*/

export default demoOrders
