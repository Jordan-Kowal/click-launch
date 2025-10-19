import {
  createEffect,
  createSignal,
  type JSX,
  onCleanup,
  useContext,
} from "solid-js";
import { createStore } from "solid-js/store";
import toast from "solid-toast";
import { useAppStorageContext } from "@/contexts";
import type { ProcessId, ValidationResult, YamlConfig } from "@/electron/types";
import { ProcessStatus } from "../enums";
import {
  DashboardContext,
  type DashboardContextType,
  type ProcessData,
} from "./DashboardContext";

const POLL_STATUS_INTERVAL_MS = 1000;

export const useDashboardContext = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error(
      "useDashboardContext must be used within a DashboardProvider",
    );
  }
  return context;
};

type DashboardProviderProps = {
  children: JSX.Element;
  selectedFile: string | null;
};

export const DashboardProvider = (props: DashboardProviderProps) => {
  const [isLoading, setIsLoading] = createSignal(true);
  const [yamlData, setYamlData] = createStore<{
    yamlConfig: YamlConfig | null;
    rootDirectory: string | null;
    errors: ValidationResult["errors"];
  }>({
    yamlConfig: null,
    rootDirectory: null,
    errors: [],
  });
  const { registerProject } = useAppStorageContext();

  // Store for all process data, keyed by process name
  const [processesData, setProcessesData] = createStore<
    Record<string, ProcessData>
  >({});
  // Map to track polling intervals for each process
  const pollIntervals = new Map<string, ReturnType<typeof setInterval>>();

  const parseFile = async () => {
    setIsLoading(true);
    const result = await window.electronAPI.validateYaml(props.selectedFile!);

    if (result?.isValid && result?.config) {
      setYamlData({
        yamlConfig: result.config,
        rootDirectory: result.rootDirectory || null,
        errors: [],
      });
      registerProject(props.selectedFile!);

      // Initialize process data for all processes
      if (result.config.processes) {
        const initialProcessesData: Record<string, ProcessData> = {};
        result.config.processes.forEach((process) => {
          initialProcessesData[process.name] = {
            argValues: {},
            status: ProcessStatus.STOPPED,
            processId: null,
            startTime: null,
            command: process.base_command,
          };
        });
        setProcessesData(initialProcessesData);
      }
    } else {
      setYamlData({
        yamlConfig: null,
        rootDirectory: null,
        errors: result?.errors || [],
      });
    }

    setIsLoading(false);
  };

  createEffect(() => {
    if (props.selectedFile) {
      parseFile();
    }
  });

  // Cleanup polling intervals on unmount
  onCleanup(() => {
    pollIntervals.forEach((interval) => {
      clearInterval(interval);
    });
    pollIntervals.clear();
  });

  // Helper to get process config
  const getProcessConfig = (processName: string) => {
    return yamlData.yamlConfig?.processes.find((p) => p.name === processName);
  };

  // Helper to compute command
  const computeCommand = (processName: string): string => {
    const processConfig = getProcessConfig(processName);
    const data = processesData[processName];
    if (!processConfig || !data) return "";

    const outputArgs = Object.values(data.argValues);
    let output = processConfig.base_command;
    if (outputArgs.length > 0) {
      output = `${output} ${outputArgs.join(" ")}`;
    }
    return output;
  };

  // Start polling for a process
  const startPolling = (processName: string, pid: ProcessId) => {
    // Clear existing interval if any
    const existingInterval = pollIntervals.get(processName);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    const interval = setInterval(async () => {
      const isRunning = await window.electronAPI.getProcessStatus(pid);
      const newStatus = isRunning
        ? ProcessStatus.RUNNING
        : ProcessStatus.STOPPED;
      setProcessesData(processName, "status", newStatus);

      if (!isRunning) {
        // Stop polling when process stops
        const intervalToStop = pollIntervals.get(processName);
        if (intervalToStop) {
          clearInterval(intervalToStop);
          pollIntervals.delete(processName);
        }
      }
    }, POLL_STATUS_INTERVAL_MS);

    pollIntervals.set(processName, interval);
  };

  // Context API methods
  const getProcessData = (processName: string): ProcessData | undefined => {
    return processesData[processName];
  };

  const getProcessCommand = (processName: string): string => {
    return processesData[processName]?.command || "";
  };

  const getProcessStatus = (processName: string): ProcessStatus => {
    return processesData[processName]?.status || ProcessStatus.STOPPED;
  };

  const getProcessStartTime = (processName: string): Date | null => {
    return processesData[processName]?.startTime || null;
  };

  const getProcessId = (processName: string): ProcessId | null => {
    return processesData[processName]?.processId || null;
  };

  const getProcessArgs = (processName: string) => {
    return getProcessConfig(processName)?.args;
  };

  const setArgValues = (
    processName: string,
    argName: string,
    value: string,
  ) => {
    setProcessesData(processName, "argValues", argName, value);
    // Recompute command when arg values change
    const newCommand = computeCommand(processName);
    setProcessesData(processName, "command", newCommand);
  };

  const startProcess = async (processName: string) => {
    const processConfig = getProcessConfig(processName);
    if (!processConfig) return;

    setProcessesData(processName, "status", ProcessStatus.STARTING);
    const command = computeCommand(processName);
    const result = await window.electronAPI.startProcess(
      yamlData.rootDirectory!,
      command,
    );

    if (result.success && result.processId) {
      setProcessesData(processName, {
        processId: result.processId,
        startTime: new Date(),
        status: ProcessStatus.RUNNING,
      });
      startPolling(processName, result.processId);
    } else {
      setProcessesData(processName, "status", ProcessStatus.STOPPED);
      toast.error(`Failed to start ${processName}`);
    }
  };

  const stopProcess = async (processName: string) => {
    const pid = processesData[processName]?.processId;
    if (!pid) return;

    setProcessesData(processName, "status", ProcessStatus.STOPPING);
    const result = await window.electronAPI.stopProcess(pid);

    if (result.success) {
      setProcessesData(processName, {
        status: ProcessStatus.STOPPED,
        startTime: null,
      });
      // Clear polling interval
      const interval = pollIntervals.get(processName);
      if (interval) {
        clearInterval(interval);
        pollIntervals.delete(processName);
      }
    } else {
      setProcessesData(processName, "status", ProcessStatus.RUNNING);
      toast.error(`Failed to stop ${processName}`);
    }
  };

  const value: DashboardContextType = {
    isLoading,
    yamlConfig: () => yamlData.yamlConfig,
    rootDirectory: () => yamlData.rootDirectory,
    errors: () => yamlData.errors,
    parseFile,
    getProcessData,
    getProcessCommand,
    getProcessStatus,
    getProcessStartTime,
    getProcessId,
    getProcessArgs,
    setArgValues,
    startProcess,
    stopProcess,
  };

  return (
    <DashboardContext.Provider value={value}>
      {props.children}
    </DashboardContext.Provider>
  );
};
