import { contextBridge, ipcRenderer, webUtils } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  scanFolder: (path: string): Promise<string[]> => ipcRenderer.invoke('scan-folder', path),
  convertFile: (path: string): Promise<Uint8Array> => ipcRenderer.invoke('convert-to-pdf', path),
  readFile: (path: string): Promise<Uint8Array> => ipcRenderer.invoke('read-file', path),
  getFilePath: (file: File): string => {
    try {
      const path = webUtils.getPathForFile(file);
      console.log(`[Preload] getPathForFile(${file.name}) -> ${path}`);
      return path;
    } catch (e) {
      console.error(`[Preload] Error getting path for ${file.name}:`, e);
      throw e;
    }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
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
