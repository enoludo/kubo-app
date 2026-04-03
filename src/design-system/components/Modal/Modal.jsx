import { createPortal } from 'react-dom'

/**
 * Modal — composant générique
 * Overlay + conteneur pour toutes les boîtes de dialogue.
 *
 * @param {function}              onClose         callback fermeture (si absent : overlay non cliquable)
 * @param {'sm'|'md'|'lg'|'xl'}  size            largeur : sm=420 md=460 lg=640 xl=900 (défaut: md)
 * @param {boolean}               scrollBody      scroll interne du modal (max-height + overflow-y: auto)
 * @param {boolean}               innerScroll     layout interne qui gère son propre scroll (ex: 2 colonnes)
 * @param {'default'|'dark'}      overlayVariant  dark = fond sombre + z-index élevé
 * @param {string}                className       classes additionnelles sur .modal
 */
export default function Modal({
  onClose,
  size = 'md',
  scrollBody = false,
  innerScroll = false,
  overlayVariant = 'default',
  className = '',
  children,
}) {
  const overlayClasses = [
    'modal-overlay',
    overlayVariant === 'dark' ? 'modal-overlay--dark' : '',
  ].filter(Boolean).join(' ')

  const modalClasses = [
    'modal',
    size !== 'md' ? `modal--${size}` : '',
    scrollBody   ? 'modal--scroll'       : '',
    innerScroll  ? 'modal--inner-scroll' : '',
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
