import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { dnd } from '../dnd'
import { WEEKLY_CONTRACT } from '../hooks/useSchedule'
// inline SVG icons for the dropdown menu
function IconSend()    { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> }
function IconEdit()    { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> }
function IconArchive() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg> }
function IconDelete()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg> }

import { MailIcon } from './Icons'

function fmtDur(h) {
  const totalMin = Math.round(Math.abs(h) * 60)
  const hours    = Math.floor(totalMin / 60)
  const mins     = totalMin % 60
  return mins === 0 ? `${hours}h` : `${hours}h${String(mins).padStart(2, '0')}`
}

export default function EmployeeCard({ employee, weekHours, weekBalance, onEdit, onArchive, onDelete, onSendEmail }) {
  const [menuOpen, setMenuOpen]       = useState(false)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 })
  const btnRef      = useRef(null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    function onClickOutside(e) {
      const inBtn      = btnRef.current?.contains(e.target)
      const inDropdown = dropdownRef.current?.contains(e.target)
      if (!inBtn && !inDropdown) setMenuOpen(false)
    }
    function onScroll() { setMenuOpen(false) }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('scroll', onScroll, true)
    }
  }, [menuOpen])

  const weekPct  = Math.min((weekHours / WEEKLY_CONTRACT) * 100, 100)
  const weekOver = weekHours > WEEKLY_CONTRACT

  let balanceText, balanceColor
  if (weekBalance === 0) {
    balanceText  = '✓ Semaine équilibrée'
    balanceColor = '#4CAF50'
  } else if (weekBalance > 0) {
    balanceText  = `+${fmtDur(weekBalance)} en trop cette semaine`
    balanceColor = '#E05555'
  } else {
    balanceText  = `−${fmtDur(Math.abs(weekBalance))} pour être à jour`
    balanceColor = '#F5A623'
  }

  function handleDragStart(e) {
    dnd.set({ type: 'new-shift', employeeId: employee.id })
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('text/plain', String(employee.id))
  }

  function handleMenuClick(e) {
    e.stopPropagation()
    if (!menuOpen && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setDropdownPos({ top: rect.bottom + 4, left: rect.right })
    }
    setMenuOpen(v => !v)
  }

  const dropdown = menuOpen && createPortal(
    <div
      ref={dropdownRef}
      className="emp-menu-dropdown"
      style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, zIndex: 9999, transform: 'translateX(-100%)' }}
    >
      <button className="send-option" onClick={() => { setMenuOpen(false); onSendEmail() }}>
        <IconSend />{employee.email ? 'Envoyer son planning' : "Ajouter un email d'abord"}
      </button>
      <div className="emp-menu-divider" />
      <button onClick={() => { setMenuOpen(false); onEdit() }}>
        <IconEdit />Modifier le profil
      </button>
      {!employee.archived && (
        <button className="archive-option" onClick={() => { setMenuOpen(false); onArchive() }}>
          <IconArchive />Archiver
        </button>
      )}
      <button className="delete-option" onClick={() => { setMenuOpen(false); onDelete() }}>
        <IconDelete />Supprimer
      </button>
    </div>,
    document.body
  )

  return (
    <div
      className={`employee-card${employee.archived ? ' archived' : ''}`}
      draggable={!employee.archived}
      onDragStart={employee.archived ? undefined : handleDragStart}
      style={{ '--emp-color': employee.color }}
    >
      <div className="emp-avatar" style={{ background: employee.color, color: '#333344' }}>
        {employee.initials}
      </div>

      <div className="emp-info">
        <div className="emp-name-row">
          <span className="emp-name">{employee.name}</span>
          {employee.email && <span className="emp-email-icon"><MailIcon size={12} /></span>}
        </div>
        <span className="emp-role">{employee.role}</span>

        {/* Barre + heures sur la même ligne */}
        <div className="emp-bar-row">
          <div className="emp-bar-track">
            <div
              className="emp-bar-fill"
              style={{ width: `${weekPct}%`, background: weekOver ? '#E05555' : employee.color }}
            />
          </div>
          <span className="emp-hours" style={{ color: weekOver ? '#E05555' : employee.color }}>
            {fmtDur(weekHours)}<span className="emp-contract-sub">/35h</span>
          </span>
        </div>

        <span className="emp-balance" style={{ color: balanceColor }}>{balanceText}</span>
      </div>

      {/* Bouton ··· */}
      <button
        ref={btnRef}
        className="emp-menu-btn"
        onClick={handleMenuClick}
      >···</button>

      {dropdown}
    </div>
  )
}
