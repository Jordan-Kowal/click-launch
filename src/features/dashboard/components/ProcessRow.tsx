import { ChevronDown, ChevronUp, ScrollText } from "lucide-solid";
import { createMemo, createSignal, For, Show } from "solid-js";
import { useSettingsContext } from "@/contexts";
import type { ProcessConfig } from "@/electron/types";
import { useDashboardContext } from "../contexts/";
import { ProcessStatus } from "../enums";
import { PlayStopButton } from "./PlayStopButton";
import { ProcessArg } from "./ProcessArg";
import { ProcessDuration } from "./ProcessDuration";
import { ProcessEnvVar } from "./ProcessEnvVar";
import { ProcessResources } from "./ProcessResources";

type ProcessRowProps = {
  process: ProcessConfig;
  index: number;
  rootDirectory: string;
  onOpenModal: (processName: string) => void;
};

export const ProcessRow = (props: ProcessRowProps) => {
  const {
    getProcessCommand,
    getProcessArgs,
    getProcessEnv,
    getProcessStatus,
    getProcessStartTime,
    getProcessData,
    getProcessResources,
  } = useDashboardContext();
  const { settings } = useSettingsContext();
  const command = () => getProcessCommand(props.process.name);
  const args = () => getProcessArgs(props.process.name);
  const env = () => getProcessEnv(props.process.name);
  const envEntries = () => Object.entries(env() ?? {});
  const status = () => getProcessStatus(props.process.name);
  const startTime = () => getProcessStartTime(props.process.name);
  const processData = () => getProcessData(props.process.name);
  const resources = () => getProcessResources(props.process.name);
  const envSummary = createMemo(() => {
    const data = processData();
    if (!data) return "";
    return Object.entries(data.envValues)
      .filter(([_, v]) => v !== "")
      .map(([k, v]) => `${k}=${v}`)
      .join(" ");
  });
  const [showOptions, setShowOptions] = createSignal(false);

  const toggleOptions = () => setShowOptions(!showOptions());
  const openModal = () => props.onOpenModal(props.process.name);

  const statusVariant = createMemo(() => {
    switch (status()) {
      case ProcessStatus.STARTING:
      case ProcessStatus.RUNNING:
        return "badge-primary";
      case ProcessStatus.RESTARTING:
        return "badge-warning";
      case ProcessStatus.CRASHED:
        return "badge-error";
      case ProcessStatus.STOPPED:
      case ProcessStatus.STOPPING:
        return "badge-neutral";
    }
  });

  const statusText = createMemo(() => {
    const currentStatus = status();
    if (currentStatus === ProcessStatus.RESTARTING) {
      const data = processData();
      if (data) {
        return `Restart (${data.retryCount}/${data.maxRetries})`;
      }
    }
    return currentStatus;
  });

  const button = createMemo(() => (
    <button
      type="button"
      class="btn btn-link btn-xs self-start text-primary pl-0 ml-0"
      onClick={toggleOptions}
    >
      {showOptions() ? "Hide options" : "Show options"}
      {showOptions() ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
    </button>
  ));

  const hasArgs = () => (args()?.length ?? 0) > 0;
  const hasEnv = () => envEntries().length > 0;
  const hasOptions = () => hasArgs() || hasEnv();

  return (
    <tr class={`${props.index % 2 !== 0 ? "bg-base-200" : ""}`}>
      <td class="align-top w-auto min-w-0 p-2!">
        <div class="flex flex-col gap-2 min-w-0">
          <div class="flex flex-col gap-0 min-w-0">
            <div class="truncate font-bold">{props.process.name}</div>
            <div class="text-xs italic text-gray-400 whitespace-pre-wrap wrap-break-word">
              {command()}
            </div>
            <Show when={envSummary()}>
              <div class="text-xs italic text-gray-400 whitespace-pre-wrap wrap-break-word">
                {envSummary()}
              </div>
            </Show>
            <Show when={hasOptions()}>{button()}</Show>
          </div>
          <Show when={hasOptions()}>
            <div
              class={`flex flex-col gap-2 ${!showOptions() ? "hidden" : ""}`}
            >
              <For each={args()!}>
                {(arg) => (
                  <ProcessArg
                    processName={props.process.name}
                    argConfig={arg}
                  />
                )}
              </For>
              <Show when={hasEnv()}>
                <Show when={hasArgs()}>
                  <div class="divider divider-start my-0 text-xs opacity-60">
                    Env
                  </div>
                </Show>
                <For each={envEntries()}>
                  {([key, defaultValue]) => (
                    <ProcessEnvVar
                      processName={props.process.name}
                      envKey={key}
                      defaultValue={defaultValue}
                    />
                  )}
                </For>
              </Show>
            </div>
          </Show>
        </div>
      </td>
      <td class="align-top w-32 shrink-0 p-2!">
        <div class="flex flex-col items-start gap-1">
          <div class={`badge ${statusVariant()}`}>{statusText()}</div>
          <ProcessDuration
            startTime={startTime()}
            isRunning={
              status() === ProcessStatus.RUNNING ||
              status() === ProcessStatus.RESTARTING
            }
          />
        </div>
      </td>
      <Show when={settings().showResourceMonitor}>
        <td class="align-top w-32 shrink-0 p-2!">
          <ProcessResources
            resources={resources()}
            isRunning={
              status() === ProcessStatus.RUNNING ||
              status() === ProcessStatus.RESTARTING
            }
          />
        </td>
      </Show>
      <td class="align-top w-32 shrink-0 p-2!">
        <div class="flex items-center gap-2">
          <PlayStopButton processName={props.process.name} />
          <button
            type="button"
            class="btn btn-circle btn-outline btn-sm"
            onClick={openModal}
            title="View logs"
          >
            <ScrollText size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
};
