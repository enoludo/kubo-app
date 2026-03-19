import { useState, useEffect, useRef } from 'react'
import { sessionSave, sessionLoad, sessionHasData, sessionClear } from '../utils/session'

export function useTeam({ initialTeam, schedule, setDataSource, showToast }) {
  const [team,         setTeam]         = useState(() => sessionLoad('team') ?? initialTeam)
  const [empModal,     setEmpModal]     = useState(null)
  const [profileModal, setProfileModal] = useState(null)
  const saveTimer = useRef(null)

  // Auto-save de l'équipe dans sessionStorage (debounce 500ms)
  useEffect(() => {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => sessionSave('team', team), 500)
    return () => clearTimeout(saveTimer.current)
  }, [team])

  // Toast au premier montage si des données de session ont été restaurées
  useEffect(() => {
    if (sessionHasData()) {
      showToast('Planning restauré depuis votre session précédente', '#7C6FCD')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleReset() {
    sessionClear()
    schedule.resetShifts()
    setTeam(initialTeam)
    setDataSource('demo')
  }

  function handleSaveEmployee(data) {
    if (empModal.employee) {
      setTeam(prev => prev.map(e =>
        e.id === empModal.employee.id
          ? { ...e, name: data.name, role: data.role, email: data.email,
              contract: data.contract, color: data.color, initials: data.initials,
              startBalance: data.startBalance ?? 0 }
          : e
      ))
    } else {
      const newId = crypto.randomUUID()
      setTeam(prev => [...prev, {
        id: newId, name: data.name, role: data.role, email: data.email,
        contract: data.contract ?? 35, color: data.color, initials: data.initials,
        archived: false, startBalance: data.startBalance ?? 0,
      }])
    }
    setEmpModal(null)
  }

  function handleArchiveEmployee() {
    if (!empModal?.employee) return
    setTeam(prev => prev.map(e =>
      e.id === empModal.employee.id ? { ...e, archived: true } : e
    ))
    setEmpModal(null)
  }

  function handleDeleteEmployee() {
    if (!empModal?.employee) return
    schedule.removeEmployeeShifts(empModal.employee.id)
    setTeam(prev => prev.filter(e => e.id !== empModal.employee.id))
    setEmpModal(null)
  }

  return {
    team, setTeam,
    empModal, setEmpModal,
    profileModal, setProfileModal,
    handleReset, handleSaveEmployee, handleArchiveEmployee, handleDeleteEmployee,
  }
}
