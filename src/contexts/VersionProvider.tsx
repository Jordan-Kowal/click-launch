import {
  createMemo,
  createSignal,
  type JSX,
  onMount,
  useContext,
} from "solid-js";
import { getCurrentVersion, getLatestVersion } from "@/utils/versionCheck";
import { VersionContext, type VersionContextProps } from "./VersionContext";

export const useVersionContext = (): VersionContextProps => {
  const context = useContext(VersionContext);
  if (!context) {
    throw new Error("useVersionContext must be used within a VersionProvider");
  }
  return context;
};

export type VersionProviderProps = {
  children: JSX.Element;
};

export const VersionProvider = (props: VersionProviderProps) => {
  const [latestVersion, setLatestVersion] = createSignal<string | null>(null);
  const [checkFailed, setCheckFailed] = createSignal(false);
  const [checked, setChecked] = createSignal(false);

  const isUpdateAvailable = createMemo(() => {
    const latest = latestVersion();
    return latest !== null && latest !== getCurrentVersion();
  });

  onMount(async () => {
    const latest = await getLatestVersion();
    if (latest === null) {
      setCheckFailed(true);
    } else {
      setLatestVersion(latest);
    }
    setChecked(true);
  });

  const contextValue: VersionContextProps = {
    latestVersion,
    checkFailed,
    checked,
    isUpdateAvailable,
  };

  return (
    <VersionContext.Provider value={contextValue}>
      {props.children}
    </VersionContext.Provider>
  );
};
