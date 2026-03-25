/**
 * Input — composant générique
 * Affiche optionnellement un label et gère les états d'erreur.
 *
 * @param {string}   label      texte du label (optionnel)
 * @param {string}   id         id pour l'association label ↔ input
 * @param {boolean}  error      active le style d'erreur
 * @param {string}   className  classes additionnelles sur l'input
 */
export default function Input({
  label,
  id,
  error = false,
  className = '',
  ...props
}) {
  return (
    <div className="input-field">
      {label && (
        <label className="field-label" htmlFor={id}>
          {label}
        </label>
      )}
      <input
        id={id}
        className={`field-input${error ? ' field-input--error' : ''}${className ? ` ${className}` : ''}`}
        {...props}
      />
    </div>
  )
}
