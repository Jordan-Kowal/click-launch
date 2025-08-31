import {
  createContext,
  memo,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ArgConfig, ProcessConfig } from "@/electron/types";
import { ProcessStatus } from "../enums";

type ProcessContextType = {
  // Raw
  name: string;
  args: ArgConfig[] | undefined;
  // Computed
  command: string;
  status: ProcessStatus;
  // Actions
  updateCommand: (argName: string, value: string) => void;
  startProcess: () => void;
  stopProcess: () => void;
};

const ProcessContext = createContext<ProcessContextType | undefined>(undefined);

export const useProcessContext = () => {
  const context = useContext(ProcessContext);
  if (!context) {
    throw new Error("useProcess must be used within a ProcessProvider");
  }
  return context;
};

type ProcessProviderProps = {
  children: ReactNode;
  process: ProcessConfig;
};

export const ProcessProvider = memo(
  ({ children, process }: ProcessProviderProps) => {
    const [argValues, setArgValues] = useState<Record<string, string>>({});
    const [status, setStatus] = useState(ProcessStatus.STOPPED);

    const command = useMemo(() => {
      const outputArgs = Object.values(argValues);
      let output = process.base_command;
      if (outputArgs.length > 0) {
        output = `${output} ${outputArgs.join(" ")}`;
      }
      return output;
    }, [process.base_command, argValues]);

    const updateCommand = useCallback((argName: string, value: string) => {
      setArgValues((prev) => ({ ...prev, [argName]: value }));
    }, []);

    const startProcess = useCallback(() => {
      setStatus(ProcessStatus.STARTING);
      setTimeout(() => {
        setStatus(ProcessStatus.RUNNING);
      }, 1000);
    }, []);

    const stopProcess = useCallback(() => {
      setStatus(ProcessStatus.STOPPING);
      setTimeout(() => {
        setStatus(ProcessStatus.STOPPED);
      }, 1000);
    }, []);

    const context: ProcessContextType = useMemo(
      () => ({
        name: process.name,
        args: process.args,
        command,
        status,
        updateCommand,
        startProcess,
        stopProcess,
      }),
      [
        process.name,
        command,
        process.args,
        updateCommand,
        startProcess,
        stopProcess,
        status,
      ],
    );

    return (
      <ProcessContext.Provider value={context}>
        {children}
      </ProcessContext.Provider>
    );
  },
);
