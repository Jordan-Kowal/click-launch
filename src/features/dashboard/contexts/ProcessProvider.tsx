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
import type { ProcessConfig, ProcessId } from "@/electron/types";
import { ProcessStatus } from "../enums";
import { ProcessContext, type ProcessContextType } from "./ProcessContext";

const POLL_STATUS_INTERVAL_MS = 1000; // Simple 1s polling

export const useProcessContext = () => {
  const context = useContext(ProcessContext);
  if (!context) {
    throw new Error("useProcessContext must be used within a ProcessProvider");
  }
  return context;
};

type ProcessProviderProps = {
  children: JSX.Element;
  process: ProcessConfig;
  rootDirectory: string;
};

export const ProcessProvider = (props: ProcessProviderProps) => {
  const [argValues, setArgValues] = createStore<Record<string, string>>({});
  const [status, setStatus] = createSignal(ProcessStatus.STOPPED);
  const [processId, setProcessId] = createSignal<ProcessId | null>(null);
  const [startTime, setStartTime] = createSignal<Date | null>(null);

  let pollStatusInterval: ReturnType<typeof setInterval> | null = null;

  const shouldPoll = createMemo(
    () =>
      status() === ProcessStatus.RUNNING || status() === ProcessStatus.STARTING,
  );

  const command = createMemo(() => {
    const outputArgs = Object.values(argValues);
    let output = props.process.base_command;
    if (outputArgs.length > 0) {
      output = `${output} ${outputArgs.join(" ")}`;
    }
    return output;
  });

  const startProcess = async () => {
    setStatus(ProcessStatus.STARTING);
    const result = await window.electronAPI.startProcess(
      props.rootDirectory,
      command(),
    );
    if (result.success && result.processId) {
      setProcessId(result.processId);
      setStartTime(new Date());
      setStatus(ProcessStatus.RUNNING);
    } else {
      setStatus(ProcessStatus.STOPPED);
      toast.error(`Failed to start ${props.process.name}`);
    }
  };

  const stopProcess = async () => {
    const pid = processId();
    if (!pid) return;
    setStatus(ProcessStatus.STOPPING);
    const result = await window.electronAPI.stopProcess(pid);
    if (result.success) {
      setStatus(ProcessStatus.STOPPED);
      setStartTime(null);
    } else {
      setStatus(ProcessStatus.RUNNING);
      toast.error(`Failed to stop ${props.process.name}`);
    }
  };

  // Simple 1s polling
  createEffect(() => {
    const pid = processId();
    if (!pid || !shouldPoll()) return;

    pollStatusInterval = setInterval(async () => {
      const isRunning = await window.electronAPI.getProcessStatus(pid);
      const newStatus = isRunning
        ? ProcessStatus.RUNNING
        : ProcessStatus.STOPPED;
      setStatus(newStatus);
    }, POLL_STATUS_INTERVAL_MS);

    onCleanup(() => {
      if (pollStatusInterval) {
        clearInterval(pollStatusInterval);
        pollStatusInterval = null;
      }
    });
  });

  const context: ProcessContextType = {
    name: props.process.name,
    args: props.process.args,
    processId,
    command,
    status,
    startTime,
    setArgValues,
    startProcess,
    stopProcess,
  };

  return (
    <ProcessContext.Provider value={context}>
      {props.children}
    </ProcessContext.Provider>
  );
};
