import { useId, useState } from 'react'
import type { FieldSpec } from '../../lib/paramSchema'

interface Props {
  spec: FieldSpec
  value: number
  onChange: (value: number) => void
  error?: boolean
}

function formatValue(value: number, integer?: boolean): string {
  if (integer) return String(Math.round(value))
  return Number.isInteger(value) ? value.toFixed(1) : String(Math.round(value * 100) / 100)
}

export function SliderField({ spec, value, onChange, error }: Props): React.JSX.Element {
  const id = useId()
  const clamped = Math.min(spec.max, Math.max(spec.min, value))
  const pct = ((clamped - spec.min) / (spec.max - spec.min)) * 100

  const trackColor = error ? 'var(--color-error)' : 'var(--color-accent)'
  const gradient = `linear-gradient(to right, ${trackColor} 0%, ${trackColor} ${pct}%, var(--color-border) ${pct}%, var(--color-border) 100%)`

  // Numeric field keeps its own draft text while focused so a reformatted
  // prop value (e.g. "2" -> "2.0") can't clobber a keystroke mid-type.
  const [text, setText] = useState(() => formatValue(value, spec.integer))
  const [focused, setFocused] = useState(false)
  const [syncedValue, setSyncedValue] = useState(value)

  if (!focused && value !== syncedValue) {
    setSyncedValue(value)
    setText(formatValue(value, spec.integer))
  }

  return (
    <div className="mb-2.5">
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={id} className="text-param-label text-text-secondary">
          {spec.label}
        </label>
        <div
          className={`flex items-baseline gap-1 rounded-sm border bg-bg-sunken px-1.5 py-0.5 ${
            error ? 'border-error shadow-[0_0_0_3px_var(--color-error-soft)]' : 'border-border'
          }`}
        >
          <input
            type="text"
            inputMode="decimal"
            value={text}
            onFocus={() => setFocused(true)}
            onChange={(e) => {
              setText(e.target.value)
              const n = parseFloat(e.target.value)
              if (!Number.isNaN(n)) onChange(n)
            }}
            onBlur={() => {
              setFocused(false)
              setText(formatValue(value, spec.integer))
            }}
            className={`w-12 bg-transparent text-right font-mono text-value tabular-nums outline-none focus:text-text-primary ${
              error ? 'text-error' : 'text-text-primary'
            }`}
          />
          {spec.unit && <span className="font-mono text-unit text-text-tertiary">{spec.unit}</span>}
        </div>
      </div>
      <input
        id={id}
        type="range"
        min={spec.min}
        max={spec.max}
        step={spec.step}
        value={clamped}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ background: gradient }}
        className="h-4 w-full cursor-pointer appearance-none rounded-full outline-none
          [&::-webkit-slider-runnable-track]:h-[3px] [&::-webkit-slider-runnable-track]:rounded-full
          [&::-webkit-slider-thumb]:mt-[-5px] [&::-webkit-slider-thumb]:h-[13px] [&::-webkit-slider-thumb]:w-[13px]
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-[#E9EAEB] [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-[rgba(0,0,0,0.35)]
          [&::-webkit-slider-thumb]:shadow-[0_1px_3px_rgba(0,0,0,0.55)]
          focus:[&::-webkit-slider-thumb]:h-[15px] focus:[&::-webkit-slider-thumb]:w-[15px] focus:[&::-webkit-slider-thumb]:bg-white
          focus:[&::-webkit-slider-thumb]:shadow-[0_0_0_4px_var(--color-accent-soft),0_1px_3px_rgba(0,0,0,0.55)]"
      />
    </div>
  )
}
