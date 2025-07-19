export type ValidationResult = {
  isValid: boolean;
  config: YamlConfig | null;
  errors: {
    message: string;
    path?: string;
  }[];
};

export type ValidationError = ValidationResult["errors"][0];

export type YamlConfig = {
  project_name: string;
  processes: {
    name: string;
    base_command: string;
    allows_free_text: boolean;
    args?: {
      type: "toggle" | "select" | "multiselect" | "input";
      name: string;
      default: any;
      values?: {
        value: any;
        output: string;
      }[];
    }[];
  }[];
};

export type ProcessConfig = YamlConfig["processes"][0];
export type ArgConfig = NonNullable<ProcessConfig["args"]>[0];
export type ArgValue = NonNullable<ArgConfig["values"]>[0];

export interface ElectronAPI {
  platform: string;
  version: string;
  openFileDialog: () => Promise<string | undefined>;
  validateYaml: (filePath: string) => Promise<ValidationResult>;
  validatePaths: (filePaths: string[]) => Promise<[string[], string[]]>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
