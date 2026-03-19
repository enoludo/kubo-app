// ─── Données de démonstration — shifts ───────────────────────────────────────
// Source de vérité pour les shifts de démo.
// Modifier uniquement ici — ne pas toucher useSchedule.js pour les données.
//
// UUIDs fixes des employés — doivent rester cohérents avec src/data/team.json
export const E1 = 'e1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c'  // Hélène
export const E2 = 'e2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d'  // Juliette
export const E3 = 'e3c4d5e6-f7a8-4b9c-ad1e-2f3a4b5c6d7e'  // Maxime
export const E4 = 'e4d5e6f7-a8b9-4c0d-be2f-3a4b5c6d7e8f'  // Nadia
export const E5 = 'e5e6f7a8-b9c0-4d1e-8f3a-4b5c6d7e8f9a'  // Carolina

// Couverture : 4 semaines à partir du 2026-02-16
// Semaine 0 : 16/02 – 22/02  (Mar–Sam)
// Semaine 1 : 23/02 – 01/03  (Mar–Sam)
// Semaine 2 : 02/03 – 08/03  (Mar–Sam)
// Semaine 3 : 09/03 – 15/03  (Mar–Sam)  ← semaine courante au lancement
//
// Soldes cumulés (sem 0+1+2) :
//   Hélène   : 36.5 + 36 + 36.5 = 109h → +4h00
//   Juliette : 33   + 33.5 + 34  = 100.5h → −4h30
//   Maxime   : 35   + 35.5 + 35.5 = 106h → +1h00
//   Nadia    : 37   + 37   + 37   = 111h → +6h00
//   Carolina : 34   + 33.5 + 34.5 = 102h → −3h00
//
// Plage horaire disponible : 04h–21h (définie par START_HOUR/END_HOUR dans useSchedule.js)
// Les shifts de démo restent dans la plage réaliste 07h–20h pour une pâtisserie.

const demoShifts = [
  // ── Semaine 0 : 16/02 – 22/02, Mar–Sam ──────────────────────────────────
  // Hélène — 36.5h
  { id: crypto.randomUUID(), employeeId: E1, date: '2026-02-17', startHour:  7,   endHour: 14.5 },
  { id: crypto.randomUUID(), employeeId: E1, date: '2026-02-18', startHour:  7,   endHour: 14   },
  { id: crypto.randomUUID(), employeeId: E1, date: '2026-02-19', startHour:  8,   endHour: 15.5 },
  { id: crypto.randomUUID(), employeeId: E1, date: '2026-02-20', startHour:  8,   endHour: 15   },
  { id: crypto.randomUUID(), employeeId: E1, date: '2026-02-21', startHour:  8,   endHour: 15.5 },
  // Juliette — 33h
  { id: crypto.randomUUID(), employeeId: E2, date: '2026-02-17', startHour:  7,   endHour: 12   },
  { id: crypto.randomUUID(), employeeId: E2, date: '2026-02-18', startHour:  8,   endHour: 15   },
  { id: crypto.randomUUID(), employeeId: E2, date: '2026-02-19', startHour:  9,   endHour: 16   },
  { id: crypto.randomUUID(), employeeId: E2, date: '2026-02-20', startHour:  8,   endHour: 14   },
  { id: crypto.randomUUID(), employeeId: E2, date: '2026-02-21', startHour:  8,   endHour: 16   },
  // Maxime — 35h
  { id: crypto.randomUUID(), employeeId: E3, date: '2026-02-17', startHour:  9,   endHour: 16   },
  { id: crypto.randomUUID(), employeeId: E3, date: '2026-02-18', startHour: 10,   endHour: 17   },
  { id: crypto.randomUUID(), employeeId: E3, date: '2026-02-19', startHour:  9,   endHour: 16   },
  { id: crypto.randomUUID(), employeeId: E3, date: '2026-02-20', startHour: 10,   endHour: 17   },
  { id: crypto.randomUUID(), employeeId: E3, date: '2026-02-21', startHour:  9,   endHour: 16   },
  // Nadia — 37h
  { id: crypto.randomUUID(), employeeId: E4, date: '2026-02-17', startHour:  7,   endHour: 15   },
  { id: crypto.randomUUID(), employeeId: E4, date: '2026-02-18', startHour:  7,   endHour: 14.5 },
  { id: crypto.randomUUID(), employeeId: E4, date: '2026-02-19', startHour:  7,   endHour: 14.5 },
  { id: crypto.randomUUID(), employeeId: E4, date: '2026-02-20', startHour:  7,   endHour: 14   },
  { id: crypto.randomUUID(), employeeId: E4, date: '2026-02-21', startHour:  7,   endHour: 14   },
  // Carolina — 34h
  { id: crypto.randomUUID(), employeeId: E5, date: '2026-02-17', startHour: 12,   endHour: 19   },
  { id: crypto.randomUUID(), employeeId: E5, date: '2026-02-18', startHour: 12,   endHour: 18   },
  { id: crypto.randomUUID(), employeeId: E5, date: '2026-02-19', startHour: 13,   endHour: 20   },
  { id: crypto.randomUUID(), employeeId: E5, date: '2026-02-20', startHour: 12,   endHour: 19   },
  { id: crypto.randomUUID(), employeeId: E5, date: '2026-02-21', startHour: 13,   endHour: 20   },

  // ── Semaine 1 : 23/02 – 01/03, Mar–Sam ──────────────────────────────────
  // Hélène — 36h
  { id: crypto.randomUUID(), employeeId: E1, date: '2026-02-24', startHour:  7.5, endHour: 14.5 },
  { id: crypto.randomUUID(), employeeId: E1, date: '2026-02-25', startHour:  7,   endHour: 14   },
  { id: crypto.randomUUID(), employeeId: E1, date: '2026-02-26', startHour:  8,   endHour: 16   },
  { id: crypto.randomUUID(), employeeId: E1, date: '2026-02-27', startHour:  7,   endHour: 14   },
  { id: crypto.randomUUID(), employeeId: E1, date: '2026-02-28', startHour:  8,   endHour: 15   },
  // Juliette — 33.5h
  { id: crypto.randomUUID(), employeeId: E2, date: '2026-02-24', startHour:  7,   endHour: 12   },
  { id: crypto.randomUUID(), employeeId: E2, date: '2026-02-25', startHour:  8,   endHour: 15   },
  { id: crypto.randomUUID(), employeeId: E2, date: '2026-02-26', startHour:  8.5, endHour: 15   },
  { id: crypto.randomUUID(), employeeId: E2, date: '2026-02-27', startHour:  8,   endHour: 15   },
  { id: crypto.randomUUID(), employeeId: E2, date: '2026-02-28', startHour:  8,   endHour: 16   },
  // Maxime — 35.5h
  { id: crypto.randomUUID(), employeeId: E3, date: '2026-02-24', startHour:  9,   endHour: 16.5 },
  { id: crypto.randomUUID(), employeeId: E3, date: '2026-02-25', startHour: 10,   endHour: 17   },
  { id: crypto.randomUUID(), employeeId: E3, date: '2026-02-26', startHour:  9,   endHour: 16   },
  { id: crypto.randomUUID(), employeeId: E3, date: '2026-02-27', startHour:  9.5, endHour: 16.5 },
  { id: crypto.randomUUID(), employeeId: E3, date: '2026-02-28', startHour:  9,   endHour: 16   },
  // Nadia — 37h
  { id: crypto.randomUUID(), employeeId: E4, date: '2026-02-24', startHour:  7,   endHour: 15   },
  { id: crypto.randomUUID(), employeeId: E4, date: '2026-02-25', startHour:  7,   endHour: 15   },
  { id: crypto.randomUUID(), employeeId: E4, date: '2026-02-26', startHour:  7,   endHour: 14   },
  { id: crypto.randomUUID(), employeeId: E4, date: '2026-02-27', startHour:  7,   endHour: 14   },
  { id: crypto.randomUUID(), employeeId: E4, date: '2026-02-28', startHour:  7,   endHour: 14   },
  // Carolina — 33.5h
  { id: crypto.randomUUID(), employeeId: E5, date: '2026-02-24', startHour: 12,   endHour: 18.5 },
  { id: crypto.randomUUID(), employeeId: E5, date: '2026-02-25', startHour: 13,   endHour: 20   },
  { id: crypto.randomUUID(), employeeId: E5, date: '2026-02-26', startHour: 12,   endHour: 19   },
  { id: crypto.randomUUID(), employeeId: E5, date: '2026-02-27', startHour: 13,   endHour: 20   },
  { id: crypto.randomUUID(), employeeId: E5, date: '2026-02-28', startHour: 13,   endHour: 19   },

  // ── Semaine 2 : 02/03 – 08/03, Mar–Sam ──────────────────────────────────
  // Hélène — 36.5h
  { id: crypto.randomUUID(), employeeId: E1, date: '2026-03-03', startHour:  7,   endHour: 14.5 },
  { id: crypto.randomUUID(), employeeId: E1, date: '2026-03-04', startHour:  7.5, endHour: 15   },
  { id: crypto.randomUUID(), employeeId: E1, date: '2026-03-05', startHour:  7,   endHour: 14   },
  { id: crypto.randomUUID(), employeeId: E1, date: '2026-03-06', startHour:  8,   endHour: 15   },
  { id: crypto.randomUUID(), employeeId: E1, date: '2026-03-07', startHour:  8.5, endHour: 16   },
  // Juliette — 34h
  { id: crypto.randomUUID(), employeeId: E2, date: '2026-03-03', startHour:  7,   endHour: 12   },
  { id: crypto.randomUUID(), employeeId: E2, date: '2026-03-04', startHour:  8,   endHour: 15   },
  { id: crypto.randomUUID(), employeeId: E2, date: '2026-03-05', startHour:  8,   endHour: 15   },
  { id: crypto.randomUUID(), employeeId: E2, date: '2026-03-06', startHour:  8,   endHour: 15   },
  { id: crypto.randomUUID(), employeeId: E2, date: '2026-03-07', startHour:  8,   endHour: 16   },
  // Maxime — 35.5h
  { id: crypto.randomUUID(), employeeId: E3, date: '2026-03-03', startHour:  9,   endHour: 16   },
  { id: crypto.randomUUID(), employeeId: E3, date: '2026-03-04', startHour: 10,   endHour: 17.5 },
  { id: crypto.randomUUID(), employeeId: E3, date: '2026-03-05', startHour:  9,   endHour: 16   },
  { id: crypto.randomUUID(), employeeId: E3, date: '2026-03-06', startHour: 10,   endHour: 17   },
  { id: crypto.randomUUID(), employeeId: E3, date: '2026-03-07', startHour:  9,   endHour: 16   },
  // Nadia — 37h
  { id: crypto.randomUUID(), employeeId: E4, date: '2026-03-03', startHour:  7,   endHour: 15   },
  { id: crypto.randomUUID(), employeeId: E4, date: '2026-03-04', startHour:  7,   endHour: 14.5 },
  { id: crypto.randomUUID(), employeeId: E4, date: '2026-03-05', startHour:  7,   endHour: 14   },
  { id: crypto.randomUUID(), employeeId: E4, date: '2026-03-06', startHour:  7,   endHour: 14   },
  { id: crypto.randomUUID(), employeeId: E4, date: '2026-03-07', startHour:  7.5, endHour: 15   },
  // Carolina — 34.5h
  { id: crypto.randomUUID(), employeeId: E5, date: '2026-03-03', startHour: 12,   endHour: 19   },
  { id: crypto.randomUUID(), employeeId: E5, date: '2026-03-04', startHour: 12,   endHour: 19.5 },
  { id: crypto.randomUUID(), employeeId: E5, date: '2026-03-05', startHour: 13,   endHour: 20   },
  { id: crypto.randomUUID(), employeeId: E5, date: '2026-03-06', startHour: 12,   endHour: 19   },
  { id: crypto.randomUUID(), employeeId: E5, date: '2026-03-07', startHour: 13,   endHour: 19   },

  // ── Semaine 3 (courante) : 09/03 – 15/03, Mar–Sam ───────────────────────
  // Hélène — 35h
  { id: crypto.randomUUID(), employeeId: E1, date: '2026-03-10', startHour:  7,   endHour: 14   },
  { id: crypto.randomUUID(), employeeId: E1, date: '2026-03-11', startHour:  7.5, endHour: 14.5 },
  { id: crypto.randomUUID(), employeeId: E1, date: '2026-03-12', startHour:  8,   endHour: 15   },
  { id: crypto.randomUUID(), employeeId: E1, date: '2026-03-13', startHour:  7,   endHour: 14   },
  { id: crypto.randomUUID(), employeeId: E1, date: '2026-03-14', startHour:  8,   endHour: 15   },
  // Juliette — 34h
  { id: crypto.randomUUID(), employeeId: E2, date: '2026-03-10', startHour:  7,   endHour: 12   },
  { id: crypto.randomUUID(), employeeId: E2, date: '2026-03-11', startHour:  8,   endHour: 15   },
  { id: crypto.randomUUID(), employeeId: E2, date: '2026-03-12', startHour:  9,   endHour: 16   },
  { id: crypto.randomUUID(), employeeId: E2, date: '2026-03-13', startHour:  8,   endHour: 15   },
  { id: crypto.randomUUID(), employeeId: E2, date: '2026-03-14', startHour:  8,   endHour: 16   },
  // Maxime — 35h
  { id: crypto.randomUUID(), employeeId: E3, date: '2026-03-10', startHour:  9,   endHour: 16   },
  { id: crypto.randomUUID(), employeeId: E3, date: '2026-03-11', startHour: 10,   endHour: 17   },
  { id: crypto.randomUUID(), employeeId: E3, date: '2026-03-12', startHour:  9.5, endHour: 16.5 },
  { id: crypto.randomUUID(), employeeId: E3, date: '2026-03-13', startHour: 10,   endHour: 17   },
  { id: crypto.randomUUID(), employeeId: E3, date: '2026-03-14', startHour:  9,   endHour: 16   },
  // Nadia — 36h
  { id: crypto.randomUUID(), employeeId: E4, date: '2026-03-10', startHour:  7,   endHour: 15   },
  { id: crypto.randomUUID(), employeeId: E4, date: '2026-03-11', startHour:  7,   endHour: 14   },
  { id: crypto.randomUUID(), employeeId: E4, date: '2026-03-12', startHour:  7,   endHour: 14   },
  { id: crypto.randomUUID(), employeeId: E4, date: '2026-03-13', startHour:  7,   endHour: 14   },
  { id: crypto.randomUUID(), employeeId: E4, date: '2026-03-14', startHour:  7.5, endHour: 14.5 },
  // Carolina — 35h
  { id: crypto.randomUUID(), employeeId: E5, date: '2026-03-10', startHour: 12,   endHour: 19   },
  { id: crypto.randomUUID(), employeeId: E5, date: '2026-03-11', startHour: 13,   endHour: 20   },
  { id: crypto.randomUUID(), employeeId: E5, date: '2026-03-12', startHour: 12,   endHour: 19   },
  { id: crypto.randomUUID(), employeeId: E5, date: '2026-03-13', startHour: 12,   endHour: 19   },
  { id: crypto.randomUUID(), employeeId: E5, date: '2026-03-14', startHour: 13,   endHour: 20   },
]

export default demoShifts
