export interface ElectronAPI {
  platform: string;
  version: string;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
