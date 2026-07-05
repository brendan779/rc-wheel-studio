interface Option<T extends string> {
  value: T
  label: string
  icon: React.ReactNode
}

interface Props<T extends string> {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange
}: Props<T>): React.JSX.Element {
  return (
    <div className="flex gap-0.5 rounded-md border border-border bg-bg-sunken p-0.5">
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-[12.5px] font-medium transition-colors duration-[90ms] ${
              active
                ? 'bg-accent-soft text-accent shadow-[inset_0_0_0_1px_var(--color-accent-border)]'
                : 'text-text-secondary hover:bg-bg-hover'
            }`}
          >
            <span className="[&_svg]:h-[15px] [&_svg]:w-[15px]">{opt.icon}</span>
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
