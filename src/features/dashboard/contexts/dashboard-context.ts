import { createContext } from "solid-js";
import type { ValidationResult, YamlConfig } from "@/electron/types";

export type DashboardContextType = {
  isLoading: () => boolean;
  yamlConfig: () => YamlConfig | null;
  rootDirectory: () => string | null;
  errors: () => ValidationResult["errors"];
  parseFile: () => Promise<void>;
};

export const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined,
);
