import { app } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import type { Preset } from '../shared/types'

const PRESETS_FILE = (): string => join(app.getPath('userData'), 'presets.json')

export function loadPresets(): Preset[] {
  const path = PRESETS_FILE()
  if (!existsSync(path)) return []
  try {
    return JSON.parse(readFileSync(path, 'utf-8'))
  } catch {
    return []
  }
}

export function savePresets(presets: Preset[]): void {
  writeFileSync(PRESETS_FILE(), JSON.stringify(presets, null, 2))
}
