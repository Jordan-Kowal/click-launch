import { ArrowLeft, X } from "lucide-solid";
import { type JSX, Match, Switch } from "solid-js";
import { useDashboardContext } from "../contexts";
import { ProcessStatus } from "../enums";
import { ProcessActions } from "./ProcessActions";

type ProcessDrawerHeaderProps = {
  title: string;
  processName: string;
  onClose: () => void;
  children?: JSX.Element;
};

export const ProcessDrawerHeader = (props: ProcessDrawerHeaderProps) => {
  const { getProcessStatus, getProcessData } = useDashboardContext();
  const status = () => getProcessStatus(props.processName);
  const processData = () => getProcessData(props.processName);

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
        <h3 class="font-bold m-0!">
          {props.title} - {props.processName}
        </h3>
        <ProcessActions processName={props.processName} />
        <Switch>
          <Match when={status() === ProcessStatus.RUNNING}>
            <div class="badge badge-primary">Running</div>
          </Match>
          <Match when={status() === ProcessStatus.RESTARTING}>
            <div class="badge badge-warning">
              Restart ({processData()?.retryCount ?? 0}/
              {processData()?.maxRetries ?? 3})
            </div>
          </Match>
          <Match when={status() === ProcessStatus.CRASHED}>
            <div class="badge badge-error">Crashed</div>
          </Match>
          <Match when={true}>
            <div class="badge badge-neutral">Idle</div>
          </Match>
        </Switch>
        {props.children}
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
