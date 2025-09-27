import { createEffect, createSignal, type JSX, useContext } from "solid-js";
import { useAppStorageContext } from "@/contexts";
import type { ValidationResult, YamlConfig } from "@/electron/types";
import {
  DashboardContext,
  type DashboardContextType,
} from "./dashboard-context";

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
  const [yamlConfig, setYamlConfig] = createSignal<YamlConfig | null>(null);
  const [rootDirectory, setRootDirectory] = createSignal<string | null>(null);
  const [errors, setErrors] = createSignal<ValidationResult["errors"]>([]);
  const { registerProject } = useAppStorageContext();

  const parseFile = async () => {
    setIsLoading(true);
    const result = await window.electronAPI.validateYaml(props.selectedFile!);

    if (result?.isValid && result?.config) {
      setYamlConfig(result.config);
      setRootDirectory(result.rootDirectory || null);
      setErrors([]);
      registerProject(props.selectedFile!);
    } else {
      setYamlConfig(null);
      setRootDirectory(null);
      setErrors(result?.errors || []);
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
    yamlConfig,
    rootDirectory,
    errors,
    parseFile,
  };

  return (
    <DashboardContext.Provider value={value}>
      {props.children}
    </DashboardContext.Provider>
  );
};
