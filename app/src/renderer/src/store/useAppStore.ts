import { create } from 'zustand'
import type { ExportProgress, ExportResult, Params, Preset, RimStyle, Tread } from '@shared/types'
import { BUILT_IN_PRESETS, DEFAULT_PARAMS, DEFAULT_TREAD } from '@shared/types'

export type BuildState = 'idle' | 'debouncing' | 'building' | 'ready' | 'error'
export type ExportState = 'idle' | 'exporting' | 'done' | 'error'
export type ViewportMode = 'assembled' | 'exploded'

interface AppState {
  params: Params
  tread: Tread
  presetId: string | null
  dirty: boolean
  presets: Preset[]

  setParam: <K extends keyof Params>(key: K, value: Params[K]) => void
  setTread: (tread: Tread) => void
  setRimStyle: (style: RimStyle) => void
  applyPreset: (preset: Preset) => void
  setPresets: (presets: Preset[]) => void

  outputDir: string | null
  setOutputDir: (dir: string | null) => void

  viewportMode: ViewportMode
  section: boolean
  wireframe: boolean
  setViewportMode: (mode: ViewportMode) => void
  toggleSection: () => void
  toggleWireframe: () => void

  buildState: BuildState
  buildError: string | null
  buildErrorFields: string[]
  rimStlPaths: string[]
  tyreStlPath: string | null
  setBuildState: (state: BuildState) => void
  setBuildError: (message: string | null, fields?: string[]) => void
  setStlPaths: (rim: string[], tyre: string) => void

  exportState: ExportState
  exportProgress: ExportProgress | null
  exportResult: ExportResult | null
  exportError: string | null
  setExportState: (state: ExportState) => void
  setExportProgress: (progress: ExportProgress) => void
  setExportResult: (result: ExportResult) => void
  setExportError: (message: string | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  params: DEFAULT_PARAMS,
  tread: DEFAULT_TREAD,
  presetId: BUILT_IN_PRESETS[0].id,
  dirty: false,
  presets: BUILT_IN_PRESETS,

  setParam: (key, value) =>
    set((state) => ({
      params: { ...state.params, [key]: value },
      dirty: true,
      exportState: 'idle',
      exportResult: null
    })),
  setTread: (tread) => set({ tread, dirty: true, exportState: 'idle', exportResult: null }),
  setRimStyle: (style) =>
    set((state) => ({
      params: { ...state.params, rim_style: style },
      dirty: true,
      exportState: 'idle',
      exportResult: null
    })),
  applyPreset: (preset) =>
    set({
      params: preset.params,
      tread: preset.tread,
      presetId: preset.id,
      dirty: false,
      exportState: 'idle',
      exportResult: null
    }),
  setPresets: (presets) => set({ presets }),

  outputDir: null,
  setOutputDir: (dir) => set({ outputDir: dir }),

  viewportMode: 'assembled',
  section: false,
  wireframe: false,
  setViewportMode: (mode) => set({ viewportMode: mode }),
  toggleSection: () => set((state) => ({ section: !state.section })),
  toggleWireframe: () => set((state) => ({ wireframe: !state.wireframe })),

  buildState: 'idle',
  buildError: null,
  buildErrorFields: [],
  rimStlPaths: [],
  tyreStlPath: null,
  setBuildState: (buildState) => set({ buildState }),
  setBuildError: (message, fields = []) => set({ buildError: message, buildErrorFields: fields }),
  setStlPaths: (rim, tyre) => set({ rimStlPaths: rim, tyreStlPath: tyre }),

  exportState: 'idle',
  exportProgress: null,
  exportResult: null,
  exportError: null,
  setExportState: (exportState) => set({ exportState }),
  setExportProgress: (exportProgress) => set({ exportProgress }),
  setExportResult: (exportResult) => set({ exportResult, exportState: 'done' }),
  setExportError: (exportError) => set({ exportError, exportState: exportError ? 'error' : 'idle' })
}))
