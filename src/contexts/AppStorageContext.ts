import { createContext } from "solid-js";

export type AppStorageContextProps = {
  registerProject: (filepath: string) => void;
  removeProject: (filepath: string) => void;
  removeProjects: (filepaths: string[]) => void;
  projects: () => string[];
};

export const AppStorageContext = createContext<AppStorageContextProps>();
