// ─── Données de démo — tâches de nettoyage ────────────────────────────────────
// UUIDs fixes pour la cohérence entre sessions.
// Ne pas modifier ici — éditer via l'interface.

export const DEMO_CLEANING_TASKS = [

  // ── Quotidiennes ────────────────────────────────────────────────────────────

  {
    id:           'cln-task-001',
    name:         'Nettoyer les plans de travail',
    zone:         'laboratoire',
    frequency:    'daily',
    dayOfWeek:    null,
    protocol:     [
      'Débarrasser les surfaces de tout matériel',
      'Appliquer le détergent dégraissant dilué',
      'Frotter avec une éponge non abrasive',
      'Rincer à l\'eau claire',
      'Désinfecter au spray biocide',
      'Laisser agir 5 minutes, essuyer',
    ],
    product:      'Détergent dégraissant — dilution 2%',
    duration_min: 15,
    active:       true,
    createdAt:    '2026-01-01T00:00:00.000Z',
  },

  {
    id:           'cln-task-002',
    name:         'Désinfecter le pétrin après utilisation',
    zone:         'laboratoire',
    frequency:    'daily',
    dayOfWeek:    null,
    protocol:     [
      'Démontage du crochet et de la cuve',
      'Lavage manuel avec détergent',
      'Rinçage abondant',
      'Désinfection avec spray alimentaire',
      'Séchage avant remontage',
    ],
    product:      'Spray désinfectant alimentaire',
    duration_min: 20,
    active:       true,
    createdAt:    '2026-01-01T00:00:00.000Z',
  },

  {
    id:           'cln-task-003',
    name:         'Nettoyer les vitrines de présentation',
    zone:         'vente',
    frequency:    'daily',
    dayOfWeek:    null,
    protocol:     [
      'Vider et réfrigérer les produits',
      'Essuyer l\'intérieur avec chiffon humide',
      'Nettoyer les vitres au produit vitres',
      'Désinfecter les supports et grilles',
      'Replacer les produits',
    ],
    product:      'Nettoyant vitres — prêt à l\'emploi',
    duration_min: 20,
    active:       true,
    createdAt:    '2026-01-01T00:00:00.000Z',
  },

  {
    id:           'cln-task-004',
    name:         'Laver les sols du laboratoire',
    zone:         'sols',
    frequency:    'daily',
    dayOfWeek:    null,
    protocol:     [
      'Balayer pour éliminer les déchets solides',
      'Préparer le seau avec détergent sols',
      'Passer la serpillière en faisant des passes successives',
      'Rincer avec eau claire',
      'Laisser sécher, signaler zone humide si besoin',
    ],
    product:      'Détergent sols alimentaires — dilution 1%',
    duration_min: 15,
    active:       true,
    createdAt:    '2026-01-01T00:00:00.000Z',
  },

  {
    id:           'cln-task-005',
    name:         'Nettoyer les joints de portes frigos',
    zone:         'froid',
    frequency:    'daily',
    dayOfWeek:    null,
    protocol:     [
      'Inspecter visuellement chaque joint',
      'Nettoyer avec chiffon humide et détergent doux',
      'Rincer et sécher',
      'Signaler tout joint abîmé ou décollé',
    ],
    product:      'Détergent doux multiusage',
    duration_min: 10,
    active:       true,
    createdAt:    '2026-01-01T00:00:00.000Z',
  },

  // ── Hebdomadaires ───────────────────────────────────────────────────────────

  {
    id:           'cln-task-006',
    name:         'Nettoyage profond armoires réfrigérées',
    zone:         'froid',
    frequency:    'weekly',
    dayOfWeek:    1, // lundi
    protocol:     [
      'Déplacer et réfrigérer tous les produits',
      'Éteindre et débrancher l\'armoire',
      'Nettoyer les clayettes au lave-vaisselle',
      'Frotter l\'intérieur avec détergent dégraissant',
      'Rincer soigneusement, sécher',
      'Désinfecter avec spray biocide alimentaire',
      'Rebrancher, vérifier la remontée en température',
    ],
    product:      'Détergent dégraissant — dilution 5% + spray biocide',
    duration_min: 45,
    active:       true,
    createdAt:    '2026-01-01T00:00:00.000Z',
  },

  {
    id:           'cln-task-007',
    name:         'Nettoyer le laminoir et accessoires',
    zone:         'laboratoire',
    frequency:    'weekly',
    dayOfWeek:    3, // mercredi
    protocol:     [
      'Démonter les rouleaux et accessoires amovibles',
      'Éliminer les résidus de pâte à la spatule',
      'Laver chaque pièce au détergent',
      'Rincer et sécher avant remontage',
      'Huiler les parties mécaniques si nécessaire',
    ],
    product:      'Détergent matériel pâtisserie',
    duration_min: 30,
    active:       true,
    createdAt:    '2026-01-01T00:00:00.000Z',
  },

  {
    id:           'cln-task-008',
    name:         'Nettoyer grilles et plaques de cuisson',
    zone:         'cuisson',
    frequency:    'weekly',
    dayOfWeek:    5, // vendredi
    protocol:     [
      'Attendre refroidissement complet',
      'Trempage des grilles dans eau chaude + détergent',
      'Brosser pour éliminer résidus carbonisés',
      'Rincer abondamment',
      'Sécher avant réinstallation',
    ],
    product:      'Dégraissant four concentré — dilution 10%',
    duration_min: 35,
    active:       true,
    createdAt:    '2026-01-01T00:00:00.000Z',
  },

  {
    id:           'cln-task-009',
    name:         'Nettoyer les sanitaires',
    zone:         'sanitaires',
    frequency:    'weekly',
    dayOfWeek:    6, // samedi
    protocol:     [
      'Appliquer détartrant dans cuvettes WC, laisser agir 10 min',
      'Nettoyer lavabos et robinetterie',
      'Récurer les cuvettes avec brosse',
      'Désinfecter toutes les surfaces de contact',
      'Nettoyer miroirs et distributeurs',
      'Laver le sol avec désinfectant',
    ],
    product:      'Détartrant WC + Désinfectant surfaces',
    duration_min: 25,
    active:       true,
    createdAt:    '2026-01-01T00:00:00.000Z',
  },

  // ── Mensuelles ──────────────────────────────────────────────────────────────

  {
    id:           'cln-task-010',
    name:         'Nettoyage profond des fours',
    zone:         'cuisson',
    frequency:    'monthly',
    dayOfWeek:    null,
    protocol:     [
      'Refroidissement complet obligatoire',
      'Appliquer gel nettoyant four, laisser agir 30 min',
      'Brosser et racler l\'intérieur',
      'Rincer à l\'eau, éponger soigneusement',
      'Nettoyer la sole et les parois latérales',
      'Vérifier le bon état des résistances',
    ],
    product:      'Gel nettoyant four professionnel',
    duration_min: 60,
    active:       true,
    createdAt:    '2026-01-01T00:00:00.000Z',
  },

  {
    id:           'cln-task-011',
    name:         'Nettoyer les hottes et filtres',
    zone:         'cuisson',
    frequency:    'monthly',
    dayOfWeek:    null,
    protocol:     [
      'Déposer les filtres à graisse',
      'Trempage filtres dans eau bouillante + dégraissant',
      'Brosser, rincer et sécher les filtres',
      'Nettoyer l\'intérieur de la hotte au dégraissant',
      'Rincer, sécher, remonter les filtres',
    ],
    product:      'Dégraissant puissant — dilution 15%',
    duration_min: 40,
    active:       true,
    createdAt:    '2026-01-01T00:00:00.000Z',
  },

  {
    id:           'cln-task-012',
    name:         'Nettoyer plinthes et angles',
    zone:         'sols',
    frequency:    'monthly',
    dayOfWeek:    null,
    protocol:     [
      'Dégager le mobilier des angles',
      'Brosser les plinthes et joints de sol',
      'Appliquer détergent, laisser agir 5 min',
      'Récurer avec brosse rigide',
      'Rincer et sécher',
    ],
    product:      'Détergent sols concentré + brosse rigide',
    duration_min: 30,
    active:       true,
    createdAt:    '2026-01-01T00:00:00.000Z',
  },
]
