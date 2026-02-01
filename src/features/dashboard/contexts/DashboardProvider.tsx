import {
  createEffect,
  createMemo,
  createSignal,
  type JSX,
  onCleanup,
  useContext,
} from "solid-js";
import { createStore } from "solid-js/store";
import toast from "solid-toast";
import { useAppStorageContext } from "@/contexts";
import type {
  ProcessCrashData,
  ProcessId,
  ProcessRestartData,
  ValidationResult,
  YamlConfig,
} from "@/electron/types";
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
  // Single polling interval for all processes
  let pollInterval: ReturnType<typeof setInterval> | null = null;

  const hasRunningProcesses = createMemo(() => {
    return (
      Object.values(processesData).filter(
        (p) =>
          p.status === ProcessStatus.RUNNING ||
          p.status === ProcessStatus.RESTARTING,
      ).length > 0
    );
  });

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
            retryCount: 0,
            maxRetries: process.restart?.max_retries ?? 3,
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

  // Cleanup polling interval on unmount
  onCleanup(() => {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  });

  // Helper to find process name by processId
  const findProcessNameById = (processId: ProcessId): string | undefined => {
    return Object.entries(processesData).find(
      ([_, data]) => data.processId === processId,
    )?.[0];
  };

  // Handle process crash events
  const handleProcessCrash = (data: ProcessCrashData) => {
    const processName = findProcessNameById(data.processId);
    if (!processName) return;

    if (data.willRestart) {
      // Process will be restarted - set to RESTARTING
      setProcessesData(processName, "status", ProcessStatus.RESTARTING);
      toast.error(`${processName} crashed, restarting...`);
    } else {
      // Process crashed and won't restart - set to CRASHED
      setProcessesData(processName, {
        status: ProcessStatus.CRASHED,
        startTime: null,
      });
      toast.error(`${processName} crashed`);
    }
  };

  // Handle process restart events
  const handleProcessRestart = (data: ProcessRestartData) => {
    const processName = findProcessNameById(data.processId);
    if (!processName) return;

    // Update retry count and set back to RUNNING
    setProcessesData(processName, {
      status: ProcessStatus.RUNNING,
      startTime: new Date(),
      retryCount: data.retryCount,
      maxRetries: data.maxRetries,
    });
  };

  // Set up crash and restart event listeners
  createEffect(() => {
    window.electronAPI.onProcessCrash(handleProcessCrash);
    window.electronAPI.onProcessRestart(handleProcessRestart);

    onCleanup(() => {
      window.electronAPI.removeProcessCrashListener();
      window.electronAPI.removeProcessRestartListener();
    });
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
    outputArgs.forEach((arg) => {
      if (arg === "") return;
      output = `${output} ${arg}`;
    });
    return output;
  };

  // Start or restart polling for all processes
  const startPolling = () => {
    // Clear existing interval if any
    if (pollInterval) {
      clearInterval(pollInterval);
    }

    pollInterval = setInterval(async () => {
      // Collect all active process IDs (including RESTARTING which keeps the same processId)
      const activeProcesses: Array<{ name: string; pid: ProcessId }> = [];
      Object.entries(processesData).forEach(([name, data]) => {
        if (
          data.processId &&
          data.status !== ProcessStatus.STOPPED &&
          data.status !== ProcessStatus.CRASHED
        ) {
          activeProcesses.push({ name, pid: data.processId });
        }
      });

      if (activeProcesses.length === 0) {
        // No active processes, stop polling
        if (pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
        return;
      }

      // Query all statuses at once
      const processIds = activeProcesses.map((p) => p.pid);
      const statusMap =
        await window.electronAPI.getBulkProcessStatus(processIds);

      // Update all process statuses (but don't override RESTARTING status)
      activeProcesses.forEach(({ name, pid }) => {
        const currentStatus = processesData[name]?.status;
        // Don't update status if it's RESTARTING (managed by restart events)
        if (currentStatus === ProcessStatus.RESTARTING) return;

        const isRunning = statusMap[pid];
        if (isRunning) {
          setProcessesData(name, "status", ProcessStatus.RUNNING);
        } else if (currentStatus === ProcessStatus.RUNNING) {
          // Process was running but is no longer active (clean exit with code 0)
          setProcessesData(name, {
            status: ProcessStatus.STOPPED,
            startTime: null,
          });
        }
      });
    }, POLL_STATUS_INTERVAL_MS);
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

  // Resolve cwd: if process has custom cwd, resolve it relative to rootDirectory
  const resolveProcessCwd = (
    processConfig: NonNullable<ReturnType<typeof getProcessConfig>>,
  ): string => {
    const rootDir = yamlData.rootDirectory!;
    if (!processConfig.cwd) return rootDir;
    // Check if cwd is absolute (starts with /)
    if (processConfig.cwd.startsWith("/")) return processConfig.cwd;
    // Resolve relative path against rootDirectory
    // Note: We can't use path.resolve in browser, so we do simple concatenation
    // The main process will handle the actual path resolution
    const relativeCwd = processConfig.cwd.startsWith("./")
      ? processConfig.cwd.slice(2)
      : processConfig.cwd;
    return `${rootDir}/${relativeCwd}`;
  };

  const startProcess = async (processName: string) => {
    const processConfig = getProcessConfig(processName);
    if (!processConfig) return;

    setProcessesData(processName, "status", ProcessStatus.STARTING);
    const command = computeCommand(processName);
    // Spread restart config to create a plain object (SolidJS store proxies can't be cloned for IPC)
    const restartConfig = processConfig.restart
      ? { ...processConfig.restart }
      : undefined;
    const cwd = resolveProcessCwd(processConfig);
    // Spread env to create a plain object for IPC
    const env = processConfig.env ? { ...processConfig.env } : undefined;
    const result = await window.electronAPI.startProcess(
      cwd,
      command,
      restartConfig,
      env,
    );

    if (result.success && result.processId) {
      setProcessesData(processName, {
        processId: result.processId,
        startTime: new Date(),
        status: ProcessStatus.RUNNING,
        retryCount: 0,
        maxRetries: processConfig.restart?.max_retries ?? 3,
      });
      startPolling();
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
    hasRunningProcesses,
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
