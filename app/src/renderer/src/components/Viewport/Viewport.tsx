import { useEffect, useRef } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { WheelScene } from '../../three/WheelScene'
import { ViewportToggles } from './ViewportToggles'
import { BuildingIndicator } from './BuildingIndicator'

export function Viewport(): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<WheelScene | null>(null)

  const rimStlPaths = useAppStore((s) => s.rimStlPaths)
  const tyreStlPath = useAppStore((s) => s.tyreStlPath)
  const viewportMode = useAppStore((s) => s.viewportMode)
  const section = useAppStore((s) => s.section)
  const wireframe = useAppStore((s) => s.wireframe)
  const buildState = useAppStore((s) => s.buildState)
  const buildError = useAppStore((s) => s.buildError)

  useEffect(() => {
    if (!containerRef.current) return
    const scene = new WheelScene(containerRef.current)
    sceneRef.current = scene
    return () => scene.dispose()
  }, [])

  useEffect(() => {
    sceneRef.current?.setMode(viewportMode)
  }, [viewportMode])

  useEffect(() => {
    sceneRef.current?.setSection(section)
  }, [section])

  useEffect(() => {
    sceneRef.current?.setWireframe(wireframe)
  }, [wireframe])

  useEffect(() => {
    if (rimStlPaths.length === 0 || !tyreStlPath) return
    let cancelled = false
    Promise.all([
      Promise.all(rimStlPaths.map((p) => window.api.engine.readFile(p))),
      window.api.engine.readFile(tyreStlPath)
    ]).then(([rimBytesList, tyreBytes]) => {
      if (cancelled) return
      sceneRef.current?.loadMeshes(rimBytesList, tyreBytes)
    })
    return () => {
      cancelled = true
    }
  }, [rimStlPaths, tyreStlPath])

  const paused = buildState === 'error'

  return (
    <div className="relative flex-1 min-w-0 h-full viewport-bg">
      <div ref={containerRef} className={`absolute inset-0 ${paused ? 'opacity-50' : ''}`} />
      <ViewportToggles />
      {buildState === 'building' && <BuildingIndicator label="Building preview…" />}
      {buildState === 'debouncing' && <BuildingIndicator label="Building preview…" dim />}
      {paused && buildError && (
        <div className="absolute bottom-3.5 left-3.5 max-w-sm rounded-lg border border-error-border bg-bg-base/80 px-3 py-2 text-[11.5px] text-error backdrop-blur-md shadow-lg">
          Preview paused — fix the highlighted parameter(s) to rebuild.
        </div>
      )}
    </div>
  )
}
