import type { ArgType, LogType } from "./enums";

export type ProcessEnv = Record<string, string>;

export type RestartConfig = {
  enabled: boolean;
  max_retries?: number; // Default: 3
  delay_ms?: number; // Default: 1000
  reset_after_ms?: number; // Default: 30000
};

export type ValidationResult = {
  isValid: boolean;
  config: YamlConfig | null;
  rootDirectory?: string;
  errors: {
    message: string;
    path?: string;
  }[];
};

export type ValidationError = ValidationResult["errors"][0];

export type YamlConfig = {
  project_name: string;
  processes: {
    name: string;
    base_command: string;
    group?: string;
    cwd?: string;
    env?: ProcessEnv;
    restart?: RestartConfig;
    args?: {
      type: ArgType;
      name: string;
      default: any;
      output_prefix?: string; // Only for input args
      values?: {
        value: any;
        output: string;
      }[];
    }[];
  }[];
};

export type ProcessConfig = YamlConfig["processes"][0];
export type ArgConfig = NonNullable<ProcessConfig["args"]>[0];
export type ArgValue = NonNullable<ArgConfig["values"]>[0];

export type ProcessId = string;

export type ProcessStartResult = {
  success: boolean;
  processId?: ProcessId;
  error?: string;
};

export type ProcessStatusResult = {
  isRunning: boolean;
  error?: string;
};

export type ProcessStopResult = {
  success: boolean;
  error?: string;
};

export type ProcessLogData = {
  processId: ProcessId;
  timestamp: string;
} & (
  | {
      type: Exclude<LogType, LogType.EXIT>;
      output: string;
    }
  | {
      type: LogType.EXIT;
      code: number | null;
      signal: string | null;
    }
);

export type BulkProcessStatusResult = Record<ProcessId, boolean>;

export type ProcessRestartData = {
  processId: ProcessId;
  retryCount: number;
  maxRetries: number;
  timestamp: string;
};

export type ProcessCrashData = {
  processId: ProcessId;
  exitCode: number | null;
  signal: string | null;
  willRestart: boolean;
  timestamp: string;
};

export interface ElectronAPI {
  platform: string;
  version: string;
  installUpdate: () => Promise<void>;
  // App utils
  getResourcePath: (filename: string) => Promise<string>;
  openFileDialog: () => Promise<string | undefined>;
  validateYaml: (filePath: string) => Promise<ValidationResult>;
  validatePaths: (filePaths: string[]) => Promise<[string[], string[]]>;
  // Process management
  startProcess: (
    cwd: string,
    command: string,
    restartConfig?: RestartConfig,
    env?: ProcessEnv,
  ) => Promise<ProcessStartResult>;
  stopProcess: (processId: ProcessId) => Promise<ProcessStopResult>;
  getProcessStatus: (processId: ProcessId) => Promise<boolean>;
  getBulkProcessStatus: (
    processIds: ProcessId[],
  ) => Promise<BulkProcessStatusResult>;
  stopAllProcesses: () => Promise<{ success: boolean }>;
  // Process log streaming
  onProcessLog: (callback: (logData: ProcessLogData) => void) => void;
  removeProcessLogListener: () => void;
  // Process restart events
  onProcessRestart: (callback: (data: ProcessRestartData) => void) => void;
  removeProcessRestartListener: () => void;
  onProcessCrash: (callback: (data: ProcessCrashData) => void) => void;
  removeProcessCrashListener: () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
