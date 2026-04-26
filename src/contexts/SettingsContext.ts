import { createContext } from "solid-js";

export type Settings = {
  theme: string;
  logBufferSize: number;
  showNotifications: boolean;
  showGrouping: boolean;
  showResourceMonitor: boolean;
  showTimestamps: boolean;
  resourceHistoryMinutes: number;
};

export const AVAILABLE_THEMES = [
  "abyss",
  "acid",
  "aqua",
  "autumn",
  "black",
  "bumblebee",
  "business",
  "caramellatte",
  "cmyk",
  "coffee",
  "corporate",
  "cupcake",
  "cyberpunk",
  "dark",
  "dim",
  "dracula",
  "emerald",
  "fantasy",
  "forest",
  "garden",
  "halloween",
  "lemonade",
  "light",
  "lofi",
  "luxury",
  "night",
  "nord",
  "pastel",
  "retro",
  "silk",
  "sunset",
  "synthwave",
  "valentine",
  "winter",
  "wireframe",
] as const;

export const MIN_LOG_BUFFER_SIZE = 100;
export const MAX_LOG_BUFFER_SIZE = 50000;

export const MIN_RESOURCE_HISTORY_MINUTES = 1;
export const MAX_RESOURCE_HISTORY_MINUTES = 120;

export const DEFAULT_SETTINGS: Settings = {
  theme: "nord",
  logBufferSize: 10000,
  showNotifications: true,
  showGrouping: true,
  showResourceMonitor: true,
  showTimestamps: true,
  resourceHistoryMinutes: 15,
};

export type SettingsContextProps = {
  settings: () => Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  resetSettings: () => void;
};

export const SettingsContext = createContext<SettingsContextProps>();
