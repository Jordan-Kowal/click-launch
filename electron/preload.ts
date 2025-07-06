import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
  version: process.versions.electron,
  openFileDialog: () => ipcRenderer.invoke("dialog:openFile"),
});
