import { onCleanup } from "solid-js";
import { createStore } from "solid-js/store";
import type { ProcessId, ProcessResourceData } from "@/electron/types";
import type { ProcessData } from "../contexts/DashboardContext";
import { isProcessActive } from "../enums";

const POLL_RESOURCES_INTERVAL_MS = 3000;

type UseResourcesParams = {
  processesData: Record<string, ProcessData>;
};

export const useResources = ({ processesData }: UseResourcesParams) => {
  const [resourcesData, setResourcesData] = createStore<
    Record<string, ProcessResourceData>
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
      const resources =
        await window.electronAPI.getProcessResources(processIds);

      activeProcesses.forEach(({ name, pid }) => {
        const data = resources[pid];
        if (data) {
          setResourcesData(name, data);
        }
      });
    }, POLL_RESOURCES_INTERVAL_MS);
  };

  const getProcessResources = (
    processName: string,
  ): ProcessResourceData | undefined => {
    return resourcesData[processName];
  };

  return {
    getProcessResources,
    startResourcePolling,
  };
};
