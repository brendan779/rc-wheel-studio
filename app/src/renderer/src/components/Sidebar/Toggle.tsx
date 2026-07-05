interface Props {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  hint?: string
}

export function Toggle({ label, checked, onChange, hint }: Props): React.JSX.Element {
  return (
    <label className="mb-2.5 flex cursor-pointer items-start justify-between gap-3">
      <span>
        <span className="block text-param-label text-text-secondary">{label}</span>
        {hint && (
          <span className="mt-0.5 block text-[10.5px] leading-snug text-text-tertiary">{hint}</span>
        )}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`mt-0.5 h-[18px] w-[32px] shrink-0 rounded-full border transition-colors duration-[90ms] ${
          checked ? 'border-accent-border bg-accent-soft' : 'border-border bg-bg-sunken'
        }`}
      >
        <span
          className={`block h-[12px] w-[12px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.4)] transition-transform duration-[90ms] ${
            checked ? 'translate-x-[16px]' : 'translate-x-[2px]'
          }`}
        />
      </button>
    </label>
  )
}
