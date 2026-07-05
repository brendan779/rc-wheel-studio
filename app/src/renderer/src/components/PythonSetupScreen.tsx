import { useState } from 'react'
import type { PythonEnvStatus, SetupProgress } from '@shared/types'

interface Props {
  status: PythonEnvStatus
  onReady: () => void
}

export function PythonSetupScreen({ status, onReady }: Props): React.JSX.Element {
  const [running, setRunning] = useState(false)
  const [log, setLog] = useState('')
  const [stage, setStage] = useState('')
  const [error, setError] = useState<string | null>(null)

  const runSetup = async (): Promise<void> => {
    setRunning(true)
    setError(null)
    const result = await window.api.python.setup((p: SetupProgress) => {
      setStage(p.stage)
      if (p.log) setLog((prev) => (prev + p.log).slice(-4000))
    })
    setRunning(false)
    if (result.ready) onReady()
    else setError(result.detail)
  }

  return (
    <div className="viewport-bg flex h-full w-full flex-col items-center justify-center gap-5 px-10 text-center">
      <div className="max-w-md">
        <h1 className="text-[18px] font-semibold text-text-primary">First-time setup</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-text-secondary">
          RC Wheel Studio needs a Python environment with{' '}
          <code className="font-mono text-text-primary">build123d</code> to generate wheel geometry.
        </p>
        <p className="mt-2 text-[11.5px] text-text-tertiary">{status.detail}</p>
      </div>

      {running ? (
        <div className="w-full max-w-md">
          <div className="mb-2 text-[12.5px] text-accent">{stage}</div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-bg-sunken">
            <div className="h-full w-1/3 animate-pulse rounded-full bg-accent" />
          </div>
          {log && (
            <pre className="mt-3 max-h-40 overflow-y-auto rounded-md border border-border-subtle bg-bg-sunken p-2 text-left font-mono text-[10.5px] text-text-tertiary">
              {log}
            </pre>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={runSetup}
          className="h-10 rounded-md bg-accent px-6 text-button font-semibold text-on-accent shadow-[0_2px_10px_rgba(244,162,89,0.28)] hover:bg-accent-hover"
        >
          Set up Python environment
        </button>
      )}

      {error && <div className="max-w-md text-[11.5px] text-error">{error}</div>}
    </div>
  )
}
