import { useEffect, useState } from 'react'
import type { PythonEnvStatus } from '@shared/types'
import { Titlebar } from './components/Titlebar'
import { Sidebar } from './components/Sidebar/Sidebar'
import { Viewport } from './components/Viewport/Viewport'
import { BottomBar } from './components/BottomBar/BottomBar'
import { PythonSetupScreen } from './components/PythonSetupScreen'
import { useLivePreview } from './hooks/useLivePreview'
import { useAppStore } from './store/useAppStore'
import { BUILT_IN_PRESETS } from '@shared/types'

function MainApp(): React.JSX.Element {
  useLivePreview()

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl bg-bg-base">
      <Titlebar />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <Viewport />
      </div>
      <BottomBar />
    </div>
  )
}

function App(): React.JSX.Element {
  const [pythonStatus, setPythonStatus] = useState<PythonEnvStatus | null>(null)
  const setPresets = useAppStore((s) => s.setPresets)

  useEffect(() => {
    window.api.python.check().then(setPythonStatus)
    window.api.presets.load().then((saved) => {
      if (saved.length > 0) setPresets([...BUILT_IN_PRESETS, ...saved])
    })
  }, [setPresets])

  if (!pythonStatus) {
    return <div className="viewport-bg h-full w-full" />
  }

  if (!pythonStatus.ready) {
    return (
      <PythonSetupScreen
        status={pythonStatus}
        onReady={() => setPythonStatus({ ...pythonStatus, ready: true })}
      />
    )
  }

  return <MainApp />
}

export default App
