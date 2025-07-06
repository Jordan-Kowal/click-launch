export interface ElectronAPI {
  platform: string;
  version: string;
  openFileDialog: () => Promise<string | undefined>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
