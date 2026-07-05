import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type {
  ExportProgress,
  ExportRequest,
  ExportResponse,
  Preset,
  PreviewRequest,
  PreviewResponse,
  PythonEnvStatus,
  SetupProgress
} from '../shared/types'

const api = {
  python: {
    check: (): Promise<PythonEnvStatus> => ipcRenderer.invoke('python:check'),
    setup: (onProgress: (p: SetupProgress) => void): Promise<PythonEnvStatus> => {
      const listener = (_e: Electron.IpcRendererEvent, p: SetupProgress): void => onProgress(p)
      ipcRenderer.on('python:setup-progress', listener)
      return ipcRenderer.invoke('python:setup').finally(() => {
        ipcRenderer.removeListener('python:setup-progress', listener)
      })
    }
  },
  preview: {
    generate: (request: PreviewRequest): Promise<PreviewResponse> =>
      ipcRenderer.invoke('preview:generate', request),
    cancel: (): void => ipcRenderer.send('preview:cancel')
  },
  export: {
    run: (
      request: ExportRequest,
      onProgress: (p: ExportProgress) => void
    ): Promise<ExportResponse> => {
      const listener = (_e: Electron.IpcRendererEvent, p: ExportProgress): void => onProgress(p)
      ipcRenderer.on('export:progress', listener)
      return ipcRenderer.invoke('export:run', request).finally(() => {
        ipcRenderer.removeListener('export:progress', listener)
      })
    }
  },
  dialog: {
    pickOutputDir: (): Promise<string | null> => ipcRenderer.invoke('dialog:pick-outdir')
  },
  shell: {
    reveal: (path: string): Promise<void> => ipcRenderer.invoke('shell:reveal', path)
  },
  presets: {
    load: (): Promise<Preset[]> => ipcRenderer.invoke('presets:load'),
    save: (presets: Preset[]): Promise<void> => ipcRenderer.invoke('presets:save', presets)
  },
  engine: {
    readFile: (path: string): Promise<ArrayBuffer> =>
      ipcRenderer.invoke('engine:read-file', path).then((buf: Buffer) => {
        return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength).slice().buffer
      })
  }
}

export type WheelApi = typeof api

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
