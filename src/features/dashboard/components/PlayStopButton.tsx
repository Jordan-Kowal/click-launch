import { Play, Square } from "lucide-react";
import { memo } from "react";
import { useProcessContext } from "../contexts/ProcessContext";
import { ProcessStatus } from "../enums";

export const PlayStopButton: React.FC = memo(() => {
  const { status, startProcess, stopProcess } = useProcessContext();

  switch (status) {
    case ProcessStatus.STOPPED:
    case ProcessStatus.CRASHED:
      return (
        <button
          type="button"
          className="btn btn-primary btn-circle btn-sm"
          data-testid="play-button"
          onClick={startProcess}
        >
          <Play size={16} />
        </button>
      );

    case ProcessStatus.STARTING:
      return (
        <button
          type="button"
          className="btn btn-primary btn-circle btn-sm"
          data-testid="starting-button"
        >
          <span className="loading loading-spinner" />
        </button>
      );

    case ProcessStatus.RUNNING:
      return (
        <button
          type="button"
          className="btn btn-error btn-circle btn-sm"
          data-testid="running-button"
          onClick={stopProcess}
        >
          <Square size={16} />
        </button>
      );

    case ProcessStatus.STOPPING:
      return (
        <button
          type="button"
          className="btn btn-error btn-circle btn-sm"
          data-testid="stopping-button"
        >
          <span className="loading loading-spinner" />
        </button>
      );

    default:
      return null;
  }
});
