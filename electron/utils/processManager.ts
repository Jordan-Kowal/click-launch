import { type ChildProcess, spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { BrowserWindow } from "electron";
import type { RestartConfig } from "@/electron/types";
import { KillSignal, LogType } from "./enums";

const PROCESS_KILL_TIMEOUT_MS = 10_000;
// Update README.md if these values change
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_DELAY_MS = 1000;
const DEFAULT_RESET_AFTER_MS = 30000;

type ProcessState = {
  childProcess: ChildProcess;
  cwd: string;
  command: string;
  restartConfig?: RestartConfig;
  retryCount: number;
  lastStartTime: number;
  manualStop: boolean;
  restartTimer?: ReturnType<typeof setTimeout>;
};

// Process management state
const runningProcesses = new Map<string, ProcessState>();

export type ProcessStartResult = {
  success: boolean;
  processId?: string;
  error?: string;
};

export type ProcessStopResult = {
  success: boolean;
  error?: string;
};

const sendToAllWindows = (channel: string, data: unknown) => {
  BrowserWindow.getAllWindows().forEach((window) => {
    window.webContents.send(channel, data);
  });
};

const spawnProcess = (
  processId: string,
  cwd: string,
  command: string,
  restartConfig?: RestartConfig,
  retryCount = 0,
): ChildProcess => {
  const childProcess = spawn(command, {
    cwd: cwd || process.cwd(),
    stdio: ["ignore", "pipe", "pipe"], // Need pipes to capture output
    detached: true, // Create new process group
    shell: true, // This allows the command to be executed as-is by the shell
    env: {
      ...process.env,
      // Force colored output
      FORCE_COLOR: "1",
      TERM: "xterm-256color",
      COLORTERM: "truecolor",
    },
  });

  // Store process state
  runningProcesses.set(processId, {
    childProcess,
    cwd,
    command,
    restartConfig,
    retryCount,
    lastStartTime: Date.now(),
    manualStop: false,
  });

  // Stream stdout to renderer
  childProcess.stdout?.on("data", (data) => {
    sendToAllWindows("process-log", {
      processId,
      type: LogType.STDOUT,
      output: data.toString(),
      timestamp: new Date().toISOString(),
    });
  });

  // Stream stderr to renderer
  childProcess.stderr?.on("data", (data) => {
    sendToAllWindows("process-log", {
      processId,
      type: LogType.STDERR,
      output: data.toString(),
      timestamp: new Date().toISOString(),
    });
  });

  // Handle process exit
  childProcess.on("exit", (code, signal) => {
    handleProcessExit(processId, code, signal);
  });

  // Handle process error
  childProcess.on("error", (error) => {
    const state = runningProcesses.get(processId);
    if (state) {
      runningProcesses.delete(processId);
    }
    sendToAllWindows("process-log", {
      processId,
      type: LogType.ERROR,
      output: error.message,
      timestamp: new Date().toISOString(),
    });
  });

  return childProcess;
};

const handleProcessExit = (
  processId: string,
  code: number | null,
  signal: string | null,
) => {
  const state = runningProcesses.get(processId);
  if (!state) return;

  const { restartConfig, manualStop, lastStartTime, retryCount, cwd, command } =
    state;

  // Clean up
  runningProcesses.delete(processId);

  // Send exit log
  sendToAllWindows("process-log", {
    processId,
    type: LogType.EXIT,
    code,
    signal,
    timestamp: new Date().toISOString(),
  });

  // Don't restart if:
  // 1. Manual stop was requested
  // 2. Clean exit (code === 0)
  // 3. Restart is not enabled
  if (manualStop || code === 0 || !restartConfig?.enabled) {
    // Notify about crash if it was a non-zero exit (not manual stop and not clean exit)
    if (!manualStop && code !== 0) {
      sendToAllWindows("process-crash", {
        processId,
        exitCode: code,
        signal,
        willRestart: false,
        timestamp: new Date().toISOString(),
      });
    }
    return;
  }

  // Calculate effective config values
  const maxRetries = restartConfig.max_retries ?? DEFAULT_MAX_RETRIES;
  const delayMs = restartConfig.delay_ms ?? DEFAULT_DELAY_MS;
  const resetAfterMs = restartConfig.reset_after_ms ?? DEFAULT_RESET_AFTER_MS;

  // Check if we should reset the retry counter (process ran long enough)
  const runDuration = Date.now() - lastStartTime;
  const effectiveRetryCount = runDuration >= resetAfterMs ? 0 : retryCount;

  // Check if we've exceeded max retries
  if (effectiveRetryCount >= maxRetries) {
    sendToAllWindows("process-crash", {
      processId,
      exitCode: code,
      signal,
      willRestart: false,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Notify about crash with restart pending
  sendToAllWindows("process-crash", {
    processId,
    exitCode: code,
    signal,
    willRestart: true,
    timestamp: new Date().toISOString(),
  });

  // Schedule restart
  const restartTimer = setTimeout(() => {
    const newRetryCount = effectiveRetryCount + 1;

    // Notify about restart attempt
    sendToAllWindows("process-restart", {
      processId,
      retryCount: newRetryCount,
      maxRetries,
      timestamp: new Date().toISOString(),
    });

    // Spawn new process with same ID
    spawnProcess(processId, cwd, command, restartConfig, newRetryCount);
  }, delayMs);

  // Store the timer reference in case we need to cancel it
  // We create a temporary entry just for the timer
  runningProcesses.set(processId, {
    ...state,
    restartTimer,
    manualStop: false,
  } as ProcessState);
};

export const startProcess = async (
  cwd: string,
  command: string,
  restartConfig?: RestartConfig,
): Promise<ProcessStartResult> => {
  try {
    // Verify working directory exists
    const { existsSync } = await import("node:fs");
    if (!existsSync(cwd)) {
      return {
        success: false,
        error: `Working directory not found: ${cwd}`,
      };
    }

    const processId = randomUUID();
    spawnProcess(processId, cwd, command, restartConfig, 0);
    return { success: true, processId };
  } catch (error) {
    console.error("Error starting process:", error);
    return {
      success: false,
      error: error instanceof Error ? error?.message : "Unknown error",
    };
  }
};

export const stopProcess = async (
  processId: string,
): Promise<ProcessStopResult> => {
  try {
    const state = runningProcesses.get(processId);
    if (!state) {
      return { success: true };
    }

    // Mark as manual stop to prevent auto-restart
    state.manualStop = true;

    // Cancel any pending restart timer
    if (state.restartTimer) {
      clearTimeout(state.restartTimer);
      state.restartTimer = undefined;
    }

    const { childProcess } = state;

    // Kill the entire process group (negative PID)
    if (childProcess.pid) {
      process.kill(-childProcess.pid, KillSignal.SIGTERM);
    }

    // Give process time to gracefully shut down, then force kill
    setTimeout(() => {
      const currentState = runningProcesses.get(processId);
      if (currentState && childProcess.pid) {
        try {
          process.kill(-childProcess.pid, KillSignal.SIGKILL);
        } catch (_e) {
          // Process group might already be dead
        }
      }
    }, PROCESS_KILL_TIMEOUT_MS);

    return { success: true };
  } catch (error) {
    console.error("Error stopping process:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export const stopAllProcesses = (): void => {
  runningProcesses.forEach((_state, processId) => {
    stopProcess(processId);
  });
};

export const isProcessRunning = async (processId: string): Promise<boolean> => {
  try {
    const state = runningProcesses.get(processId);
    if (!state) return false;
    const { childProcess } = state;
    return !childProcess.killed && childProcess.exitCode === null;
  } catch (_e) {
    console.error("Error checking process status:", _e);
    return false;
  }
};

export const getBulkProcessStatus = async (
  processIds: string[],
): Promise<Record<string, boolean>> => {
  const statusMap: Record<string, boolean> = {};
  for (const processId of processIds) {
    statusMap[processId] = await isProcessRunning(processId);
  }
  return statusMap;
};
