import { type JSX, useContext } from "solid-js";
import { useConfig, useGrouping, useProcesses, useResources } from "../hooks";
import {
  DashboardContext,
  type DashboardContextType,
} from "./DashboardContext";

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
  selectedFile: string;
};

export const DashboardProvider = (props: DashboardProviderProps) => {
  const config = useConfig(props.selectedFile);

  // Use a mutable ref so useProcesses can call startResourcePolling
  // after useResources is initialized (avoids circular dependency)
  let onProcessStarted = () => {};

  const processes = useProcesses({
    yamlConfig: config.yamlConfig,
    rootDirectory: config.rootDirectory,
    onProcessStarted: () => onProcessStarted(),
  });

  const resources = useResources({
    processesData: processes.processesData,
  });

  // Wire up the callback now that resources is available
  onProcessStarted = resources.startResourcePolling;

  const grouping = useGrouping({
    yamlConfig: config.yamlConfig,
    processesData: processes.processesData,
    startProcess: processes.startProcess,
    stopProcess: processes.stopProcess,
  });

  const value: DashboardContextType = {
    // Config
    isLoading: config.isLoading,
    yamlConfig: config.yamlConfig,
    rootDirectory: config.rootDirectory,
    errors: config.errors,
    parseFile: config.parseFile,
    // Processes
    hasRunningProcesses: processes.hasRunningProcesses,
    getProcessData: processes.getProcessData,
    getProcessCommand: processes.getProcessCommand,
    getProcessStatus: processes.getProcessStatus,
    getProcessStartTime: processes.getProcessStartTime,
    getProcessId: processes.getProcessId,
    getProcessArgs: processes.getProcessArgs,
    getProcessEnv: processes.getProcessEnv,
    setArgValues: processes.setArgValues,
    setEnvValue: processes.setEnvValue,
    startProcess: processes.startProcess,
    stopProcess: processes.stopProcess,
    // Grouping
    hasGroups: grouping.hasGroups,
    getGroupedProcesses: grouping.getGroupedProcesses,
    isGroupCollapsed: grouping.isGroupCollapsed,
    toggleGroupCollapsed: grouping.toggleGroupCollapsed,
    getGroupRunningCount: grouping.getGroupRunningCount,
    startGroup: grouping.startGroup,
    stopGroup: grouping.stopGroup,
    // Resources
    getProcessResources: resources.getProcessResources,
  };

  return (
    <DashboardContext.Provider value={value}>
      {props.children}
    </DashboardContext.Provider>
  );
};
