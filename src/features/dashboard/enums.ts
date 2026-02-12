export enum ProcessStatus {
  STOPPED = "Stopped",
  STARTING = "Starting",
  RUNNING = "Running",
  STOPPING = "Stopping",
  CRASHED = "Crashed",
  RESTARTING = "Restarting",
}

export const isProcessActive = (status: ProcessStatus): boolean =>
  status !== ProcessStatus.STOPPED && status !== ProcessStatus.CRASHED;
