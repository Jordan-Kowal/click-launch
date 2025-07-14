import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ValidationResult, YamlConfig } from "@/types/electron";

type DashboardContextType = {
  isLoading: boolean;
  yamlConfig: YamlConfig | null;
  errors: ValidationResult["errors"];
  parseFile: (filePath: string) => Promise<void>;
};

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined,
);

export const useDashboard = () => {
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

export const DashboardProvider = ({
  children,
  selectedFile,
}: DashboardProviderProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [yamlConfig, setYamlConfig] = useState<YamlConfig | null>(null);
  const [errors, setErrors] = useState<ValidationResult["errors"]>([]);

  const parseFile = useCallback(async (filePath: string) => {
    setIsLoading(true);
    const result = await window.electronAPI.validateYaml(filePath);

    if (result.isValid && result.config) {
      setYamlConfig(result.config);
      setErrors([]);
    } else {
      setYamlConfig(null);
      setErrors(result.errors);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (selectedFile) {
      parseFile(selectedFile);
    }
  }, [selectedFile, parseFile]);

  const value: DashboardContextType = {
    isLoading,
    yamlConfig,
    errors,
    parseFile,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};
