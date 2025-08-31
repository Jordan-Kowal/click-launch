import type { ArgType } from "./enums";

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

export interface ElectronAPI {
  platform: string;
  version: string;
  openFileDialog: () => Promise<string | undefined>;
  validateYaml: (filePath: string) => Promise<ValidationResult>;
  validatePaths: (filePaths: string[]) => Promise<[string[], string[]]>;
  // Process management
  startProcess: (command: string, cwd?: string) => Promise<ProcessStartResult>;
  stopProcess: (processId: ProcessId) => Promise<ProcessStopResult>;
  getProcessStatus: (processId: ProcessId) => Promise<ProcessStatusResult>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
