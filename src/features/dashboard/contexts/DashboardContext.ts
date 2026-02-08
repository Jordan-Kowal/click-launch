import { createContext } from "solid-js";
import type {
  ArgConfig,
  ProcessConfig,
  ProcessId,
  ProcessResourceData,
  ValidationResult,
  YamlConfig,
} from "@/electron/types";
import type { ProcessStatus } from "../enums";

export type ProcessData = {
  argValues: Record<string, string>;
  status: ProcessStatus;
  processId: ProcessId | null;
  startTime: Date | null;
  command: string;
  retryCount: number;
  maxRetries: number;
};

export type GroupedProcesses = {
  name: string;
  processes: ProcessConfig[];
};

export type DashboardContextType = {
  isLoading: () => boolean;
  yamlConfig: () => YamlConfig | null;
  rootDirectory: () => string | null;
  errors: () => ValidationResult["errors"];
  parseFile: () => Promise<void>;
  hasRunningProcesses: () => boolean;
  // Group-related
  getGroupedProcesses: () => GroupedProcesses[];
  hasGroups: () => boolean;
  isGroupCollapsed: (groupName: string) => boolean;
  toggleGroupCollapsed: (groupName: string) => void;
  getGroupRunningCount: (groupName: string) => number;
  startGroup: (groupName: string) => Promise<void>;
  stopGroup: (groupName: string) => Promise<void>;
  // Process-specific data and actions
  getProcessData: (processName: string) => ProcessData | undefined;
  getProcessCommand: (processName: string) => string;
  getProcessStatus: (processName: string) => ProcessStatus;
  getProcessStartTime: (processName: string) => Date | null;
  getProcessId: (processName: string) => ProcessId | null;
  getProcessArgs: (processName: string) => ArgConfig[] | undefined;
  setArgValues: (processName: string, argName: string, value: string) => void;
  getProcessResources: (processName: string) => ProcessResourceData | undefined;
  startProcess: (processName: string) => Promise<void>;
  stopProcess: (processName: string) => Promise<void>;
};

export const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined,
);
