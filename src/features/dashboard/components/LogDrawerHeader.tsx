import { ArrowLeft, X } from "lucide-solid";
import { Match, Switch } from "solid-js";
import { useDashboardContext } from "../contexts";
import { isProcessActive, ProcessStatus } from "../enums";
import { PlayStopButton } from "./PlayStopButton";
import { ProcessResources } from "./ProcessResources";

type LogDrawerHeaderProps = {
  processName: string;
  onClose: () => void;
};

export const LogDrawerHeader = (props: LogDrawerHeaderProps) => {
  const { getProcessStatus, getProcessData, getProcessResources } =
    useDashboardContext();

  const processStatus = () => getProcessStatus(props.processName);
  const processData = () => getProcessData(props.processName);
  const resources = () => getProcessResources(props.processName);
  const isRunning = () => isProcessActive(processStatus());

  return (
    <div class="px-4 py-2 border-b border-base-300">
      <div class="flex flex-row items-center gap-2">
        <button
          type="button"
          class="btn btn-ghost btn-circle btn-sm no-drag"
          onClick={props.onClose}
        >
          <ArrowLeft size={20} />
        </button>
        <h3 class="font-bold m-0!">Logs - {props.processName}</h3>
        <PlayStopButton processName={props.processName} />
        <Switch>
          <Match when={processStatus() === ProcessStatus.RUNNING}>
            <div class="badge badge-primary">Running</div>
          </Match>
          <Match when={processStatus() === ProcessStatus.RESTARTING}>
            <div class="badge badge-warning">
              Restart ({processData()?.retryCount ?? 0}/
              {processData()?.maxRetries ?? 3})
            </div>
          </Match>
          <Match when={processStatus() === ProcessStatus.CRASHED}>
            <div class="badge badge-error">Crashed</div>
          </Match>
          <Match when={true}>
            <div class="badge badge-neutral">Idle</div>
          </Match>
        </Switch>
        <ProcessResources resources={resources()} isRunning={isRunning()} />
      </div>
      <button
        type="button"
        class="btn btn-sm btn-circle absolute right-4 top-8"
        onClick={props.onClose}
      >
        <X size={16} />
      </button>
    </div>
  );
};
