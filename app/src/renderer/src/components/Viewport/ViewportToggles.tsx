import { useAppStore } from '../../store/useAppStore'
import { ViewAssembledIcon, ViewExplodedIcon, ViewSectionIcon, ViewWireframeIcon } from '../icons'

function ToggleButton({
  active,
  onClick,
  title,
  children
}: {
  active: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`flex h-[34px] w-[34px] items-center justify-center rounded-md transition-colors duration-[90ms] ${
        active
          ? 'text-accent shadow-[inset_0_0_0_1px_var(--color-accent-border)] bg-accent-soft'
          : 'text-text-secondary hover:bg-bg-hover'
      }`}
    >
      {children}
    </button>
  )
}

export function ViewportToggles(): React.JSX.Element {
  const viewportMode = useAppStore((s) => s.viewportMode)
  const setViewportMode = useAppStore((s) => s.setViewportMode)
  const section = useAppStore((s) => s.section)
  const toggleSection = useAppStore((s) => s.toggleSection)
  const wireframe = useAppStore((s) => s.wireframe)
  const toggleWireframe = useAppStore((s) => s.toggleWireframe)

  const exploded = viewportMode === 'exploded'

  return (
    <div className="absolute top-3.5 right-3.5 flex flex-col gap-1.5 rounded-lg border border-border bg-bg-base/72 p-1.5 shadow-lg backdrop-blur-md">
      <ToggleButton
        active={exploded}
        onClick={() => setViewportMode(exploded ? 'assembled' : 'exploded')}
        title={exploded ? 'Show assembled' : 'Show exploded'}
      >
        {exploded ? <ViewExplodedIcon /> : <ViewAssembledIcon />}
      </ToggleButton>
      <ToggleButton active={section} onClick={toggleSection} title="Section view">
        <ViewSectionIcon />
      </ToggleButton>
      <ToggleButton active={wireframe} onClick={toggleWireframe} title="Wireframe">
        <ViewWireframeIcon />
      </ToggleButton>
    </div>
  )
}
