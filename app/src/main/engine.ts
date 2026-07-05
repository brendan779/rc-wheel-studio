import { spawn, ChildProcessWithoutNullStreams } from 'child_process'
import { mkdtempSync, writeFileSync, mkdirSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { checkPythonEnv, wheelScriptPath } from './pythonEnv'
import type {
  ExportRequest,
  ExportResponse,
  Params,
  PreviewRequest,
  PreviewResponse,
  Tread
} from '../shared/types'

function paramsCacheKey(params: Params, tread: Tread): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => [k, (params as unknown as Record<string, unknown>)[k]])
  return JSON.stringify([sorted, tread])
}

interface CacheEntry {
  rimStlPaths: string[]
  tyreStlPath: string
}
const previewCache = new Map<string, CacheEntry>()
const MAX_CACHE = 30

let inFlight: { child: ChildProcessWithoutNullStreams; requestId: string } | null = null

function writeParamsFile(params: Params, dir: string): string {
  const path = join(dir, 'params.json')
  writeFileSync(path, JSON.stringify(params))
  return path
}

function trimNum(n: number): string {
  return Number.isInteger(n) ? String(n) : String(parseFloat(n.toFixed(4)))
}

/** Mirrors wheel.py's generate()/main() output filenames exactly. */
function rimStlPaths(dir: string, params: Params): string[] {
  const tag = `D${trimNum(params.tyre_od)}xW${trimNum(params.width)}`
  const rimTag = params.rim_style === 'solid' ? tag : `${params.rim_style}_${tag}`
  return params.split_rim
    ? [join(dir, `Rim_${rimTag}_A.stl`), join(dir, `Rim_${rimTag}_B.stl`)]
    : [join(dir, `Rim_${rimTag}.stl`)]
}

function tyreStlPath(dir: string, params: Params, tread: Tread): string {
  const tag = `D${trimNum(params.tyre_od)}xW${trimNum(params.width)}`
  return join(dir, `Tyre_${tread}_${tag}.stl`)
}

/** Parses "AssertionError: <message>" out of a Python traceback on stderr. */
function extractAssertion(stderr: string): { message: string; fields: string[] } {
  const match = stderr.match(/AssertionError:?\s*(.+)/)
  const message = match ? match[1].trim() : stderr.trim().split('\n').slice(-1)[0] || 'Build failed'
  const fields: string[] = []
  const knownFields = [
    'flange_ext',
    'hub_od',
    'barrel_wall',
    'axle_d',
    'boss_wall',
    'tyre_od',
    'tread_depth',
    'spoke_w',
    'blade_w'
  ]
  for (const f of knownFields) {
    if (message.includes(f)) fields.push(f)
  }
  return { message, fields }
}

export function cancelInFlightPreview(): void {
  if (inFlight) {
    inFlight.child.kill()
    inFlight = null
  }
}

export function generatePreview(request: PreviewRequest): Promise<PreviewResponse> {
  const key = paramsCacheKey(request.params, request.tread)
  const cached = previewCache.get(key)
  if (cached) {
    return Promise.resolve({
      requestId: request.requestId,
      ok: true,
      rimStlPaths: cached.rimStlPaths,
      tyreStlPath: cached.tyreStlPath
    })
  }

  cancelInFlightPreview()

  return new Promise((resolve) => {
    const env = checkPythonEnv()
    if (!env.ready || !env.pythonPath) {
      resolve({ requestId: request.requestId, ok: false, message: env.detail, fields: [] })
      return
    }

    const workDir = mkdtempSync(join(tmpdir(), 'rc-wheel-preview-'))
    const paramsPath = writeParamsFile(request.params, workDir)

    const child = spawn(env.pythonPath, [
      wheelScriptPath(),
      '--tread',
      request.tread,
      '--params-json',
      paramsPath,
      '--preview',
      '--outdir',
      workDir
    ])
    inFlight = { child, requestId: request.requestId }

    let stderr = ''
    child.stderr.on('data', (d) => (stderr += d.toString()))
    child.on('error', (err) => {
      if (inFlight?.child === child) inFlight = null
      resolve({ requestId: request.requestId, ok: false, message: err.message, fields: [] })
    })
    child.on('exit', (code, signal) => {
      if (inFlight?.child === child) inFlight = null
      if (signal === 'SIGTERM' || signal === 'SIGKILL') return // superseded, caller already moved on
      if (code !== 0) {
        const { message, fields } = extractAssertion(stderr)
        resolve({ requestId: request.requestId, ok: false, message, fields })
        return
      }
      const rimPaths = rimStlPaths(workDir, request.params)
      const tyrePath = tyreStlPath(workDir, request.params, request.tread)

      if (previewCache.size >= MAX_CACHE) {
        const firstKey = previewCache.keys().next().value
        if (firstKey) previewCache.delete(firstKey)
      }
      previewCache.set(key, { rimStlPaths: rimPaths, tyreStlPath: tyrePath })

      resolve({
        requestId: request.requestId,
        ok: true,
        rimStlPaths: rimPaths,
        tyreStlPath: tyrePath
      })
    })
  })
}

export function exportFiles(
  request: ExportRequest,
  onProgress: (pct: number, stage: string) => void
): Promise<ExportResponse> {
  return new Promise((resolve) => {
    const env = checkPythonEnv()
    if (!env.ready || !env.pythonPath) {
      resolve({ ok: false, message: env.detail })
      return
    }

    mkdirSync(request.outdir, { recursive: true })
    const workDir = mkdtempSync(join(tmpdir(), 'rc-wheel-export-'))
    const paramsPath = writeParamsFile(request.params, workDir)

    onProgress(8, 'Building rim…')
    const child = spawn(env.pythonPath, [
      wheelScriptPath(),
      '--tread',
      request.tread,
      '--params-json',
      paramsPath,
      '--outdir',
      request.outdir
    ])

    // wheel.py has no granular progress output; approximate with a timed
    // ramp so the UI shows motion during the real 3-15s build.
    let pct = 8
    const ramp = setInterval(() => {
      pct = Math.min(pct + 6, 90)
      onProgress(pct, pct < 50 ? 'Building rim…' : 'Building tyre + 3MF…')
    }, 700)

    let stderr = ''
    child.stderr.on('data', (d) => (stderr += d.toString()))
    child.on('error', (err) => {
      clearInterval(ramp)
      resolve({ ok: false, message: err.message })
    })
    child.on('exit', (code) => {
      clearInterval(ramp)
      if (code !== 0) {
        const { message } = extractAssertion(stderr)
        resolve({ ok: false, message })
        return
      }
      onProgress(100, 'Done')
      const tag = `D${trimNum(request.params.tyre_od)}xW${trimNum(request.params.width)}`
      const files = [
        ...rimStlPaths(request.outdir, request.params),
        tyreStlPath(request.outdir, request.params, request.tread),
        join(request.outdir, `Wheel_${request.tread}_${tag}.3mf`)
      ]
      resolve({ ok: true, files, outdir: request.outdir })
    })
  })
}
