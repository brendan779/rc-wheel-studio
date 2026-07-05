import { useAppStore } from '../store/useAppStore'

export function Titlebar(): React.JSX.Element {
  const presets = useAppStore((s) => s.presets)
  const presetId = useAppStore((s) => s.presetId)
  const dirty = useAppStore((s) => s.dirty)
  const name = presets.find((p) => p.id === presetId)?.name ?? 'Custom'

  return (
    <div
      className="flex h-[38px] shrink-0 items-center justify-center border-b border-border-subtle"
      style={
        {
          background: 'linear-gradient(#212429, #1a1d21)',
          WebkitAppRegion: 'drag'
        } as React.CSSProperties
      }
    >
      <span className="text-[12px] font-medium text-text-secondary">
        RC Wheel Studio — {name}
        {dirty ? ' *' : ''}
      </span>
    </div>
  )
}
