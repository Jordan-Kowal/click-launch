import { createContext } from "solid-js";
import type { ArgConfig, ProcessId } from "@/electron/types";
import type { ProcessStatus } from "../enums";

export type ProcessContextType = {
  // Raw
  name: string;
  args: ArgConfig[] | undefined;
  processId: () => ProcessId | null;
  // Computed
  command: () => string;
  status: () => ProcessStatus;
  startTime: () => Date | null;
  // Actions
  setArgValues: (argName: string, value: string) => void;
  startProcess: () => void;
  stopProcess: () => void;
};

export const ProcessContext = createContext<ProcessContextType | undefined>(
  undefined,
);
