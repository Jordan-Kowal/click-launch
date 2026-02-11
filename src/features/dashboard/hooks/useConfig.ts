import { createEffect, createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import { useAppStorageContext } from "@/contexts";
import type { ValidationResult, YamlConfig } from "@/electron/types";

export const useConfig = (selectedFile: string) => {
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
    const result = await window.electronAPI.validateYaml(selectedFile);

    if (result?.isValid && result?.config) {
      setYamlData({
        yamlConfig: result.config,
        rootDirectory: result.rootDirectory || null,
        errors: [],
      });
      registerProject(selectedFile);
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
    if (selectedFile) {
      parseFile();
    }
  });

  return {
    isLoading,
    yamlConfig: () => yamlData.yamlConfig,
    rootDirectory: () => yamlData.rootDirectory,
    errors: () => yamlData.errors,
    parseFile,
  };
};
