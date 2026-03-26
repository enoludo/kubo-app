/**
 * Button — composant générique
 *
 * @param {'default' | 'danger' | 'success'} variant
 * @param {string}  className  classes additionnelles
 * @param {React.ReactNode} children
 */
export default function Button({
  variant = 'default',
  className = '',
  children,
  ...props
}) {
  return (
    <button className={[`btn--${variant}`, className].filter(Boolean).join(' ')} {...props}>
      {children}
    </button>
  )
}
