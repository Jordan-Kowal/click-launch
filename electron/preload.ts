const { contextBridge, ipcRenderer } = require("electron");

import type {
  ProcessCrashData,
  ProcessEnv,
  ProcessLogData,
  ProcessRestartData,
  RestartConfig,
} from "@/electron/types";
import type { ValidationResult } from "./utils/extractYamlConfig";

contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
  version: process.versions.electron,
  getResourcePath: (filename: string): Promise<string> =>
    ipcRenderer.invoke("app:getResourcePath", filename),
  openFileDialog: (): Promise<string | undefined> =>
    ipcRenderer.invoke("dialog:openFile"),
  openFolderDialog: (): Promise<string | undefined> =>
    ipcRenderer.invoke("dialog:openFolder"),
  validateYaml: (filePath: string): Promise<ValidationResult> =>
    ipcRenderer.invoke("yaml:validate", filePath),
  validatePaths: (filePaths: string[]): Promise<[string[], string[]]> =>
    ipcRenderer.invoke("paths:validate", filePaths),
  // Process management
  startProcess: (
    cwd: string,
    command: string,
    restartConfig?: RestartConfig,
    env?: ProcessEnv,
  ) => ipcRenderer.invoke("process:start", cwd, command, restartConfig, env),
  stopProcess: (processId: string) =>
    ipcRenderer.invoke("process:stop", processId),
  getProcessStatus: (processId: string) =>
    ipcRenderer.invoke("process:status", processId),
  getBulkProcessStatus: (processIds: string[]) =>
    ipcRenderer.invoke("process:bulk-status", processIds),
  stopAllProcesses: () => ipcRenderer.invoke("process:stop-all"),
  getProcessResources: (processIds: string[]) =>
    ipcRenderer.invoke("process:resources", processIds),
  // Process log streaming
  onProcessLog: (callback: (logData: ProcessLogData) => void) => {
    ipcRenderer.on("process-log", (_event: unknown, logData: ProcessLogData) =>
      callback(logData),
    );
  },
  removeProcessLogListener: () => {
    ipcRenderer.removeAllListeners("process-log");
  },
  // Process restart events
  onProcessRestart: (callback: (data: ProcessRestartData) => void) => {
    ipcRenderer.on(
      "process-restart",
      (_event: unknown, data: ProcessRestartData) => callback(data),
    );
  },
  removeProcessRestartListener: () => {
    ipcRenderer.removeAllListeners("process-restart");
  },
  onProcessCrash: (callback: (data: ProcessCrashData) => void) => {
    ipcRenderer.on("process-crash", (_event: unknown, data: ProcessCrashData) =>
      callback(data),
    );
  },
  removeProcessCrashListener: () => {
    ipcRenderer.removeAllListeners("process-crash");
  },
  // File operations
  writeFile: (dirPath: string, fileName: string, content: string) =>
    ipcRenderer.invoke("file:write", dirPath, fileName, content),
  // Update management
  installUpdate: () => ipcRenderer.invoke("app:installUpdate"),
});
