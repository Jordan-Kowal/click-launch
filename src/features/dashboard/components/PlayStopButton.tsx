import { Play, Square } from "lucide-solid";
import { Match, Switch } from "solid-js";
import { useDashboardContext } from "../contexts/";
import { ProcessStatus } from "../enums";

type PlayStopButtonProps = {
  processName: string;
};

export const PlayStopButton = (props: PlayStopButtonProps) => {
  const { getProcessStatus, startProcess, stopProcess } = useDashboardContext();
  const status = () => getProcessStatus(props.processName);

  return (
    <Switch>
      <Match
        when={
          status() === ProcessStatus.STOPPED ||
          status() === ProcessStatus.CRASHED
        }
      >
        <button
          type="button"
          class="btn btn-primary btn-circle btn-sm"
          onClick={() => startProcess(props.processName)}
        >
          <Play size={16} />
        </button>
      </Match>

      <Match when={status() === ProcessStatus.STARTING}>
        <button
          type="button"
          class="btn btn-primary btn-circle btn-sm"
          disabled
        >
          <span class="loading loading-spinner" />
        </button>
      </Match>

      <Match when={status() === ProcessStatus.RUNNING}>
        <button
          type="button"
          class="btn btn-error btn-circle btn-sm"
          onClick={() => stopProcess(props.processName)}
        >
          <Square size={16} />
        </button>
      </Match>

      <Match when={status() === ProcessStatus.RESTARTING}>
        <button
          type="button"
          class="btn btn-warning btn-circle btn-sm"
          onClick={() => stopProcess(props.processName)}
          title="Cancel restart"
        >
          <Square size={16} />
        </button>
      </Match>

      <Match when={status() === ProcessStatus.STOPPING}>
        <button type="button" class="btn btn-error btn-circle btn-sm" disabled>
          <span class="loading loading-spinner" />
        </button>
      </Match>
    </Switch>
  );
};
