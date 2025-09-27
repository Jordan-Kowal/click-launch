import { createContext, createMemo, type JSX, useContext } from "solid-js";
import { useLocalStorage } from "../hooks";

const RECENT_PROJECTS_KEY = "recent-projects";
const MAX = 10;

export type AppStorageContextProps = {
  registerProject: (filepath: string) => void;
  removeProject: (filepath: string) => void;
  removeProjects: (filepaths: string[]) => void;
  projects: () => string[];
};

const AppStorageContext = createContext<AppStorageContextProps | undefined>(
  undefined,
);

export const useAppStorageContext = (): AppStorageContextProps => {
  const context = useContext(AppStorageContext);
  if (!context) {
    throw new Error(
      "useAppStorageContext must be used within an AppStorageProvider",
    );
  }
  return context;
};

export type AppStorageProviderProps = {
  children: JSX.Element;
};

export const AppStorageProvider = (props: AppStorageProviderProps) => {
  const [storageValue, setStorageValue] =
    useLocalStorage<string>(RECENT_PROJECTS_KEY);

  const projects = createMemo((): string[] => {
    const value = storageValue();
    if (!value) return [];
    try {
      return JSON.parse(value);
    } catch (_) {
      setStorageValue("[]");
      return [];
    }
  });

  const registerProject = (filepath: string) => {
    if (!filepath || typeof filepath !== "string") return;
    const filteredProjects = projects().filter((p) => p !== filepath);
    const updatedProjects = [filepath, ...filteredProjects].slice(0, MAX);
    setStorageValue(JSON.stringify(updatedProjects));
  };

  const removeProject = (filepath: string) => {
    if (!filepath || typeof filepath !== "string") return;
    const updatedProjects = projects().filter((p) => p !== filepath);
    setStorageValue(JSON.stringify(updatedProjects));
  };

  const removeProjects = (filepaths: string[]) => {
    if (!Array.isArray(filepaths) || filepaths.length === 0) return;
    const validFilepaths = filepaths.filter(
      (fp) => fp && typeof fp === "string",
    );
    if (validFilepaths.length === 0) return;
    const updatedProjects = projects().filter(
      (p) => !validFilepaths.includes(p),
    );
    setStorageValue(JSON.stringify(updatedProjects));
  };

  const value: AppStorageContextProps = {
    projects,
    registerProject,
    removeProject,
    removeProjects,
  };

  return (
    <AppStorageContext.Provider value={value}>
      {props.children}
    </AppStorageContext.Provider>
  );
};
