// ─── Données de démonstration — Module Traçabilité ────────────────────────────

// ── Fournisseurs ──────────────────────────────────────────────────────────────

export const DEMO_SUPPLIERS = [
  {
    id:          'sup-001',
    name:        'Moulins du Boulou',
    contactName: 'Jean-Pierre Fabre',
    contact:     '04 68 00 00 01',
    colorIndex:  0,   // blue
    active:      true,
  },
  {
    id:          'sup-002',
    name:        'Laiterie Ariège',
    contactName: 'Marie Soula',
    contact:     '05 61 00 00 02',
    colorIndex:  1,   // green
    active:      true,
  },
  {
    id:          'sup-003',
    name:        'Ferme des Corbières',
    contactName: null,
    contact:     '04 68 00 00 03',
    colorIndex:  3,   // orange
    active:      true,
  },
  {
    id:          'sup-004',
    name:        'Rungis Express',
    contactName: 'Laurent Dupuis',
    contact:     '01 41 00 00 04',
    colorIndex:  1,   // green
    active:      true,
  },
  {
    id:          'sup-005',
    name:        'Embal\'Pro',
    contactName: null,
    contact:     '03 20 00 00 05',
    colorIndex:  4,   // violet
    active:      false,
  },
]

// ── Produits livrés — modèle plat (1 entrée = 1 produit) ─────────────────────
// Schéma : id | supplierId | date | productName | weight | lot | dlc |
//          temperature | conformity | nonConformityNote | photo_url

export const DEMO_PRODUCTS = [
  {
    id:                 'dp-001',
    supplierId:         'sup-001',
    date:               '2026-03-30',
    productName:        'Farine T55',
    weight:             '25 kg',
    lot:                'L2403A',
    dlc:                '2026-09-30',
    temperature:        3.5,
    conformity:         'compliant',
    nonConformityNote:  null,
    photo_url:          null,
  },
  {
    id:                 'dp-002',
    supplierId:         'sup-001',
    date:               '2026-03-30',
    productName:        'Farine T65',
    weight:             '25 kg',
    lot:                'L2403B',
    dlc:                '2026-09-30',
    temperature:        3.5,
    conformity:         'compliant',
    nonConformityNote:  null,
    photo_url:          null,
  },
  {
    id:                 'dp-003',
    supplierId:         'sup-002',
    date:               '2026-03-31',
    productName:        'Crème fraîche 35%',
    weight:             '5 L',
    lot:                'D3103',
    dlc:                '2026-04-07',
    temperature:        4.0,
    conformity:         'compliant',
    nonConformityNote:  null,
    photo_url:          null,
  },
  {
    id:                 'dp-004',
    supplierId:         'sup-002',
    date:               '2026-03-31',
    productName:        'Beurre 84%',
    weight:             '5 kg',
    lot:                'D3104',
    dlc:                '2026-04-14',
    temperature:        4.0,
    conformity:         'compliant',
    nonConformityNote:  null,
    photo_url:          null,
  },
  {
    id:                 'dp-005',
    supplierId:         'sup-003',
    date:               '2026-04-01',
    productName:        'Œufs calibre M',
    weight:             '60 pcs',
    lot:                'E0104',
    dlc:                '2026-04-22',
    temperature:        3.5,
    conformity:         'non_compliant',
    nonConformityNote:  'Emballage endommagé sur 2 alvéoles. Lot refusé.',
    photo_url:          null,
  },
  {
    id:                 'dp-006',
    supplierId:         'sup-004',
    date:               '2026-04-02',
    productName:        'Fraises Gariguette',
    weight:             '2 kg',
    lot:                'F0204A',
    dlc:                '2026-04-05',
    temperature:        3.0,
    conformity:         'compliant',
    nonConformityNote:  null,
    photo_url:          null,
  },
  {
    id:                 'dp-007',
    supplierId:         'sup-004',
    date:               '2026-04-02',
    productName:        'Framboises',
    weight:             '2 kg',
    lot:                'F0204B',
    dlc:                '2026-04-04',
    temperature:        3.0,
    conformity:         'compliant',
    nonConformityNote:  null,
    photo_url:          null,
  },
]
