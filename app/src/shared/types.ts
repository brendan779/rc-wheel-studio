// Mirrors wheel.py's Params dataclass. Keep field names identical —
// they're serialized as-is into --params-json for the engine.
export interface Params {
  // main dimensions
  tyre_od: number
  width: number
  hub_od: number
  axle_d: number

  // rim details
  flange_ext: number
  flange_t: number
  barrel_wall: number
  web_t: number
  boss_wall: number

  rim_style: RimStyle
  spoke_count: number
  spoke_w: number
  blade_w: number
  hole_count: number

  // print the rim as two glued halves (no overhangs under spokes/blades)
  split_rim: boolean

  // tyre details
  shoulder_r: number
  tyre_fit: number
  pocket_clear: number
  tread_depth: number

  // offroad tread
  lug_count: number
  lug_groove_w: number
  chevron_ang: number

  // tarmac tread
  rib_grooves: number
  rib_groove_w: number
  sipe_count: number
  sipe_w: number
  sipe_depth: number
}

export type RimStyle = 'solid' | 'holes' | 'spoked' | 'sport3'
export type Tread = 'smooth' | 'offroad' | 'tarmac'

export const DEFAULT_PARAMS: Params = {
  tyre_od: 55.0,
  width: 12.0,
  hub_od: 30.0,
  axle_d: 4.0,

  flange_ext: 3.0,
  flange_t: 1.5,
  barrel_wall: 2.0,
  web_t: 2.0,
  boss_wall: 2.5,

  rim_style: 'solid',
  spoke_count: 6,
  spoke_w: 3.0,
  blade_w: 7.0,
  hole_count: 6,
  split_rim: false,

  shoulder_r: 3.0,
  tyre_fit: -0.3,
  pocket_clear: 0.4,
  tread_depth: 1.8,

  lug_count: 16,
  lug_groove_w: 3.2,
  chevron_ang: 25.0,

  rib_grooves: 3,
  rib_groove_w: 1.4,
  sipe_count: 40,
  sipe_w: 0.7,
  sipe_depth: 0.8
}

export const DEFAULT_TREAD: Tread = 'smooth'

export interface PreviewRequest {
  requestId: string
  params: Params
  tread: Tread
}

export interface PreviewResult {
  requestId: string
  ok: true
  /** one path (single-piece rim) or two (split_rim halves A/B) */
  rimStlPaths: string[]
  tyreStlPath: string
}

export interface PreviewError {
  requestId: string
  ok: false
  message: string
  /** field names implicated by the engine's assertion, if we could infer them */
  fields: string[]
}

export type PreviewResponse = PreviewResult | PreviewError

export interface ExportRequest {
  params: Params
  tread: Tread
  outdir: string
}

export interface ExportProgress {
  stage: string
  pct: number
}

export interface ExportResult {
  ok: true
  files: string[]
  outdir: string
}

export interface ExportError {
  ok: false
  message: string
}

export type ExportResponse = ExportResult | ExportError

export interface PythonEnvStatus {
  ready: boolean
  pythonPath: string | null
  detail: string
}

export interface SetupProgress {
  stage: string
  log: string
}

export interface Preset {
  id: string
  name: string
  params: Params
  tread: Tread
  builtIn?: boolean
}

export const BUILT_IN_PRESETS: Preset[] = [
  {
    id: 'trainer-55x12',
    name: '55×12 Trainer (default)',
    params: DEFAULT_PARAMS,
    tread: 'smooth',
    builtIn: true
  }
]
