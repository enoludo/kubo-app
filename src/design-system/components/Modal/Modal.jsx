import { createPortal } from 'react-dom'

/**
 * Modal — composant générique
 * Overlay + conteneur pour toutes les boîtes de dialogue.
 *
 * @param {function}              onClose         callback fermeture (si absent : overlay non cliquable)
 * @param {'sm'|'md'|'lg'|'xl'}  size            largeur : sm=420 md=460 lg=640 xl=860 (défaut: md)
 * @param {boolean}               scrollBody      scroll interne du modal (max-height + overflow-y: auto)
 * @param {'default'|'dark'}      overlayVariant  dark = fond sombre + z-index élevé
 * @param {'center'|'bottom'}     align           bottom = sheet depuis le bas
 * @param {string}                className       classes additionnelles sur .modal
 */
export default function Modal({
  onClose,
  size = 'md',
  scrollBody = false,
  overlayVariant = 'default',
  align = 'center',
  className = '',
  children,
}) {
  const overlayClasses = [
    'modal-overlay',
    overlayVariant === 'dark'  ? 'modal-overlay--dark'   : '',
    align           === 'bottom' ? 'modal-overlay--bottom' : '',
  ].filter(Boolean).join(' ')

  const modalClasses = [
    'modal',
    size !== 'md'      ? `modal--${size}` : '',
    scrollBody         ? 'modal--scroll'  : '',
    align === 'bottom' ? 'modal--bottom'  : '',
    className,
  ].filter(Boolean).join(' ')

  return createPortal(
    <div className={overlayClasses} onClick={onClose}>
      <div className={modalClasses} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body
  )
}
