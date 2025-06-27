import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // Add your exposed APIs here
  platform: process.platform,
  version: process.versions.electron,
})
