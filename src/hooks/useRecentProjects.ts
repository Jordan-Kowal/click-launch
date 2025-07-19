import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";

const RECENT_PROJECTS_KEY = "recent-projects";
const MAX = 10;

export type UseRecentProjects = {
  registerProject: (filepath: string) => void;
  removeProject: (filepath: string) => void;
  removeProjects: (filepaths: string[]) => void;
  projects: string[];
};

export const useRecentProjects = () => {
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

  return {
    projects,
    registerProject,
    removeProject,
    removeProjects,
  };
};
