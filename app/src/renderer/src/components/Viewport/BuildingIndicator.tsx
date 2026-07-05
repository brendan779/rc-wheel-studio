export function BuildingIndicator({
  label,
  dim = false
}: {
  label: string
  dim?: boolean
}): React.JSX.Element {
  return (
    <div
      className={`absolute bottom-3.5 left-3.5 flex h-7 items-center gap-2 rounded-full border border-border-subtle bg-bg-base/72 pl-2.5 pr-3 backdrop-blur-md transition-opacity ${
        dim ? 'opacity-60' : 'opacity-100'
      }`}
    >
      <span className="h-2 w-2 rounded-full bg-accent animate-pulse-dot" />
      <span className="text-[11.5px] text-text-secondary">{label}</span>
    </div>
  )
}
