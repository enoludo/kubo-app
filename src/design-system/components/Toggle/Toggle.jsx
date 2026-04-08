/**
 * Toggle — interrupteur on/off générique
 *
 * @param {boolean}           checked
 * @param {(v: boolean)=>void} onChange
 * @param {string}            [label]
 * @param {boolean}           [disabled]
 */
export default function Toggle({ checked, onChange, label, disabled }) {
  return (
    <button
      type="button"
      className={`ds-toggle${checked ? ' ds-toggle--on' : ''}`}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    >
      <span className="ds-toggle-track">
        <span className="ds-toggle-thumb" />
      </span>
      {label && <span className="ds-toggle-label">{label}</span>}
    </button>
  )
}
