import { createEffect, createSignal, type JSX, useContext } from "solid-js";
import { createStore } from "solid-js/store";
import { useAppStorageContext } from "@/contexts";
import type { ValidationResult, YamlConfig } from "@/electron/types";
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

  const value: DashboardContextType = {
    isLoading,
    yamlConfig: () => yamlData.yamlConfig,
    rootDirectory: () => yamlData.rootDirectory,
    errors: () => yamlData.errors,
    parseFile,
  };

  return (
    <DashboardContext.Provider value={value}>
      {props.children}
    </DashboardContext.Provider>
  );
};
