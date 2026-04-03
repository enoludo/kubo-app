// ─── Données de démonstration — Module Traçabilité ────────────────────────────

// ── Fournisseurs ──────────────────────────────────────────────────────────────

export const DEMO_SUPPLIERS = [
  {
    id:       'sup-001',
    name:     'Moulins du Boulou',
    category: 'flour',
    contact:  '04 68 00 00 01',
    active:   true,
  },
  {
    id:       'sup-002',
    name:     'Laiterie Ariège',
    category: 'dairy',
    contact:  '05 61 00 00 02',
    active:   true,
  },
  {
    id:       'sup-003',
    name:     'Ferme des Corbières',
    category: 'eggs',
    contact:  '04 68 00 00 03',
    active:   true,
  },
  {
    id:       'sup-004',
    name:     'Rungis Express',
    category: 'fruits',
    contact:  '01 41 00 00 04',
    active:   true,
  },
  {
    id:       'sup-005',
    name:     'Embal\'Pro',
    category: 'packaging',
    contact:  '03 20 00 00 05',
    active:   false,
  },
]

// ── Réceptions de démo (semaine du 30 mars 2026) ──────────────────────────────

export const DEMO_RECEPTIONS = [
  {
    id:          'rec-001',
    supplierId:  'sup-001',
    date:        '2026-03-30',
    conformity:  'compliant',
    temperature: null,
    products: [
      { name: 'Farine T55',  quantity: '25 kg', lot: 'L2403A', dlc: '2026-09-30' },
      { name: 'Farine T65',  quantity: '25 kg', lot: 'L2403B', dlc: '2026-09-30' },
    ],
    notes: '',
  },
  {
    id:          'rec-002',
    supplierId:  'sup-002',
    date:        '2026-03-31',
    conformity:  'compliant',
    temperature: 4,
    products: [
      { name: 'Crème fraîche 35%', quantity: '10 L',  lot: 'D3103', dlc: '2026-04-07' },
      { name: 'Beurre 84%',        quantity: '5 kg',  lot: 'D3104', dlc: '2026-04-14' },
    ],
    notes: '',
  },
  {
    id:          'rec-003',
    supplierId:  'sup-003',
    date:        '2026-04-01',
    conformity:  'non_compliant',
    temperature: null,
    products: [
      { name: 'Œufs calibre M', quantity: '180 pcs', lot: 'E0104', dlc: '2026-04-22' },
    ],
    notes: 'Emballage endommagé sur 2 alvéoles. Lot refusé.',
  },
  {
    id:          'rec-004',
    supplierId:  'sup-001',
    date:        '2026-04-02',
    conformity:  'pending',
    temperature: null,
    products: [],
    notes: '',
  },
  {
    id:          'rec-005',
    supplierId:  'sup-004',
    date:        '2026-04-02',
    conformity:  'compliant',
    temperature: 3,
    products: [
      { name: 'Fraises Gariguette', quantity: '4 kg',  lot: 'F0204A', dlc: '2026-04-05' },
      { name: 'Framboises',         quantity: '2 kg',  lot: 'F0204B', dlc: '2026-04-04' },
    ],
    notes: '',
  },
]
