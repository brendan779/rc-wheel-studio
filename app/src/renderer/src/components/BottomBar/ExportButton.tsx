import { useAppStore } from '../../store/useAppStore'
import { CheckCircleIcon, DownloadIcon } from '../icons'

export function ExportButton(): React.JSX.Element {
  const params = useAppStore((s) => s.params)
  const tread = useAppStore((s) => s.tread)
  const outputDir = useAppStore((s) => s.outputDir)
  const setOutputDir = useAppStore((s) => s.setOutputDir)
  const buildState = useAppStore((s) => s.buildState)
  const exportState = useAppStore((s) => s.exportState)
  const exportProgress = useAppStore((s) => s.exportProgress)
  const exportResult = useAppStore((s) => s.exportResult)
  const setExportState = useAppStore((s) => s.setExportState)
  const setExportProgress = useAppStore((s) => s.setExportProgress)
  const setExportResult = useAppStore((s) => s.setExportResult)
  const setExportError = useAppStore((s) => s.setExportError)

  const disabled = buildState === 'error' || exportState === 'exporting'

  const handleClick = async (): Promise<void> => {
    let dir = outputDir
    if (!dir) {
      dir = await window.api.dialog.pickOutputDir()
      if (!dir) return
      setOutputDir(dir)
    }
    setExportState('exporting')
    setExportProgress({ pct: 0, stage: 'Starting…' })
    const response = await window.api.export.run({ params, tread, outdir: dir }, (progress) => {
      setExportProgress(progress)
    })
    if (response.ok) {
      setExportResult(response)
    } else {
      setExportError(response.message)
    }
  }

  if (exportState === 'exporting') {
    return (
      <div className="relative flex h-10 w-[220px] items-center overflow-hidden rounded-md border border-accent-border bg-bg-sunken px-4">
        <div
          className="absolute inset-y-0 left-0 bg-accent-soft transition-[width] duration-300"
          style={{ width: `${exportProgress?.pct ?? 0}%` }}
        />
        <span className="relative z-10 mr-2 h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <span className="relative z-10 truncate text-button font-medium text-accent">
          {exportProgress?.stage ?? 'Building…'}{' '}
          <span className="font-mono tabular-nums">{Math.round(exportProgress?.pct ?? 0)}%</span>
        </span>
      </div>
    )
  }

  if (exportState === 'done' && exportResult) {
    return (
      <div className="flex h-10 items-center gap-3 rounded-md border border-border bg-bg-sunken px-3.5">
        <span className="flex items-center gap-1.5 text-[12.5px] text-text-primary">
          <span className="text-success">
            <CheckCircleIcon width={16} height={16} />
          </span>
          Exported
        </span>
        <button
          type="button"
          onClick={() => window.api.shell.reveal(exportResult.outdir)}
          className="text-[12px] font-medium text-accent hover:text-accent-hover"
        >
          Reveal in Finder →
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      className={`flex h-10 items-center gap-2 rounded-md px-[22px] text-button font-semibold transition-colors ${
        disabled
          ? 'cursor-not-allowed border border-border-subtle bg-bg-sunken text-text-disabled opacity-55'
          : 'bg-accent text-on-accent shadow-[0_2px_10px_rgba(244,162,89,0.28)] hover:bg-accent-hover active:bg-accent-active'
      }`}
    >
      <DownloadIcon width={16} height={16} />
      Export STL
    </button>
  )
}
