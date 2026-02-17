import { ProcessService, ResourceService } from "@backend";
import { onCleanup } from "solid-js";
import { createStore } from "solid-js/store";
import { useSettingsContext } from "@/contexts";
import type {
  ProcessId,
  ProcessResourceData,
  ResourceHistoryEntry,
} from "@/types";
import type { ProcessData } from "../contexts/DashboardContext";
import { isProcessActive } from "../enums";

const POLL_RESOURCES_INTERVAL_MS = 3000;

type UseResourcesParams = {
  processesData: Record<string, ProcessData>;
};

export const useResources = ({ processesData }: UseResourcesParams) => {
  const { settings } = useSettingsContext();

  const [resourcesData, setResourcesData] = createStore<
    Record<string, ProcessResourceData>
  >({});

  const [historyData, setHistoryData] = createStore<
    Record<string, ResourceHistoryEntry[]>
  >({});

  const [sessionPeaks, setSessionPeaks] = createStore<
    Record<string, { cpu: number; memoryBytes: number }>
  >({});

  const [windowPeaks, setWindowPeaks] = createStore<
    Record<string, { cpu: number; memoryBytes: number }>
  >({});

  let resourcePollInterval: ReturnType<typeof setInterval> | null = null;

  onCleanup(() => {
    if (resourcePollInterval) {
      clearInterval(resourcePollInterval);
      resourcePollInterval = null;
    }
  });

  const startResourcePolling = () => {
    if (resourcePollInterval) {
      clearInterval(resourcePollInterval);
    }

    resourcePollInterval = setInterval(async () => {
      const activeProcesses: Array<{ name: string; pid: ProcessId }> = [];
      Object.entries(processesData).forEach(([name, data]) => {
        if (data.processId && isProcessActive(data.status)) {
          activeProcesses.push({ name, pid: data.processId });
        }
      });

      if (activeProcesses.length === 0) {
        if (resourcePollInterval) {
          clearInterval(resourcePollInterval);
          resourcePollInterval = null;
        }
        return;
      }

      const processIds = activeProcesses.map((p) => p.pid);
      const pidMap = await ProcessService.GetRunningProcessPids(processIds);
      const resources = await ResourceService.Get(pidMap);

      const now = Date.now();
      const retentionMs = settings().resourceHistoryMinutes * 60 * 1000;

      activeProcesses.forEach(({ name, pid }) => {
        const data = resources[pid];
        if (data) {
          setResourcesData(name, data);

          // Update session peaks
          const currentPeaks = sessionPeaks[name] ?? {
            cpu: 0,
            memoryBytes: 0,
          };
          if (
            data.cpu > currentPeaks.cpu ||
            data.memoryBytes > currentPeaks.memoryBytes
          ) {
            setSessionPeaks(name, {
              cpu: Math.max(data.cpu, currentPeaks.cpu),
              memoryBytes: Math.max(data.memoryBytes, currentPeaks.memoryBytes),
            });
          }

          // Append history entry
          const entry: ResourceHistoryEntry = {
            timestamp: now,
            cpu: data.cpu,
            memoryBytes: data.memoryBytes,
          };
          const current = historyData[name] ?? [];
          const updated = [...current, entry];

          // Slice: find first entry within retention window
          const cutoff = now - retentionMs;
          const firstValidIndex = updated.findIndex(
            (e) => e.timestamp >= cutoff,
          );
          const sliced =
            firstValidIndex === -1 ? [] : updated.slice(firstValidIndex);

          setHistoryData(name, sliced);

          // Recompute window peaks from retained history
          let maxCpu = 0;
          let maxMem = 0;
          for (const e of sliced) {
            if (e.cpu > maxCpu) maxCpu = e.cpu;
            if (e.memoryBytes > maxMem) maxMem = e.memoryBytes;
          }
          setWindowPeaks(name, { cpu: maxCpu, memoryBytes: maxMem });
        }
      });
    }, POLL_RESOURCES_INTERVAL_MS);
  };

  const getProcessResources = (
    processName: string,
  ): ProcessResourceData | undefined => {
    return resourcesData[processName];
  };

  const getProcessResourceHistory = (
    processName: string,
  ): ResourceHistoryEntry[] => {
    return historyData[processName] ?? [];
  };

  const getProcessSessionPeaks = (
    processName: string,
  ): { cpu: number; memoryBytes: number } | undefined => {
    return sessionPeaks[processName];
  };

  const getProcessWindowPeaks = (
    processName: string,
  ): { cpu: number; memoryBytes: number } | undefined => {
    return windowPeaks[processName];
  };

  return {
    getProcessResources,
    getProcessResourceHistory,
    getProcessSessionPeaks,
    getProcessWindowPeaks,
    startResourcePolling,
  };
};
