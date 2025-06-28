import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  // Add your exposed APIs here
  platform: process.platform,
  version: process.versions.electron,
});
