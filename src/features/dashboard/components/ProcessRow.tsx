import { ChevronDown, ChevronUp, ScrollText } from "lucide-solid";
import { createMemo, createSignal, For, Show } from "solid-js";
import type { ProcessConfig } from "@/electron/types";
import { useDashboardContext } from "../contexts/";
import { ProcessStatus } from "../enums";
import { PlayStopButton } from "./PlayStopButton";
import { ProcessArg } from "./ProcessArg";
import { ProcessDuration } from "./ProcessDuration";
import { ProcessLogModal } from "./ProcessLogModal";

type ProcessRowProps = {
  process: ProcessConfig;
  index: number;
  rootDirectory: string;
};

export const ProcessRow = (props: ProcessRowProps) => {
  const {
    getProcessCommand,
    getProcessArgs,
    getProcessStatus,
    getProcessStartTime,
  } = useDashboardContext();
  const command = () => getProcessCommand(props.process.name);
  const args = () => getProcessArgs(props.process.name);
  const status = () => getProcessStatus(props.process.name);
  const startTime = () => getProcessStartTime(props.process.name);
  const [showOptions, setShowOptions] = createSignal(false);
  const [modalIsOpen, setModalIsOpen] = createSignal(false);

  const toggleOptions = () => setShowOptions(!showOptions());
  const openModal = () => setModalIsOpen(true);
  const closeModal = () => setModalIsOpen(false);

  const statusVariant = createMemo(() => {
    switch (status()) {
      case ProcessStatus.STARTING:
      case ProcessStatus.RUNNING:
        return "badge-primary";
      case ProcessStatus.STOPPED:
      case ProcessStatus.STOPPING:
        return "badge-error";
    }
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

  const hasOptions = () => args() && args()!.length > 0;

  return (
    <>
      <tr class={`${props.index % 2 !== 0 ? "bg-base-200" : ""}`}>
        <td class="align-top w-auto min-w-0 !p-2">
          <div class="flex flex-col gap-2 min-w-0">
            <div class="flex flex-col gap-0 min-w-0">
              <div class="truncate font-bold">{props.process.name}</div>
              <div class="text-xs italic text-gray-400 whitespace-pre-wrap break-words">
                {command()}
              </div>
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
              </div>
            </Show>
          </div>
        </td>
        <td class="align-top w-32 flex-shrink-0 !p-2">
          <div class="flex flex-col items-start gap-1">
            <div class={`badge ${statusVariant()}`}>{status()}</div>
            <ProcessDuration
              startTime={startTime()}
              isRunning={status() === ProcessStatus.RUNNING}
            />
          </div>
        </td>
        <td class="align-top w-32 flex-shrink-0 !p-2">
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
      <ProcessLogModal
        processName={props.process.name}
        isOpen={modalIsOpen()}
        onClose={closeModal}
      />
    </>
  );
};
