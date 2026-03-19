import { describe, it, expect } from 'vitest'
import { shiftEffective, WEEKLY_CONTRACT } from '../../hooks/useSchedule'
import { dateToStr, mondayOf } from '../date'

// ── Pure balance helpers (miroir de la logique du hook) ────────────────────────

function computeWeekBalance(shifts, employeeId, weekDates, contract = WEEKLY_CONTRACT, startBalance = 0) {
  const strs       = new Set(weekDates.map(dateToStr))
  const prevShifts = shifts.filter(s => s.employeeId === employeeId && !strs.has(s.date))
  const prevHours  = prevShifts.reduce((sum, s) => sum + shiftEffective(s), 0)
  const prevWeeks  = new Set(prevShifts.map(s => mondayOf(s.date))).size
  const prevBalance = prevHours - prevWeeks * contract + startBalance

  const weekHours   = shifts
    .filter(s => s.employeeId === employeeId && strs.has(s.date))
    .reduce((sum, s) => sum + shiftEffective(s), 0)
  const weekObjective = contract - prevBalance
  const weekBalance   = weekHours - weekObjective

  return { prevBalance, weekObjective, weekBalance, weekHours, prevHours, prevWeeks }
}

function makeWeek(mondayStr) {
  const dates = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(mondayStr)
    d.setDate(d.getDate() + i)
    dates.push(d)
  }
  return dates
}

// ── shiftEffective ─────────────────────────────────────────────────────────────

describe('shiftEffective', () => {
  it('retourne la durée brute sans pause', () => {
    expect(shiftEffective({ startHour: 8, endHour: 16, pause: 0 })).toBe(8)
  })

  it('déduit la pause', () => {
    expect(shiftEffective({ startHour: 8, endHour: 16, pause: 1 })).toBe(7)
  })

  it('retourne 0 pour un type non-work', () => {
    expect(shiftEffective({ startHour: 8, endHour: 16, type: 'leave' })).toBe(0)
    expect(shiftEffective({ startHour: 8, endHour: 16, type: 'sick'  })).toBe(0)
    expect(shiftEffective({ startHour: 8, endHour: 16, type: 'rest'  })).toBe(0)
  })

  it('considère type absent comme non-work', () => {
    expect(shiftEffective({ startHour: 7, endHour: 15, type: 'absent' })).toBe(0)
  })

  it('traite type undefined comme work', () => {
    expect(shiftEffective({ startHour: 8, endHour: 12 })).toBe(4)
  })

  it('ne retourne jamais de valeur négative', () => {
    expect(shiftEffective({ startHour: 8, endHour: 9, pause: 5 })).toBe(0)
  })

  it('gère les demi-heures de pause', () => {
    expect(shiftEffective({ startHour: 8, endHour: 16, pause: 0.5 })).toBeCloseTo(7.5)
  })
})

// ── Solde semaine — cas de base ────────────────────────────────────────────────

describe('computeWeekBalance — semaine sans historique', () => {
  const week = makeWeek('2026-03-16')  // lundi 16 mars

  it('semaine à 0h → objectif = contrat, balance négative', () => {
    const { weekHours, weekObjective, weekBalance, prevBalance } =
      computeWeekBalance([], 'e1', week, 35)
    expect(weekHours).toBe(0)
    expect(prevBalance).toBe(0)
    expect(weekObjective).toBe(35)
    expect(weekBalance).toBe(-35)
  })

  it('semaine équilibrée → balance = 0', () => {
    const shifts = [
      { id: '1', employeeId: 'e1', date: '2026-03-16', startHour: 7, endHour: 14, pause: 0 },
      { id: '2', employeeId: 'e1', date: '2026-03-17', startHour: 7, endHour: 14, pause: 0 },
      { id: '3', employeeId: 'e1', date: '2026-03-18', startHour: 7, endHour: 14, pause: 0 },
      { id: '4', employeeId: 'e1', date: '2026-03-19', startHour: 7, endHour: 14, pause: 0 },
      { id: '5', employeeId: 'e1', date: '2026-03-20', startHour: 7, endHour: 7,  pause: 0 },
    ]
    // 4 × 7h = 28h, pas 35h — ajoutons un 5e shift complet
    const balanced = [
      ...shifts.slice(0, 4),
      { id: '5', employeeId: 'e1', date: '2026-03-20', startHour: 7, endHour: 14, pause: 0 },
    ]
    const { weekBalance } = computeWeekBalance(balanced, 'e1', week, 35)
    expect(weekBalance).toBe(0)
  })

  it('semaine en avance → balance positive', () => {
    const shifts = [
      { id: '1', employeeId: 'e1', date: '2026-03-16', startHour: 7, endHour: 15, pause: 0, type: 'work' },
      { id: '2', employeeId: 'e1', date: '2026-03-17', startHour: 7, endHour: 15, pause: 0 },
      { id: '3', employeeId: 'e1', date: '2026-03-18', startHour: 7, endHour: 15, pause: 0 },
      { id: '4', employeeId: 'e1', date: '2026-03-19', startHour: 7, endHour: 15, pause: 0 },
      { id: '5', employeeId: 'e1', date: '2026-03-20', startHour: 7, endHour: 13, pause: 0 },
    ]
    // 4×8 + 6 = 38h → balance = +3
    const { weekBalance, weekHours } = computeWeekBalance(shifts, 'e1', week, 35)
    expect(weekHours).toBe(38)
    expect(weekBalance).toBe(3)
  })
})

// ── Report des semaines précédentes ───────────────────────────────────────────

describe('computeWeekBalance — report semaines précédentes', () => {
  const week = makeWeek('2026-03-16')

  it('report positif réduit l\'objectif de la semaine courante', () => {
    // Semaine précédente : 37h pour un contrat 35h → avance de 2h
    const shifts = [
      { id: 'p1', employeeId: 'e1', date: '2026-03-09', startHour: 7, endHour: 15, pause: 0 }, // 8h
      { id: 'p2', employeeId: 'e1', date: '2026-03-10', startHour: 7, endHour: 15, pause: 0 }, // 8h
      { id: 'p3', employeeId: 'e1', date: '2026-03-11', startHour: 7, endHour: 15, pause: 0 }, // 8h
      { id: 'p4', employeeId: 'e1', date: '2026-03-12', startHour: 7, endHour: 15, pause: 0 }, // 8h
      { id: 'p5', employeeId: 'e1', date: '2026-03-13', startHour: 7, endHour: 12, pause: 0 }, // 5h → total 37h
    ]
    const { prevBalance, weekObjective } = computeWeekBalance(shifts, 'e1', week, 35)
    expect(prevBalance).toBe(2)      // 37h - 35h = +2
    expect(weekObjective).toBe(33)   // 35 - 2 = 33
  })

  it('report négatif augmente l\'objectif de la semaine courante', () => {
    // Semaine précédente : 30h → retard de 5h
    const shifts = [
      { id: 'p1', employeeId: 'e1', date: '2026-03-09', startHour: 7, endHour: 13, pause: 0 }, // 6h
      { id: 'p2', employeeId: 'e1', date: '2026-03-10', startHour: 7, endHour: 13, pause: 0 }, // 6h
      { id: 'p3', employeeId: 'e1', date: '2026-03-11', startHour: 7, endHour: 13, pause: 0 }, // 6h
      { id: 'p4', employeeId: 'e1', date: '2026-03-12', startHour: 7, endHour: 13, pause: 0 }, // 6h
      { id: 'p5', employeeId: 'e1', date: '2026-03-13', startHour: 7, endHour: 13, pause: 0 }, // 6h → total 30h
    ]
    const { prevBalance, weekObjective } = computeWeekBalance(shifts, 'e1', week, 35)
    expect(prevBalance).toBe(-5)     // 30h - 35h = -5
    expect(weekObjective).toBe(40)   // 35 - (-5) = 40
  })

  it('startBalance initial est reporté dans le calcul', () => {
    const { prevBalance, weekObjective } = computeWeekBalance([], 'e1', week, 35, 5)
    expect(prevBalance).toBe(5)
    expect(weekObjective).toBe(30)
  })

  it('startBalance négatif est reporté dans le calcul', () => {
    const { prevBalance, weekObjective } = computeWeekBalance([], 'e1', week, 35, -10)
    expect(prevBalance).toBe(-10)
    expect(weekObjective).toBe(45)
  })
})

// ── Cas limites ────────────────────────────────────────────────────────────────

describe('computeWeekBalance — cas limites', () => {
  const week = makeWeek('2026-03-16')

  it('ignore les shifts d\'un autre employé', () => {
    const shifts = [
      { id: '1', employeeId: 'e2', date: '2026-03-16', startHour: 7, endHour: 15, pause: 0 },
    ]
    const { weekHours } = computeWeekBalance(shifts, 'e1', week, 35)
    expect(weekHours).toBe(0)
  })

  it('les types non-work ne comptent pas dans les heures semaine', () => {
    const shifts = [
      { id: '1', employeeId: 'e1', date: '2026-03-16', startHour: 7, endHour: 15, type: 'leave' },
      { id: '2', employeeId: 'e1', date: '2026-03-17', startHour: 7, endHour: 15, type: 'sick'  },
    ]
    const { weekHours } = computeWeekBalance(shifts, 'e1', week, 35)
    expect(weekHours).toBe(0)
  })

  it('contrat personnalisé (28h) est respecté', () => {
    const shifts = [
      { id: '1', employeeId: 'e1', date: '2026-03-16', startHour: 8, endHour: 15, pause: 0 }, // 7h
      { id: '2', employeeId: 'e1', date: '2026-03-17', startHour: 8, endHour: 15, pause: 0 }, // 7h
      { id: '3', employeeId: 'e1', date: '2026-03-18', startHour: 8, endHour: 15, pause: 0 }, // 7h
      { id: '4', employeeId: 'e1', date: '2026-03-19', startHour: 8, endHour: 15, pause: 0 }, // 7h
    ]
    const { weekHours, weekObjective, weekBalance } = computeWeekBalance(shifts, 'e1', week, 28)
    expect(weekHours).toBe(28)
    expect(weekObjective).toBe(28)
    expect(weekBalance).toBe(0)
  })

  it('plusieurs semaines précédentes — compte les semaines distinctes', () => {
    const shifts = [
      { id: '1', employeeId: 'e1', date: '2026-03-02', startHour: 7, endHour: 14, pause: 0 }, // sem 9 : 7h
      { id: '2', employeeId: 'e1', date: '2026-03-09', startHour: 7, endHour: 14, pause: 0 }, // sem 10: 7h
    ]
    // 2 semaines × 35h attendus = 70h ; réalisé = 14h → retard 56h
    const { prevBalance, prevWeeks, prevHours } = computeWeekBalance(shifts, 'e1', week, 35)
    expect(prevWeeks).toBe(2)
    expect(prevHours).toBe(14)
    expect(prevBalance).toBe(-56)
  })
})
