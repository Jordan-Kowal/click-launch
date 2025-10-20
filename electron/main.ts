import { exec } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { app, BrowserWindow, dialog, ipcMain } from "electron";
import fixPath from "fix-path";

// ES module equivalent of __dirname
// @ts-expect-error
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

fixPath();

let isQuitting = false;

import { isDev } from "./utils/constants";
import {
  extractYamlConfig,
  type ValidationResult,
} from "./utils/extractYamlConfig";
import {
  getBulkProcessStatus,
  isProcessRunning,
  startProcess,
  stopAllProcesses,
  stopProcess,
} from "./utils/processManager";
import { validatePaths } from "./utils/validatePaths";

const createWindow = (): void => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    // Don't show immediately
    show: false,
    // Move traffic lights to the top left within our own nav bar
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 8, y: 6 },
  });

  // On macOS, hide window instead of closing to preserve state
  mainWindow.on("close", (event) => {
    if (process.platform === "darwin" && !isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  // Show window when ready to prevent flash
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // Handle SPA routing failures - reload index.html when navigation fails
  mainWindow.webContents.on("did-fail-load", () => {
    stopAllProcesses();
    if (isDev) {
      mainWindow.loadURL("http://localhost:5173");
    } else {
      mainWindow.loadFile(join(__dirname, "../dist/index.html"));
    }
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, "../dist/index.html"));
  }
};

app.whenReady().then(() => {
  createWindow();

  // IPC handler for file dialog
  ipcMain.handle("dialog:openFile", async (): Promise<string | undefined> => {
    const result = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [
        { name: "YAML files", extensions: ["yml", "yaml"] },
        { name: "All files", extensions: ["*"] },
      ],
    });
    return result.filePaths[0];
  });

  // IPC handler for YAML validation
  ipcMain.handle(
    "yaml:validate",
    async (
      _,
      filePath: string,
    ): Promise<ValidationResult & { rootDirectory: string }> => {
      const rootDirectory = dirname(filePath);
      try {
        const fileContent = readFileSync(filePath, "utf-8");
        const result = extractYamlConfig(fileContent);
        return {
          ...result,
          rootDirectory,
        };
      } catch (error) {
        return {
          isValid: false,
          config: null,
          rootDirectory,
          errors: [
            {
              message: `Failed to read file: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
        };
      }
    },
  );

  // IPC handler for path validation
  ipcMain.handle(
    "paths:validate",
    async (_, filePaths: string[]): Promise<[string[], string[]]> => {
      return validatePaths(filePaths);
    },
  );

  // IPC handler for starting a process
  ipcMain.handle("process:start", async (_, cwd: string, command: string) => {
    return startProcess(cwd, command);
  });

  // IPC handler for stopping a process
  ipcMain.handle("process:stop", async (_, processId: string) => {
    return stopProcess(processId);
  });

  // IPC handler for getting process status
  ipcMain.handle("process:status", async (_, processId: string) => {
    return isProcessRunning(processId);
  });

  // IPC handler for getting bulk process status
  ipcMain.handle("process:bulk-status", async (_, processIds: string[]) => {
    return getBulkProcessStatus(processIds);
  });

  // IPC handler for stopping all processes
  ipcMain.handle("process:stop-all", async () => {
    stopAllProcesses();
    return { success: true };
  });

  // IPC handler for getting resource paths
  ipcMain.handle("app:getResourcePath", async (_, filename: string) => {
    if (app.isPackaged) {
      // Production: return file:// URL for bundled resources
      return `file://${join(process.resourcesPath, filename)}`;
    }
    // Development: return regular path for dev server
    return `/${filename}`;
  });

  // IPC handler for installing update
  ipcMain.handle("app:installUpdate", async () => {
    const updateCommand = `(
      sleep 2
      curl -fsSL https://raw.githubusercontent.com/Jordan-Kowal/click-launch/main/setup.sh | bash >> /dev/null 2>&1
      open /Applications/ClickLaunch.app
    ) &`;

    exec(updateCommand, (error) => {
      if (error) {
        console.error("Failed to start update process:", error);
      }
    });

    // Quit the app immediately after spawning the update process
    isQuitting = true;
    stopAllProcesses();
    app.quit();
  });

  app.on("activate", () => {
    const windows = BrowserWindow.getAllWindows();
    if (windows.length === 0) {
      createWindow();
    } else {
      // Show the existing window if it's hidden
      windows[0].show();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    stopAllProcesses();
    app.quit();
  }
});

app.on("before-quit", () => {
  isQuitting = true;
  stopAllProcesses();
});
