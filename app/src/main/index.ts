import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { readFileSync, realpathSync } from 'fs'
import { tmpdir } from 'os'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { checkPythonEnv, setupPythonEnv } from './pythonEnv'
import { generatePreview, cancelInFlightPreview, exportFiles } from './engine'
import { loadPresets, savePresets } from './presets'
import { loadWindowState, trackWindowState } from './windowState'
import type { ExportRequest, Preset, PreviewRequest } from '../shared/types'

const MIN_WIDTH = 1100
const MIN_HEIGHT = 720

function createWindow(): void {
  const state = loadWindowState({ width: 1360, height: 860 })

  const mainWindow = new BrowserWindow({
    ...state,
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    show: false,
    backgroundColor: '#141517',
    titleBarStyle: process.platform === 'darwin' ? 'hidden' : 'default',
    trafficLightPosition: { x: 14, y: 13 },
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  trackWindowState(mainWindow)

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function registerIpc(): void {
  ipcMain.handle('python:check', () => checkPythonEnv())

  ipcMain.handle('python:setup', async (event) => {
    return setupPythonEnv((progress) => {
      event.sender.send('python:setup-progress', progress)
    })
  })

  ipcMain.handle('preview:generate', async (_event, request: PreviewRequest) => {
    return generatePreview(request)
  })

  ipcMain.on('preview:cancel', () => {
    cancelInFlightPreview()
  })

  ipcMain.handle('export:run', async (event, request: ExportRequest) => {
    return exportFiles(request, (pct, stage) => {
      event.sender.send('export:progress', { pct, stage })
    })
  })

  ipcMain.handle('dialog:pick-outdir', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory']
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  ipcMain.handle('shell:reveal', (_event, path: string) => {
    shell.showItemInFolder(path)
  })

  ipcMain.handle('presets:load', () => loadPresets())
  ipcMain.handle('presets:save', (_event, presets: Preset[]) => savePresets(presets))

  // Renderer has no filesystem access; STL bytes are proxied through here.
  // Restricted to os.tmpdir() since that's the only place preview/export
  // write generated meshes for the viewport to read back.
  ipcMain.handle('engine:read-file', (_event, path: string) => {
    const tmpRoot = realpathSync(tmpdir())
    const resolved = realpathSync(path)
    if (!resolved.startsWith(tmpRoot)) {
      throw new Error('refused to read file outside temp directory')
    }
    return readFileSync(resolved)
  })
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.rcwheelstudio.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerIpc()
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
