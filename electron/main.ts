import { readFileSync } from "node:fs";
import { join } from "node:path";
import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { isDev } from "./utils/constants";
import { extractYamlConfig } from "./utils/yamlValidation";

const createWindow = (): void => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    // Don't show immediately
    show: false,
    // Move traffic lights to the top left within our own nav bar
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 20, y: 24 },
  });

  // Show window when ready to prevent flash
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
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
  ipcMain.handle("dialog:openFile", async () => {
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
  ipcMain.handle("yaml:validate", async (_, filePath: string) => {
    try {
      const fileContent = readFileSync(filePath, "utf-8");
      return extractYamlConfig(fileContent);
    } catch (error) {
      return {
        isValid: false,
        config: null,
        errors: [
          {
            message: `Failed to read file: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
      };
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
