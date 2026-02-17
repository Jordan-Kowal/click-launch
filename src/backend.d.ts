/**
 * Type declarations for Wails-generated backend bindings.
 * The binding generator outputs .js files with JSDoc, so we need manual .d.ts declarations.
 * These must stay in sync with the Go service methods in backend/*.go.
 */
declare module "@backend" {
  import type {
    ProcessResourceData,
    ProcessStartResult,
    ProcessStopResult,
    ValidationResult,
  } from "@/types";

  export const AppService: {
    GetVersion(): Promise<string>;
    GetResourcePath(filename: string): Promise<string>;
    InstallUpdate(): Promise<void>;
  };

  export const ConfigService: {
    Validate(filePath: string): Promise<ValidationResult>;
  };

  export const FileService: {
    OpenFileDialog(): Promise<string>;
    OpenFolderDialog(): Promise<string>;
    ValidatePaths(filePaths: string[]): Promise<[string[], string[]]>;
    WriteFile(
      dirPath: string,
      fileName: string,
      content: string,
    ): Promise<string>;
  };

  export const ProcessService: {
    Start(
      cwd: string,
      command: string,
      restartConfig: Record<string, any> | null,
      env: Record<string, string>,
    ): Promise<ProcessStartResult>;
    Stop(id: string): Promise<ProcessStopResult>;
    StopAll(): Promise<void>;
    IsRunning(id: string): Promise<boolean>;
    BulkStatus(ids: string[]): Promise<Record<string, boolean>>;
    GetRunningProcessPids(ids: string[]): Promise<Record<string, number>>;
  };

  export const ResourceService: {
    Get(
      pidMap: Record<string, number>,
    ): Promise<Record<string, ProcessResourceData>>;
  };
}
