/**
 * Badge — composant générique
 * Pour les statuts, canaux, étiquettes.
 *
 * @param {'success'|'warning'|'danger'|'neutral'|'accent'} variant
 * @param {'sm'|'md'|'lg'} size
 * @param {boolean} pill   border-radius full
 * @param {string}  dot    couleur CSS du point (ex: 'var(--order-boutique)')
 */
export default function Badge({
  variant = 'neutral',
  size = 'md',
  pill = false,
  dot,
  className = '',
  children,
  ...props
}) {
  const classes = [
    'badge',
    `badge--${variant}`,
    `badge--${size}`,
    pill ? 'badge--pill' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <span className={classes} {...props}>
      {dot && (
        <span className="badge-dot" style={{ background: dot }} />
      )}
      {children}
    </span>
  )
}
