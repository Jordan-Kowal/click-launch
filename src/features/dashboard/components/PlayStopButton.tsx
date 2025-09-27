import { Play, Square } from "lucide-solid";
import { Match, Switch } from "solid-js";
import { useProcessContext } from "../contexts/";
import { ProcessStatus } from "../enums";

export const PlayStopButton = () => {
  const { status, startProcess, stopProcess } = useProcessContext();

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
          onClick={startProcess}
        >
          <Play size={16} />
        </button>
      </Match>

      <Match when={status() === ProcessStatus.STARTING}>
        <button type="button" class="btn btn-primary btn-circle btn-sm">
          <span class="loading loading-spinner" />
        </button>
      </Match>

      <Match when={status() === ProcessStatus.RUNNING}>
        <button
          type="button"
          class="btn btn-error btn-circle btn-sm"
          onClick={stopProcess}
        >
          <Square size={16} />
        </button>
      </Match>

      <Match when={status() === ProcessStatus.STOPPING}>
        <button type="button" class="btn btn-error btn-circle btn-sm">
          <span class="loading loading-spinner" />
        </button>
      </Match>
    </Switch>
  );
};
