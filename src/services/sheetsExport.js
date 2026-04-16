// ─── Export Supabase → Google Sheets ──────────────────────────────────────────
//
// Fonctions d'export à la demande. Appelées uniquement sur action utilisateur.
// Google Sheets devient un miroir en lecture seule mis à jour depuis Supabase.

import { writeWeekAtomically, writeTeamToSheet } from './googleSheets'
import { writeOrdersToSheet }                     from './googleSheets'
import { writeEquipmentToSheet, writeReadingsToSheet } from './tempSheets'

/**
 * Exporte le planning (shifts + équipe) vers Sheets.
 * @param {string}   token
 * @param {object[]} shifts    — tous les shifts
 * @param {object[]} team      — tous les employés
 * @param {Date[]}   weekDates — semaine à exporter (7 dates)
 */
export async function exportPlanningToSheets(token, shifts, team, weekDates) {
  await Promise.all([
    writeWeekAtomically(token, weekDates, shifts, team),
    writeTeamToSheet(token, team),
  ])
}

/**
 * Exporte les commandes boutique vers Sheets.
 * @param {string}   token
 * @param {object[]} orders — commandes boutique + brunch boutique uniquement
 */
export async function exportOrdersToSheets(token, orders) {
  await writeOrdersToSheet(token, orders)
}

/**
 * Exporte les températures (équipements + relevés) vers Sheets.
 * @param {string}   token
 * @param {object[]} equipment
 * @param {object[]} readings
 */
export async function exportTemperaturesToSheets(token, equipment, readings) {
  await Promise.all([
    writeEquipmentToSheet(token, equipment),
    writeReadingsToSheet(token, readings),
  ])
}
