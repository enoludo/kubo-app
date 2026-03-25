import { createPortal } from 'react-dom'
import { useEffect, useRef } from 'react'

/**
 * Dropdown — composant générique
 * Menu contextuel positionné en fixed, rendu via createPortal.
 *
 * @param {React.RefObject} triggerRef  ref du bouton déclencheur (positionnement + outside-click)
 * @param {boolean}         isOpen      état ouvert/fermé
 * @param {function}        onClose     callback fermeture
 * @param {'left'|'right'}  align       alignement horizontal (défaut: 'left')
 * @param {string}          className   classes additionnelles
 */
export default function Dropdown({
  triggerRef,
  isOpen,
  onClose,
  align = 'left',
  className = '',
  children,
}) {
  const dropRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return
    function onMouseDown(e) {
      if (dropRef.current?.contains(e.target)) return
      if (triggerRef?.current?.contains(e.target)) return
      onClose()
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [isOpen, onClose, triggerRef])

  if (!isOpen) return null

  const rect = triggerRef?.current?.getBoundingClientRect() ?? { bottom: 0, left: 0, right: 0 }
  const top = rect.bottom + 6
  const style = align === 'right'
    ? { top, right: window.innerWidth - rect.right }
    : { top, left: rect.left }

  const classes = ['dropdown', className].filter(Boolean).join(' ')

  return createPortal(
    <div ref={dropRef} className={classes} style={style}>
      {children}
    </div>,
    document.body
  )
}

Dropdown.Divider = function DropdownDivider() {
  return <div className="dropdown-divider" />
}
