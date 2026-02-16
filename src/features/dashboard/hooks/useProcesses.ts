import { createEffect, createMemo, on, onCleanup } from "solid-js";
import { createStore } from "solid-js/store";
import type {
  ProcessCrashData,
  ProcessId,
  ProcessRestartData,
  YamlConfig,
} from "@/electron/types";
import { useToast } from "@/hooks";
import type { ProcessData } from "../contexts/DashboardContext";
import { isProcessActive, ProcessStatus } from "../enums";

const POLL_STATUS_INTERVAL_MS = 1000;

type UseProcessesParams = {
  yamlConfig: () => YamlConfig | null;
  rootDirectory: () => string | null;
  onProcessStarted?: () => void;
};

export const useProcesses = ({
  yamlConfig,
  rootDirectory,
  onProcessStarted,
}: UseProcessesParams) => {
  const toast = useToast();

  const [processesData, setProcessesData] = createStore<
    Record<string, ProcessData>
  >({});

  let pollInterval: ReturnType<typeof setInterval> | null = null;

  const hasRunningProcesses = createMemo(() => {
    return Object.values(processesData).some((p) => isProcessActive(p.status));
  });

  // Initialize process data when config changes
  createEffect(
    on(yamlConfig, (config) => {
      if (!config?.processes) return;
      const initialProcessesData: Record<string, ProcessData> = {};
      config.processes.forEach((process) => {
        initialProcessesData[process.name] = {
          argValues: {},
          envValues: process.env ? { ...process.env } : {},
          status: ProcessStatus.STOPPED,
          processId: null,
          startTime: null,
          command: process.base_command,
          retryCount: 0,
          maxRetries: process.restart?.max_retries ?? 3,
        };
      });
      setProcessesData(initialProcessesData);
    }),
  );

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
      setProcessesData(processName, "status", ProcessStatus.RESTARTING);
      toast.error(`${processName} crashed, restarting...`);
    } else {
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
    return yamlConfig()?.processes.find((p) => p.name === processName);
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
    if (pollInterval) {
      clearInterval(pollInterval);
    }

    pollInterval = setInterval(async () => {
      const activeProcesses: Array<{ name: string; pid: ProcessId }> = [];
      Object.entries(processesData).forEach(([name, data]) => {
        if (data.processId && isProcessActive(data.status)) {
          activeProcesses.push({ name, pid: data.processId });
        }
      });

      if (activeProcesses.length === 0) {
        if (pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
        return;
      }

      const processIds = activeProcesses.map((p) => p.pid);
      const statusMap =
        await window.electronAPI.getBulkProcessStatus(processIds);

      activeProcesses.forEach(({ name, pid }) => {
        const currentStatus = processesData[name]?.status;
        if (currentStatus === ProcessStatus.RESTARTING) return;

        const isRunning = statusMap[pid];
        if (isRunning) {
          setProcessesData(name, "status", ProcessStatus.RUNNING);
        } else if (currentStatus === ProcessStatus.RUNNING) {
          setProcessesData(name, {
            status: ProcessStatus.STOPPED,
            startTime: null,
          });
        }
      });
    }, POLL_STATUS_INTERVAL_MS);
  };

  // Resolve cwd: if process has custom cwd, resolve it relative to rootDirectory
  const resolveProcessCwd = (
    processConfig: NonNullable<ReturnType<typeof getProcessConfig>>,
  ): string => {
    const rootDir = rootDirectory()!;
    if (!processConfig.cwd) return rootDir;
    if (processConfig.cwd.startsWith("/")) return processConfig.cwd;
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
    const restartConfig = processConfig.restart
      ? { ...processConfig.restart }
      : undefined;
    const cwd = resolveProcessCwd(processConfig);
    const storeEnv = processesData[processName]?.envValues;
    const env =
      storeEnv && Object.keys(storeEnv).length > 0
        ? { ...storeEnv }
        : undefined;
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
      onProcessStarted?.();
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

  const restartProcess = async (processName: string) => {
    await stopProcess(processName);
    await startProcess(processName);
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

  const getProcessEnv = (processName: string) => {
    return getProcessConfig(processName)?.env;
  };

  const setEnvValue = (processName: string, key: string, value: string) => {
    setProcessesData(processName, "envValues", key, value);
  };

  const setArgValues = (
    processName: string,
    argName: string,
    value: string,
  ) => {
    setProcessesData(processName, "argValues", argName, value);
    const newCommand = computeCommand(processName);
    setProcessesData(processName, "command", newCommand);
  };

  return {
    processesData,
    hasRunningProcesses,
    getProcessData,
    getProcessCommand,
    getProcessStatus,
    getProcessStartTime,
    getProcessId,
    getProcessArgs,
    getProcessEnv,
    setArgValues,
    setEnvValue,
    startProcess,
    stopProcess,
    restartProcess,
  };
};
