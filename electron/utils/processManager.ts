import { type ChildProcess, spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { KillSignal } from "./enums";

const PROCESS_KILL_TIMEOUT_MS = 10_000;

// Process management state
const runningProcesses = new Map<string, ChildProcess>();

export type ProcessStartResult = {
  success: boolean;
  processId?: string;
  error?: string;
};

export type ProcessStopResult = {
  success: boolean;
  error?: string;
};

export const startProcess = async (
  cwd: string,
  command: string,
): Promise<ProcessStartResult> => {
  try {
    const processId = randomUUID();

    const childProcess = spawn(command, {
      cwd: cwd || process.cwd(),
      stdio: "ignore",
      // stdio: ["ignore", "pipe", "pipe"],
      detached: false,
      shell: true, // This allows the command to be executed as-is by the shell
    });

    runningProcesses.set(processId, childProcess);

    // Handle process exit
    childProcess.on("exit", (_code, _signal) => {
      runningProcesses.delete(processId);
    });
    childProcess.on("error", (_error) => {
      runningProcesses.delete(processId);
    });

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
    const childProcess = runningProcesses.get(processId);
    if (!childProcess) {
      return { success: true };
    }

    childProcess.kill(KillSignal.SIGTERM);

    // Give process time to gracefully shut down, then force kill
    setTimeout(() => {
      if (runningProcesses.has(processId)) {
        childProcess.kill(KillSignal.SIGKILL);
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
  runningProcesses.forEach((_childProcess, processId) => {
    stopProcess(processId);
  });
};

export const isProcessRunning = async (processId: string): Promise<boolean> => {
  try {
    const childProcess = runningProcesses.get(processId);
    if (!childProcess) return false;
    return !childProcess.killed && childProcess.exitCode === null;
  } catch (_e) {
    console.error("Error checking process status:", _e);
    return false;
  }
};
