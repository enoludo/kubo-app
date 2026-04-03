// ─── Range Slider — double curseur via react-range ────────────────────────────
import { Range, getTrackBackground } from 'react-range'

export default function RangeSlider({ min, max, valueMin, valueMax, onChange, color, step = 1 }) {
  const values = [valueMin, valueMax]

  return (
    <div style={{ width: '100%' }}>

      <Range
        step={step}
        min={min}
        max={max}
        values={values}
        onChange={vals => onChange(vals[0], vals[1])}
        renderTrack={({ props, children }) => (
          <div
            {...props}
            style={{
              ...props.style,
              height: '6px',
              width: '100%',
              borderRadius: '9999px',
              background: getTrackBackground({
                values,
                colors: [
                  'var(--color-grey-200)',
                  color || 'var(--color-grey-500)',
                  'var(--color-grey-200)',
                ],
                min,
                max,
              }),
            }}
          >
            {children}
          </div>
        )}
        renderThumb={({ props }) => (
          <div
            {...props}
            key={props.key}
            style={{
              ...props.style,
              height: '20px',
              width: '20px',
              borderRadius: '50%',
              backgroundColor: 'white',
              border: `2px solid ${color || 'var(--color-grey-500)'}`,
              boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
              outline: 'none',
            }}
          />
        )}
      />

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: 'var(--space-sm)',
        fontFamily: 'var(--font-family-base)',
        fontSize: 'var(--font-size-sm)',
        fontWeight: 'var(--font-weight-medium)',
        color: 'var(--text-primary)',
      }}>
        <span>Min : {valueMin}°C</span>
        <span>Max : {valueMax}°C</span>
      </div>

    </div>
  )
}
