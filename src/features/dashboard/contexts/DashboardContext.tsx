import {
  createContext,
  memo,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRecentProjects } from "@/hooks";
import type { ValidationResult, YamlConfig } from "@/types/electron";

type DashboardContextType = {
  isLoading: boolean;
  yamlConfig: YamlConfig | null;
  errors: ValidationResult["errors"];
  parseFile: () => Promise<void>;
};

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined,
);

export const useDashboardContext = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
};

type DashboardProviderProps = {
  children: ReactNode;
  selectedFile: string | null;
};

export const DashboardProvider = memo(
  ({ children, selectedFile }: DashboardProviderProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [yamlConfig, setYamlConfig] = useState<YamlConfig | null>(null);
    const [errors, setErrors] = useState<ValidationResult["errors"]>([]);
    const { registerProject } = useRecentProjects();

    const parseFile = useCallback(async () => {
      setIsLoading(true);
      const result = await window.electronAPI.validateYaml(selectedFile!);

      if (result?.isValid && result?.config) {
        setYamlConfig(result.config);
        setErrors([]);
        registerProject(selectedFile!);
      } else {
        setYamlConfig(null);
        setErrors(result?.errors || []);
      }

      setIsLoading(false);
    }, [selectedFile, registerProject]);

    useEffect(() => {
      if (selectedFile) {
        parseFile();
      }
    }, [selectedFile, parseFile]);

    const value: DashboardContextType = useMemo(
      () => ({
        isLoading,
        yamlConfig,
        errors,
        parseFile,
      }),
      [isLoading, yamlConfig, parseFile, errors],
    );

    return (
      <DashboardContext.Provider value={value}>
        {children}
      </DashboardContext.Provider>
    );
  },
);
