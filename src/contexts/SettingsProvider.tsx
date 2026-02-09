import { createEffect, createMemo, type JSX, useContext } from "solid-js";
import { useLocalStorage } from "../hooks";
import {
  DEFAULT_SETTINGS,
  type Settings,
  SettingsContext,
  type SettingsContextProps,
} from "./SettingsContext";

const SETTINGS_STORAGE_KEY = "app-settings";

export const useSettingsContext = (): SettingsContextProps => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error(
      "useSettingsContext must be used within a SettingsProvider",
    );
  }
  return context;
};

export type SettingsProviderProps = {
  children: JSX.Element;
};

export const SettingsProvider = (props: SettingsProviderProps) => {
  const [storageValue, setStorageValue] = useLocalStorage(SETTINGS_STORAGE_KEY);

  const settings = createMemo((): Settings => {
    const value = storageValue();
    if (!value) return { ...DEFAULT_SETTINGS };
    try {
      const parsed = JSON.parse(value);
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch {
      setStorageValue(JSON.stringify(DEFAULT_SETTINGS));
      return { ...DEFAULT_SETTINGS };
    }
  });

  // Applied on <html> rather than a wrapper div because fixed-position elements
  // (like modal backdrops) escape wrapper divs and need the root to be themed.
  createEffect(() => {
    document.documentElement.setAttribute("data-theme", settings().theme);
  });

  const updateSetting = <K extends keyof Settings>(
    key: K,
    value: Settings[K],
  ) => {
    const current = settings();
    const updated = { ...current, [key]: value };
    if (key === "logBufferSize") {
      const numValue = value as number;
      updated.logBufferSize = Math.max(100, Math.min(10000, numValue));
    }
    setStorageValue(JSON.stringify(updated));
  };

  const resetSettings = () => {
    setStorageValue(JSON.stringify(DEFAULT_SETTINGS));
  };

  const contextValue: SettingsContextProps = {
    settings,
    updateSetting,
    resetSettings,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {props.children}
    </SettingsContext.Provider>
  );
};
