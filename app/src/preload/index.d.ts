import { ElectronAPI } from '@electron-toolkit/preload'
import type { WheelApi } from './index'

declare global {
  interface Window {
    electron: ElectronAPI
    api: WheelApi
  }
}
