import { createContext } from "solid-js";

export type VersionContextProps = {
  latestVersion: () => string | null;
  checkFailed: () => boolean;
  checked: () => boolean;
  isUpdateAvailable: () => boolean;
};

export const VersionContext = createContext<VersionContextProps>();
