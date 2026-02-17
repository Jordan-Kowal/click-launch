import { createMemo } from "solid-js";
import { createStore } from "solid-js/store";
import type { YamlConfig } from "@/types";
import type {
  GroupedProcesses,
  ProcessData,
} from "../contexts/DashboardContext";
import { isProcessActive } from "../enums";

type UseGroupingParams = {
  yamlConfig: () => YamlConfig | null;
  processesData: Record<string, ProcessData>;
  startProcess: (processName: string) => Promise<void>;
  stopProcess: (processName: string) => Promise<void>;
};

export const useGrouping = ({
  yamlConfig,
  processesData,
  startProcess,
  stopProcess,
}: UseGroupingParams) => {
  const [collapsedGroups, setCollapsedGroups] = createStore<
    Record<string, boolean>
  >({});

  const hasGroups = createMemo(() => {
    const processes = yamlConfig()?.processes ?? [];
    return processes.some((p) => !!p.group);
  });

  const getGroupedProcesses = createMemo((): GroupedProcesses[] => {
    const processes = yamlConfig()?.processes ?? [];
    if (!hasGroups()) {
      return [{ name: "Other", processes }];
    }
    const groups: Record<string, typeof processes> = {};
    for (const process of processes) {
      const groupName = process.group || "Other";
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(process);
    }
    const sortedNames = Object.keys(groups).sort((a, b) => {
      if (a === "Other") return 1;
      if (b === "Other") return -1;
      return a.localeCompare(b);
    });
    return sortedNames.map((name) => ({ name, processes: groups[name] }));
  });

  const isGroupCollapsed = (groupName: string): boolean => {
    return collapsedGroups[groupName] ?? false;
  };

  const toggleGroupCollapsed = (groupName: string) => {
    setCollapsedGroups(groupName, !isGroupCollapsed(groupName));
  };

  const getGroupRunningCount = (groupName: string): number => {
    const group = getGroupedProcesses().find((g) => g.name === groupName);
    if (!group) return 0;
    return group.processes.filter((p) => {
      const status = processesData[p.name]?.status;
      return status !== undefined && isProcessActive(status);
    }).length;
  };

  const startGroup = async (groupName: string) => {
    const group = getGroupedProcesses().find((g) => g.name === groupName);
    if (!group) return;
    const promises = group.processes
      .filter((p) => {
        const status = processesData[p.name]?.status;
        return status !== undefined && !isProcessActive(status);
      })
      .map((p) => startProcess(p.name));
    await Promise.all(promises);
  };

  const stopGroup = async (groupName: string) => {
    const group = getGroupedProcesses().find((g) => g.name === groupName);
    if (!group) return;
    const promises = group.processes
      .filter((p) => {
        const status = processesData[p.name]?.status;
        return status !== undefined && isProcessActive(status);
      })
      .map((p) => stopProcess(p.name));
    await Promise.all(promises);
  };

  return {
    hasGroups,
    getGroupedProcesses,
    isGroupCollapsed,
    toggleGroupCollapsed,
    getGroupRunningCount,
    startGroup,
    stopGroup,
  };
};
