import {
  createContext,
  memo,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "react-toastify";
import type { ArgConfig, ProcessConfig, ProcessId } from "@/electron/types";
import { ProcessStatus } from "../enums";

const POLL_STATUS_INTERVAL_MS = 1_000;

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
  rootDirectory: string;
};

export const ProcessProvider = memo(
  ({ children, process, rootDirectory }: ProcessProviderProps) => {
    const [argValues, setArgValues] = useState<Record<string, string>>({});
    const [status, setStatus] = useState(ProcessStatus.STOPPED);
    const [processId, setProcessId] = useState<ProcessId | null>(null);

    const pollStatusIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

    const startProcess = useCallback(async () => {
      setStatus(ProcessStatus.STARTING);
      const result = await window.electronAPI.startProcess(
        rootDirectory,
        command,
      );
      if (result.success && result.processId) {
        setProcessId(result.processId);
        setStatus(ProcessStatus.RUNNING);
      } else {
        setStatus(ProcessStatus.CRASHED);
        toast.error(result.error || "Failed to start process");
      }
    }, [command, rootDirectory]);

    const stopProcess = useCallback(async () => {
      if (!processId) return;
      setStatus(ProcessStatus.STOPPING);
      const result = await window.electronAPI.stopProcess(processId);
      if (result.success) {
        setStatus(ProcessStatus.STOPPED);
      } else {
        setStatus(ProcessStatus.RUNNING);
        toast.error(result.error || "Failed to stop process");
      }
    }, [processId]);

    /** Fetch status every 1000ms */
    useEffect(() => {
      if (processId) {
        pollStatusIntervalRef.current = setInterval(() => {
          window.electronAPI.getProcessStatus(processId).then((result) => {
            const status = result.isRunning
              ? ProcessStatus.RUNNING
              : ProcessStatus.STOPPED;
            setStatus(status);
          });
        }, POLL_STATUS_INTERVAL_MS);
      }
      return () => {
        if (pollStatusIntervalRef.current) {
          clearInterval(pollStatusIntervalRef.current);
        }
      };
    }, [processId]);

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
