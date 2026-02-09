import { createContext } from "solid-js";

export type Settings = {
  theme: "nord" | "dracula";
  logBufferSize: number;
  showNotifications: boolean;
  showGrouping: boolean;
  showResourceMonitor: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  theme: "nord",
  logBufferSize: 1500,
  showNotifications: true,
  showGrouping: true,
  showResourceMonitor: true,
};

export type SettingsContextProps = {
  settings: () => Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  resetSettings: () => void;
};

export const SettingsContext = createContext<SettingsContextProps>();
