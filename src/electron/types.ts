import type { ArgType, LogType } from "./enums";

export type WailsEvent<T> = { data: T };

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

export type ProcessResourceData = {
  cpu: number;
  memoryBytes: number;
};

export type BulkProcessResourcesResult = Record<ProcessId, ProcessResourceData>;

export type ResourceHistoryEntry = {
  timestamp: number;
  cpu: number;
  memoryBytes: number;
};

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
