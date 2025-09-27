import {
  createContext,
  memo,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { useLocalStorage } from "../hooks";

const RECENT_PROJECTS_KEY = "recent-projects";
const MAX = 10;

export type AppStorageContextProps = {
  registerProject: (filepath: string) => void;
  removeProject: (filepath: string) => void;
  removeProjects: (filepaths: string[]) => void;
  projects: string[];
};

const AppStorageContext = createContext<AppStorageContextProps | undefined>(
  undefined,
);

export const useAppStorage = (): AppStorageContextProps => {
  const context = useContext(AppStorageContext);
  if (!context) {
    throw new Error("useAppStorage must be used within an AppStorageProvider");
  }
  return context;
};

export type AppStorageProviderProps = {
  children: ReactNode;
};

export const AppStorageProvider: React.FC<AppStorageProviderProps> = memo(
  ({ children }) => {
    const [storageValue, setStorageValue] =
      useLocalStorage<string>(RECENT_PROJECTS_KEY);

    const projects: string[] = useMemo(() => {
      if (!storageValue) return [];
      try {
        return JSON.parse(storageValue);
      } catch (_) {
        setStorageValue("[]");
        return [];
      }
    }, [storageValue, setStorageValue]);

    const registerProject = useCallback(
      (filepath: string) => {
        if (!filepath || typeof filepath !== "string") return;
        const filteredProjects = projects.filter((p) => p !== filepath);
        const updatedProjects = [filepath, ...filteredProjects].slice(0, MAX);
        setStorageValue(JSON.stringify(updatedProjects));
      },
      [projects, setStorageValue],
    );

    const removeProject = useCallback(
      (filepath: string) => {
        if (!filepath || typeof filepath !== "string") return;
        const updatedProjects = projects.filter((p) => p !== filepath);
        setStorageValue(JSON.stringify(updatedProjects));
      },
      [projects, setStorageValue],
    );

    const removeProjects = useCallback(
      (filepaths: string[]) => {
        if (!Array.isArray(filepaths) || filepaths.length === 0) return;
        const validFilepaths = filepaths.filter(
          (fp) => fp && typeof fp === "string",
        );
        if (validFilepaths.length === 0) return;
        const updatedProjects = projects.filter(
          (p) => !validFilepaths.includes(p),
        );
        setStorageValue(JSON.stringify(updatedProjects));
      },
      [projects, setStorageValue],
    );

    const value: AppStorageContextProps = useMemo(
      () => ({
        projects,
        registerProject,
        removeProject,
        removeProjects,
      }),
      [projects, registerProject, removeProject, removeProjects],
    );

    return (
      <AppStorageContext.Provider value={value}>
        {children}
      </AppStorageContext.Provider>
    );
  },
);
