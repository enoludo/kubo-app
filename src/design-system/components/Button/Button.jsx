/**
 * Button — composant générique
 *
 * @param {'primary' | 'secondary' | 'danger'} variant
 * @param {string}  className  classes additionnelles
 * @param {React.ReactNode} children
 */
export default function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}) {
  return (
    <button className={`btn-${variant}${className ? ` ${className}` : ''}`} {...props}>
      {children}
    </button>
  )
}
