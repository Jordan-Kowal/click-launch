import { createEffect, onCleanup } from "solid-js";
import { createStore } from "solid-js/store";
import { LogType } from "@/electron/enums";
import type { ProcessLogData, YamlConfig } from "@/electron/types";
import { isLiveUpdate } from "@/utils/ansiToHtml";

export type LogWithId = ProcessLogData & { id: string };

const BATCH_DELAY_MS = 500;
const BATCH_DELAY_MS_AUTO_SCROLL = 100;

type UseLogStoreParams = {
  processName: () => string;
  yamlConfig: () => YamlConfig | null;
  getProcessId: (processName: string) => string | null;
  autoScroll: () => boolean;
  isPaused: () => boolean;
  logBufferSize: () => number;
};

export const useLogStore = ({
  processName,
  yamlConfig,
  getProcessId,
  autoScroll,
  isPaused,
  logBufferSize,
}: UseLogStoreParams) => {
  const [logsByProcess, setLogsByProcess] = createStore<
    Record<string, LogWithId[]>
  >({});
  const [pendingLogsByProcess, setPendingLogsByProcess] = createStore<
    Record<string, ProcessLogData[]>
  >({});

  let batchTimer: number | null = null;

  const processNames = () => yamlConfig()?.processes.map((p) => p.name) || [];
  const currentLogs = () => logsByProcess[processName()] || [];

  const clearBatchTimer = () => {
    if (batchTimer === null) return;
    clearTimeout(batchTimer);
    batchTimer = null;
  };

  const flushLogs = () => {
    const names = processNames();
    names.forEach((name) => {
      const pending = pendingLogsByProcess[name] || [];
      if (pending.length === 0) return;

      const current = logsByProcess[name] || [];
      const updated = [...current];

      pending.forEach((log) => {
        const isUpdate = log.type !== LogType.EXIT && isLiveUpdate(log.output);

        if (isUpdate && updated.length > 0) {
          const lastLog = updated[updated.length - 1];
          updated[updated.length - 1] = { ...log, id: lastLog.id };
        } else {
          updated.push({ ...log, id: crypto.randomUUID() });
        }
      });

      const maxLogs = logBufferSize();
      if (updated.length > maxLogs) {
        updated.splice(0, updated.length - maxLogs);
      }

      setLogsByProcess(name, updated);
      setPendingLogsByProcess(name, []);
    });
  };

  const addLog = (logData: ProcessLogData) => {
    if (isPaused()) return;

    const names = processNames();
    const name = names.find((n) => logData.processId === getProcessId(n));

    if (!name) return;

    const currentPending = pendingLogsByProcess[name] || [];
    setPendingLogsByProcess(name, [...currentPending, logData]);

    const batchDelay = autoScroll()
      ? BATCH_DELAY_MS_AUTO_SCROLL
      : BATCH_DELAY_MS;

    if (batchTimer !== null) return;
    batchTimer = window.setTimeout(() => {
      flushLogs();
      batchTimer = null;
    }, batchDelay);
  };

  const clearLogs = () => {
    const name = processName();
    setLogsByProcess(name, []);
    setPendingLogsByProcess(name, []);
    clearBatchTimer();
  };

  // Listen for logs from all processes
  createEffect(() => {
    window.electronAPI.onProcessLog((logData) => {
      addLog(logData);
    });

    onCleanup(() => {
      window.electronAPI.removeProcessLogListener();
      clearBatchTimer();
      flushLogs();
    });
  });

  return {
    currentLogs,
    addLog,
    clearLogs,
    flushLogs,
    clearBatchTimer,
  };
};
