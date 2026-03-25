import { useState } from 'react'
import { buildIndividualMailto } from '../utils/emailPlanning'
import { dateToStr, fmtTime, mondayOf } from '../utils/date'
import { MailIcon, CopyIcon } from './Icons'
import Modal from '../design-system/components/Modal/Modal'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDur(h) {
  const totalMin = Math.round(Math.abs(h) * 60)
  const hours    = Math.floor(totalMin / 60)
  const mins     = totalMin % 60
  return mins === 0 ? `${hours}h` : `${hours}h${String(mins).padStart(2, '0')}`
}

function isoWeekNum(monday) {
  const d    = new Date(monday)
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7)
  const jan4 = new Date(d.getFullYear(), 0, 4)
  return 1 + Math.round(((d - jan4) / 86400000 - 3 + (jan4.getDay() + 6) % 7) / 7)
}

function getWeekDates(mondayStr) {
  const mon = new Date(mondayStr + 'T00:00:00')
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon)
    d.setDate(mon.getDate() + i)
    return d
  })
}

function fmtWeekLabel(mondayStr) {
  const mon = new Date(mondayStr + 'T00:00:00')
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  const fmt = d => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`
  return `Sem. ${isoWeekNum(mon)}  —  ${fmt(mon)} au ${fmt(sun)}`
}

function addWeeks(weekKey, n) {
  const d = new Date(weekKey + 'T00:00:00')
  d.setDate(d.getDate() + n * 7)
  return dateToStr(d)
}

// Génère les options de semaine de destination
// Même employé : +1 à +12 semaines (on ne colle pas sur la même semaine source)
// Autre employé : -2 à +12 semaines (la semaine source incluse)
function getPasteWeekOptions(srcWeekKey, isSameEmployee) {
  const start = isSameEmployee ? 1 : -2
  return Array.from({ length: isSameEmployee ? 12 : 15 }, (_, i) => addWeeks(srcWeekKey, start + i))
}

const DAY_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
function dayLabel(dateStr) {
  return DAY_FR[new Date(dateStr + 'T00:00:00').getDay()]
}

// Copiable : tout sauf les shifts validés (le statut validated est toujours remis à false)
function isCopiable(s) {
  return !s.validated
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function EmployeeProfileModal({
  employee, weekDates, schedule, onEdit, onClose,
  copiedEmployeePlan, onCopyPlan, onPastePlan,
}) {
  // activePanel : null | 'email' | 'copy' | 'paste'
  const [activePanel,     setActivePanel]     = useState(null)
  const [pasteTargetWeek, setPasteTargetWeek] = useState(null)

  const contract     = employee.contract ?? 35
  const startBalance = employee.startBalance ?? 0

  // Solde semaine courante
  const wb       = schedule.getWeekBalance(employee.id, weekDates, contract, startBalance)
  const weekPct  = Math.min((wb.weekHours / contract) * 100, 100)
  const weekOver = wb.weekHours > contract

  // Solde cumulé
  const cumulBalance = schedule.getBalance(employee.id, contract, startBalance)
  let cumulText, cumulColor
  if (Math.abs(cumulBalance) < 0.05) {
    cumulText  = '✓ Solde cumulé équilibré'
    cumulColor = '#4CAF50'
  } else if (cumulBalance > 0) {
    cumulText  = `+${fmtDur(cumulBalance)} en avance (cumulé)`
    cumulColor = '#E05555'
  } else {
    cumulText  = `−${fmtDur(Math.abs(cumulBalance))} à rattraper (cumulé)`
    cumulColor = '#F5A623'
  }

  // ── Données pour le panel Email ──────────────────────────────────────────────
  const empShifts     = schedule.shifts.filter(s => s.employeeId === employee.id)
  const emailWeekKeys = [...new Set(empShifts.map(s => mondayOf(s.date)))].sort().reverse()
  const currentKey    = weekDates.length > 0 ? dateToStr(weekDates[0]) : (emailWeekKeys[0] ?? '')
  const [emailWeek, setEmailWeek] = useState(currentKey)

  function handleSend() {
    if (!employee.email) { onEdit(); return }
    const dates = getWeekDates(emailWeek)
    const href  = buildIndividualMailto(employee, dates, schedule.shifts)
    if (href) window.location.href = href
  }

  // ── Données pour le panel Copier ─────────────────────────────────────────────
  const copiableShifts  = empShifts.filter(isCopiable)
  const copyWeekKeys    = [...new Set(copiableShifts.map(s => mondayOf(s.date)))].sort().reverse()
  const defaultCopyWeek = copyWeekKeys.includes(currentKey) ? currentKey : (copyWeekKeys[0] ?? currentKey)
  const [copyWeek, setCopyWeek] = useState(defaultCopyWeek)

  const previewShifts = copiableShifts
    .filter(s => mondayOf(s.date) === copyWeek)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startHour - b.startHour)

  function handleConfirmCopy() {
    console.log('[handleConfirmCopy]', { employee: employee.id, copyWeek, previewShifts })
    onCopyPlan(employee, copyWeek, previewShifts)
    setActivePanel(null)
  }

  // ── Données pour le panel Coller ─────────────────────────────────────────────
  // Pas de restriction sur l'employé : on peut coller sur le même (reproduire une semaine)
  const canPaste        = copiedEmployeePlan != null
  const isSameEmployee  = copiedEmployeePlan?.employee?.id === employee.id
  const srcWeekKey      = copiedEmployeePlan?.weekKey ?? currentKey

  // Semaine de destination par défaut
  const defaultPasteWeek = isSameEmployee
    ? addWeeks(srcWeekKey, 1)   // semaine suivante pour le même employé
    : srcWeekKey                // même semaine pour un autre employé

  const effectivePasteWeek  = pasteTargetWeek ?? defaultPasteWeek
  const pasteWeekOptions    = canPaste ? getPasteWeekOptions(srcWeekKey, isSameEmployee) : []

  function openPastePanel() {
    setPasteTargetWeek(null)   // reset pour recalculer le défaut
    setActivePanel('paste')
  }

  function handleConfirmPaste(mode) {
    console.log('[handleConfirmPaste]', { targetEmployee: employee.id, effectivePasteWeek, mode, copiedEmployeePlan })
    onPastePlan(employee, effectivePasteWeek, mode)
    setActivePanel(null)
    setPasteTargetWeek(null)
  }

  // ── Rendu ────────────────────────────────────────────────────────────────────
  return (
    <Modal onClose={onClose} className="emp-profile-modal">

        {/* Header */}
        <div className="emp-profile-modal-header">
          <div className="modal-avatar" style={{ background: employee.color, flexShrink: 0 }}>
            {employee.initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="modal-emp-name">{employee.name}</div>
            <div className="text-meta modal-emp-role">{employee.role}</div>
          </div>
          <button className="emp-profile-edit-btn" onClick={onEdit}>Modifier</button>
        </div>

        {/* Contrat */}
        <div className="emp-profile-info-row">
          <span className="emp-profile-info-label">Contrat</span>
          <span className="emp-profile-info-val">{contract}h / semaine</span>
        </div>

        {/* Progression semaine */}
        <div className="emp-profile-progress">
          <div className="emp-profile-progress-header">
            <span className="emp-profile-info-label">Semaine en cours</span>
            <span style={{ fontWeight: 600, fontSize: 13 }}>
              {fmtDur(wb.weekHours)}<span style={{ fontWeight: 400, fontSize: 11, color: '#9999aa', marginLeft: 2 }}>/{contract}h</span>
            </span>
          </div>
          <div className="emp-bar-track" style={{ height: 5, marginTop: 6 }}>
            <div className="emp-bar-fill" style={{ width: `${weekPct}%`, background: weekOver ? '#E05555' : employee.color }} />
          </div>
        </div>

        {/* Solde cumulé */}
        <div className="emp-profile-cumul" style={{ color: cumulColor, background: cumulColor + '1a' }}>
          {cumulText}
        </div>

        {/* ── Panel Email ── */}
        {activePanel === 'email' && employee.email && (
          <div className="emp-profile-email-panel">
            <div className="modal-field-full">
              <label>Semaine à envoyer</label>
              {emailWeekKeys.length === 0 ? (
                <div style={{ fontSize: 12, color: '#9999aa', padding: '6px 0' }}>Aucun shift enregistré</div>
              ) : (
                <select value={emailWeek} onChange={e => setEmailWeek(e.target.value)}>
                  {emailWeekKeys.map(wk => (
                    <option key={wk} value={wk}>{fmtWeekLabel(wk)}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}

        {/* ── Panel Copier ── */}
        {activePanel === 'copy' && (
          <div className="emp-copy-panel">
            <div className="modal-field-full">
              <label>Semaine à copier</label>
              {copyWeekKeys.length === 0 ? (
                <div className="emp-copy-empty">Aucun shift copiable</div>
              ) : (
                <select value={copyWeek} onChange={e => setCopyWeek(e.target.value)}>
                  {copyWeekKeys.map(wk => (
                    <option key={wk} value={wk}>{fmtWeekLabel(wk)}</option>
                  ))}
                </select>
              )}
            </div>
            {previewShifts.length > 0 ? (
              <div className="copy-shift-preview">
                {previewShifts.map(s => (
                  <div key={s.id} className="copy-shift-item">
                    <span className="copy-shift-day">{dayLabel(s.date)}</span>
                    <span className="copy-shift-hours">
                      {fmtTime(s.startHour)} → {fmtTime(s.endHour)}
                      {s.pause > 0 && <span className="copy-shift-pause"> | {fmtDur(s.pause)} pause</span>}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="emp-copy-empty">Aucun shift copiable cette semaine</div>
            )}
          </div>
        )}

        {/* ── Panel Coller (confirmation) ── */}
        {activePanel === 'paste' && canPaste && (
          <div className="emp-paste-confirm">
            <div className="modal-field-full" style={{ marginBottom: 12 }}>
              <label>Semaine de destination</label>
              <select value={effectivePasteWeek} onChange={e => setPasteTargetWeek(e.target.value)}>
                {pasteWeekOptions.map(wk => (
                  <option key={wk} value={wk}>{fmtWeekLabel(wk)}</option>
                ))}
              </select>
            </div>
            <div className="emp-paste-confirm-text">
              {isSameEmployee
                ? <>Reproduire ce planning sur la semaine du <strong>{fmtWeekLabel(effectivePasteWeek)}</strong> ?</>
                : <>Coller le planning de <strong>{copiedEmployeePlan.employee.name}</strong> sur la semaine du <strong>{fmtWeekLabel(effectivePasteWeek)}</strong> pour <strong>{employee.name}</strong> ?</>
              }
            </div>
            <div className="emp-paste-btns">
              <button className="emp-paste-btn emp-paste-btn--merge" onClick={() => handleConfirmPaste('merge')}>
                Fusionner
                <span className="emp-paste-btn-sub">Jours vides uniquement</span>
              </button>
              <button className="emp-paste-btn emp-paste-btn--replace" onClick={() => handleConfirmPaste('replace')}>
                Remplacer
                <span className="emp-paste-btn-sub">Écrase les shifts existants</span>
              </button>
            </div>
          </div>
        )}

        {/* ── Actions ── */}
        <div className="modal-actions emp-profile-actions" style={{ marginTop: 20 }}>

          {activePanel === 'email' ? (
            <>
              <button className="btn-secondary modal-cancel" onClick={() => setActivePanel(null)}>Annuler</button>
              <button className="btn-primary modal-confirm" style={{ background: employee.color }} onClick={handleSend}>
                Envoyer ✉
              </button>
            </>
          ) : activePanel === 'copy' ? (
            <>
              <button className="btn-secondary modal-cancel" onClick={() => setActivePanel(null)}>Annuler</button>
              <button
                className="btn-primary modal-confirm"
                style={{ background: employee.color, opacity: previewShifts.length === 0 ? 0.4 : 1 }}
                disabled={previewShifts.length === 0}
                onClick={handleConfirmCopy}
              >
                <CopyIcon size={13} />
                Confirmer la copie
              </button>
            </>
          ) : activePanel === 'paste' ? (
            <button className="btn-secondary modal-cancel" style={{ flex: 1 }} onClick={() => setActivePanel(null)}>Annuler</button>
          ) : (
            <>
              {canPaste && (
                <button className="emp-btn-paste" onClick={openPastePanel}>
                  {isSameEmployee ? 'Reproduire...' : `Coller de ${copiedEmployeePlan.employee.name.split(' ')[0]}`}
                </button>
              )}
              <button className="emp-btn-copy" onClick={() => setActivePanel('copy')}>
                <CopyIcon size={13} />
                Copier
              </button>
              <button
                className="btn-primary modal-confirm"
                style={{background: employee.color,  opacity: employee.email ? 1 : 0.8,  flex: canPaste ? undefined : 1 }}
                onClick={employee.email ? () => setActivePanel('email') : onEdit}
              >
                <MailIcon size={13} style={{ marginRight: 6 }} />
                {employee.email ? 'Envoyer' : "Ajouter un email"}
              </button>
            </>
          )}
        </div>

    </Modal>
  )
}
