import { contextBridge, ipcRenderer } from "electron";
import type { ValidationResult } from "./utils/extractYamlConfig";

contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
  version: process.versions.electron,
  openFileDialog: (): Promise<string | undefined> =>
    ipcRenderer.invoke("dialog:openFile"),
  validateYaml: (filePath: string): Promise<ValidationResult> =>
    ipcRenderer.invoke("yaml:validate", filePath),
  validatePaths: (filePaths: string[]): Promise<[string[], string[]]> =>
    ipcRenderer.invoke("paths:validate", filePaths),
  // Process management
  startProcess: (cwd: string, command: string) =>
    ipcRenderer.invoke("process:start", cwd, command),
  stopProcess: (processId: string) =>
    ipcRenderer.invoke("process:stop", processId),
  getProcessStatus: (processId: string) =>
    ipcRenderer.invoke("process:status", processId),
  stopAllProcesses: () => ipcRenderer.invoke("process:stop-all"),
  // Process log streaming
  onProcessLog: (callback: (logData: any) => void) => {
    ipcRenderer.on("process-log", (_, logData) => callback(logData));
  },
  removeProcessLogListener: () => {
    ipcRenderer.removeAllListeners("process-log");
  },
});
