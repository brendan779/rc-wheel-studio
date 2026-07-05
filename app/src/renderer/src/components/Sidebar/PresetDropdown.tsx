import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { ChevronIcon } from '../icons'
import type { Preset } from '@shared/types'

export function PresetDropdown(): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const presets = useAppStore((s) => s.presets)
  const setPresets = useAppStore((s) => s.setPresets)
  const presetId = useAppStore((s) => s.presetId)
  const dirty = useAppStore((s) => s.dirty)
  const applyPreset = useAppStore((s) => s.applyPreset)
  const params = useAppStore((s) => s.params)
  const tread = useAppStore((s) => s.tread)

  const current = presets.find((p) => p.id === presetId)
  const label = (current?.name ?? 'Custom') + (dirty ? ' *' : '')

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent): void => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  const saveCurrentAsPreset = async (): Promise<void> => {
    const name = window.prompt('Preset name?')
    if (!name) return
    const preset: Preset = {
      id: crypto.randomUUID(),
      name,
      params,
      tread
    }
    const next = [...presets.filter((p) => p.builtIn), ...presets.filter((p) => !p.builtIn), preset]
    setPresets(next)
    await window.api.presets.save(next.filter((p) => !p.builtIn))
    applyPreset(preset)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex h-8 w-full items-center justify-between rounded-md border bg-bg-sunken px-2.5 ${
          open ? 'border-accent-border' : 'border-border'
        }`}
      >
        <span className="truncate text-preset font-medium text-text-primary">{label}</span>
        <span
          className={`shrink-0 transition-transform ${open ? 'rotate-90 text-accent' : 'text-text-secondary'}`}
        >
          <ChevronIcon />
        </span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-20 mt-1.5 overflow-hidden rounded-md border border-border bg-bg-overlay shadow-lg">
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                applyPreset(p)
                setOpen(false)
              }}
              className={`block w-full px-2.5 py-2 text-left text-[12.5px] ${
                p.id === presetId
                  ? 'bg-accent-soft text-accent'
                  : 'text-text-primary hover:bg-bg-hover'
              }`}
            >
              {p.name}
            </button>
          ))}
          <div className="border-t border-border-subtle">
            <button
              type="button"
              onClick={saveCurrentAsPreset}
              className="block w-full px-2.5 py-2 text-left text-[12.5px] text-text-secondary hover:bg-bg-hover"
            >
              + New from current…
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
