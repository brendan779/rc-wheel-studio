import { useMemo } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { validateParams } from '../../lib/validate'
import { SegmentedControl } from './SegmentedControl'
import { ExportButton } from './ExportButton'
import {
  RimHolesIcon,
  RimSolidIcon,
  RimSpokedIcon,
  RimSport3Icon,
  TreadOffroadIcon,
  TreadSmoothIcon,
  TreadTarmacIcon
} from '../icons'
import type { RimStyle, Tread } from '@shared/types'

const TREAD_OPTIONS: { value: Tread; label: string; icon: React.ReactNode }[] = [
  { value: 'smooth', label: 'Smooth', icon: <TreadSmoothIcon /> },
  { value: 'offroad', label: 'Offroad', icon: <TreadOffroadIcon /> },
  { value: 'tarmac', label: 'Tarmac', icon: <TreadTarmacIcon /> }
]

const RIM_OPTIONS: { value: RimStyle; label: string; icon: React.ReactNode }[] = [
  { value: 'solid', label: 'Solid', icon: <RimSolidIcon /> },
  { value: 'holes', label: 'Holes', icon: <RimHolesIcon /> },
  { value: 'spoked', label: 'Spoked', icon: <RimSpokedIcon /> },
  { value: 'sport3', label: 'Sport-3', icon: <RimSport3Icon /> }
]

export function BottomBar(): React.JSX.Element {
  const tread = useAppStore((s) => s.tread)
  const setTread = useAppStore((s) => s.setTread)
  const rimStyle = useAppStore((s) => s.params.rim_style)
  const setRimStyle = useAppStore((s) => s.setRimStyle)
  const params = useAppStore((s) => s.params)
  const outputDir = useAppStore((s) => s.outputDir)
  const setOutputDir = useAppStore((s) => s.setOutputDir)

  const issueCount = useMemo(() => validateParams(params).length, [params])

  return (
    <div className="flex h-[74px] shrink-0 items-center gap-[22px] border-t border-border-subtle bg-bg-elevated px-[18px]">
      <SegmentedControl options={TREAD_OPTIONS} value={tread} onChange={setTread} />
      <SegmentedControl options={RIM_OPTIONS} value={rimStyle} onChange={setRimStyle} />

      <div className="flex-1" />

      {issueCount > 0 && (
        <span className="text-[12px] font-medium text-error">
          {issueCount} parameter{issueCount > 1 ? 's' : ''} {issueCount > 1 ? 'need' : 'needs'}{' '}
          attention
        </span>
      )}

      <button
        type="button"
        onClick={async () => {
          const dir = await window.api.dialog.pickOutputDir()
          if (dir) setOutputDir(dir)
        }}
        className="h-9 max-w-[180px] truncate rounded-md border border-border bg-bg-sunken px-3 text-[12.5px] text-text-secondary hover:bg-bg-hover"
        title={outputDir ?? 'Choose output folder'}
      >
        {outputDir ? outputDir.split('/').pop() : 'Choose folder…'}
      </button>

      <ExportButton />
    </div>
  )
}
