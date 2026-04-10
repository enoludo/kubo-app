import { useState, useEffect, useRef } from 'react'
import { sessionSave, sessionLoad, sessionHasData, sessionClear } from '../../../utils/session'
import {
  fetchEmployees,
  upsertEmployee,
  deleteEmployee,
} from '../../../services/planningService'

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

  // Chargement Supabase au montage
  // - Si Supabase a des données → charge et remplace l'état local
  // - Si Supabase est vide → seed avec l'équipe locale (nécessaire avant tout upsert de shifts)
  useEffect(() => {
    fetchEmployees()
      .then(async employees => {
        if (employees.length > 0) {
          setTeam(employees)
        } else {
          const toSeed = sessionLoad('team') ?? initialTeam
          await Promise.all(toSeed.map(emp => upsertEmployee(emp)))
          console.log('[supabase] équipe seedée:', toSeed.length, 'employés')
        }
      })
      .catch(err => console.error('[supabase] fetchEmployees:', err.message))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleReset() {
    sessionClear()
    schedule.resetShifts()
    setTeam(initialTeam)
    setDataSource('demo')
    // Note : resetShifts ne touche pas Supabase intentionnellement
  }

  function handleSaveEmployee(data) {
    if (empModal.employee) {
      const updated = {
        ...empModal.employee,
        name:         data.name,
        role:         data.role,
        email:        data.email,
        contract:     data.contract,
        color:        data.color,
        initials:     data.initials,
        startBalance: data.startBalance ?? 0,
      }
      setTeam(prev => prev.map(e => e.id === empModal.employee.id ? updated : e))
      upsertEmployee(updated).catch(err => console.error('[supabase] upsertEmployee:', err.message))
    } else {
      const newEmp = {
        id:           crypto.randomUUID(),
        name:         data.name,
        role:         data.role,
        email:        data.email,
        contract:     data.contract ?? 35,
        color:        data.color,
        initials:     data.initials,
        archived:     false,
        startBalance: data.startBalance ?? 0,
      }
      setTeam(prev => [...prev, newEmp])
      upsertEmployee(newEmp).catch(err => console.error('[supabase] upsertEmployee:', err.message))
    }
    setEmpModal(null)
  }

  function handleArchiveEmployee() {
    if (!empModal?.employee) return
    const updated = { ...empModal.employee, archived: true }
    setTeam(prev => prev.map(e => e.id === empModal.employee.id ? updated : e))
    upsertEmployee(updated).catch(err => console.error('[supabase] archiveEmployee:', err.message))
    setEmpModal(null)
  }

  function handleDeleteEmployee() {
    if (!empModal?.employee) return
    const id = empModal.employee.id
    schedule.removeEmployeeShifts(id)
    setTeam(prev => prev.filter(e => e.id !== id))
    deleteEmployee(id).catch(err => console.error('[supabase] deleteEmployee:', err.message))
    setEmpModal(null)
  }

  return {
    team, setTeam,
    empModal, setEmpModal,
    profileModal, setProfileModal,
    handleReset, handleSaveEmployee, handleArchiveEmployee, handleDeleteEmployee,
  }
}
