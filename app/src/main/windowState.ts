import { app, BrowserWindow, Rectangle } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync } from 'fs'

const STATE_FILE = (): string => join(app.getPath('userData'), 'window-state.json')

export function loadWindowState(defaults: { width: number; height: number }): Rectangle {
  try {
    const raw = readFileSync(STATE_FILE(), 'utf-8')
    const parsed = JSON.parse(raw)
    if (
      typeof parsed.width === 'number' &&
      typeof parsed.height === 'number' &&
      typeof parsed.x === 'number' &&
      typeof parsed.y === 'number'
    ) {
      return parsed
    }
  } catch {
    // no saved state yet
  }
  return { x: 0, y: 0, width: defaults.width, height: defaults.height }
}

export function trackWindowState(win: BrowserWindow): void {
  const save = (): void => {
    if (win.isDestroyed()) return
    const bounds = win.isMaximized() ? win.getNormalBounds() : win.getBounds()
    try {
      writeFileSync(STATE_FILE(), JSON.stringify(bounds))
    } catch {
      // best-effort
    }
  }
  win.on('resize', save)
  win.on('move', save)
  win.on('close', save)
}
