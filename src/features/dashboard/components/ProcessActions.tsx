import { Play, RotateCw, ScrollText, Square } from "lucide-solid";
import { createMemo, createSignal, Match, Show, Switch } from "solid-js";
import { useToast } from "@/hooks";
import { useDashboardContext } from "../contexts/";
import { isProcessActive, ProcessStatus } from "../enums";

type ProcessActionsProps = {
  processName: string;
  onOpenLogs?: () => void;
};

const RESTART_ANIMATION_MS = 500;

export const ProcessActions = (props: ProcessActionsProps) => {
  const { getProcessStatus, startProcess, stopProcess, restartProcess } =
    useDashboardContext();
  const toast = useToast();
  const status = () => getProcessStatus(props.processName);
  const [isRestarting, setIsRestarting] = createSignal(false);

  const canRestart = createMemo(
    () =>
      !isRestarting() &&
      (status() === ProcessStatus.RUNNING ||
        status() === ProcessStatus.RESTARTING),
  );

  const handleRestart = () => {
    setIsRestarting(true);
    restartProcess(props.processName);
    setTimeout(() => {
      setIsRestarting(false);
      toast.success(`${props.processName} restarted`);
    }, RESTART_ANIMATION_MS);
  };

  return (
    <div class="flex items-center gap-2">
      <Switch>
        <Match when={!isProcessActive(status())}>
          <button
            type="button"
            class="btn btn-primary btn-circle btn-sm"
            onClick={() => startProcess(props.processName)}
          >
            <Play size={16} />
          </button>
        </Match>

        <Match
          when={
            status() === ProcessStatus.STARTING ||
            status() === ProcessStatus.STOPPING
          }
        >
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
      </Switch>

      <div
        class={!canRestart() && !isRestarting() ? "tooltip tooltip-bottom" : ""}
        data-tip={
          !canRestart() && !isRestarting()
            ? "Process must be running"
            : undefined
        }
      >
        <button
          type="button"
          class="btn btn-circle btn-outline btn-sm"
          disabled={!canRestart()}
          onClick={handleRestart}
        >
          <Show
            when={!isRestarting()}
            fallback={<span class="loading loading-spinner" />}
          >
            <RotateCw size={16} />
          </Show>
        </button>
      </div>

      <Show when={props.onOpenLogs}>
        {(openLogs) => (
          <button
            type="button"
            class="btn btn-circle btn-outline btn-sm"
            onClick={openLogs()}
            title="View logs"
          >
            <ScrollText size={16} />
          </button>
        )}
      </Show>
    </div>
  );
};
