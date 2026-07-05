import { app } from 'electron'
import { spawn, spawnSync } from 'child_process'
import { join } from 'path'
import { existsSync } from 'fs'
import type { PythonEnvStatus, SetupProgress } from '../shared/types'

// Dev layout: <repo>/app is this package, <repo>/venv and <repo>/wheel.py
// are siblings of app/. Packaged layout: wheel.py is bundled read-only into
// resources/ (see electron-builder.yml extraResources), but the venv can't
// live there — app bundles are signed/read-only and not upgrade-safe — so
// it's created in userData on first run instead.
function wheelScriptDir(): string {
  return app.isPackaged ? process.resourcesPath : join(app.getAppPath(), '..')
}

export function wheelScriptPath(): string {
  return join(wheelScriptDir(), 'wheel.py')
}

function venvRoot(): string {
  return app.isPackaged ? app.getPath('userData') : join(app.getAppPath(), '..')
}

function venvPython(): string {
  const bin = process.platform === 'win32' ? 'python.exe' : 'python3'
  const dir = process.platform === 'win32' ? 'Scripts' : 'bin'
  return join(venvRoot(), 'venv', dir, bin)
}

function candidates(): string[] {
  const list = [venvPython()]
  if (process.platform !== 'win32') {
    list.push('/usr/bin/python3', '/usr/local/bin/python3', '/opt/homebrew/bin/python3')
  }
  list.push('python3')
  return list
}

let cached: PythonEnvStatus | null = null

function verify(pythonPath: string): boolean {
  try {
    const result = spawnSync(pythonPath, ['-c', 'import build123d'], { timeout: 8000 })
    return result.status === 0
  } catch {
    return false
  }
}

export function checkPythonEnv(force = false): PythonEnvStatus {
  if (cached && !force) return cached

  if (!existsSync(wheelScriptPath())) {
    cached = {
      ready: false,
      pythonPath: null,
      detail: `wheel.py not found at ${wheelScriptPath()}`
    }
    return cached
  }

  for (const candidate of candidates()) {
    const resolved = candidate.includes('/') && !existsSync(candidate) ? null : candidate
    if (resolved === null) continue
    if (verify(resolved)) {
      cached = { ready: true, pythonPath: resolved, detail: `using ${resolved}` }
      return cached
    }
  }

  cached = {
    ready: false,
    pythonPath: null,
    detail: 'No Python with build123d found (checked venv/ and PATH).'
  }
  return cached
}

/** Creates a venv and installs build123d, reporting progress. */
export function setupPythonEnv(onProgress: (p: SetupProgress) => void): Promise<PythonEnvStatus> {
  return new Promise((resolve) => {
    const venvDir = join(venvRoot(), 'venv')
    onProgress({ stage: 'Creating virtual environment…', log: '' })

    const create = spawn('python3', ['-m', 'venv', venvDir])
    create.stderr.on('data', (d) =>
      onProgress({ stage: 'Creating virtual environment…', log: d.toString() })
    )
    create.on('error', () => {
      cached = { ready: false, pythonPath: null, detail: 'python3 not found on PATH' }
      resolve(cached)
    })
    create.on('exit', (code) => {
      if (code !== 0) {
        cached = { ready: false, pythonPath: null, detail: `venv creation failed (exit ${code})` }
        resolve(cached)
        return
      }
      const pip = join(venvDir, process.platform === 'win32' ? 'Scripts/pip.exe' : 'bin/pip')
      onProgress({ stage: 'Installing build123d (this can take a minute)…', log: '' })
      const install = spawn(pip, ['install', 'build123d'])
      install.stdout.on('data', (d) =>
        onProgress({ stage: 'Installing build123d (this can take a minute)…', log: d.toString() })
      )
      install.stderr.on('data', (d) =>
        onProgress({ stage: 'Installing build123d (this can take a minute)…', log: d.toString() })
      )
      install.on('exit', (installCode) => {
        if (installCode !== 0) {
          cached = {
            ready: false,
            pythonPath: null,
            detail: `pip install failed (exit ${installCode})`
          }
          resolve(cached)
          return
        }
        resolve(checkPythonEnv(true))
      })
    })
  })
}
