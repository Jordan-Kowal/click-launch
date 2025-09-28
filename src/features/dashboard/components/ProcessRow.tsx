import { ChevronDown, ChevronUp, ScrollText } from "lucide-solid";
import { createMemo, createSignal, For, Show } from "solid-js";
import type { ProcessConfig } from "@/electron/types";
import { ProcessProvider, useProcessContext } from "../contexts/";
import { ProcessStatus } from "../enums";
import { PlayStopButton } from "./PlayStopButton";
import { ProcessArg } from "./ProcessArg";
import { ProcessDuration } from "./ProcessDuration";
import { ProcessLogModal } from "./ProcessLogModal";

type ProcessRowWrapperProps = {
  process: ProcessConfig;
  index: number;
  rootDirectory: string;
};

export const ProcessRowWrapper = (props: ProcessRowWrapperProps) => {
  const [modalIsOpen, setModalIsOpen] = createSignal(false);

  const openModal = () => {
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
  };

  return (
    <ProcessProvider
      process={props.process}
      rootDirectory={props.rootDirectory}
    >
      <ProcessRow index={props.index} openModal={openModal} />
      <ProcessLogModal isOpen={modalIsOpen()} onClose={closeModal} />
    </ProcessProvider>
  );
};

type ProcessRowProps = {
  index: number;
  openModal: () => void;
};

const ProcessRow = (props: ProcessRowProps) => {
  const { name, command, args, status, startTime } = useProcessContext();
  const [showOptions, setShowOptions] = createSignal(false);

  const toggleOptions = () => setShowOptions(!showOptions());

  const statusVariant = createMemo(() => {
    switch (status()) {
      case ProcessStatus.STARTING:
      case ProcessStatus.RUNNING:
      case ProcessStatus.STOPPING:
        return "badge-primary";
      case ProcessStatus.STOPPED:
      case ProcessStatus.CRASHED:
        return "badge-error";
      default:
        return "badge-ghost";
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

  const hasOptions = () => args && args.length > 0;

  return (
    <tr class={`${props.index % 2 !== 0 ? "bg-base-200" : ""}`}>
      <td class="align-top w-auto min-w-0 !p-2">
        <div class="flex flex-col gap-2 min-w-0">
          <div class="flex flex-col gap-0 min-w-0">
            <div class="truncate font-bold">{name}</div>
            <div class="text-xs italic text-gray-400 truncate">{command()}</div>
            <Show when={hasOptions()}>{button()}</Show>
          </div>
          <Show when={hasOptions()}>
            <div
              class={`flex flex-col gap-2 ${!showOptions() ? "hidden" : ""}`}
            >
              <For each={args!}>{(arg) => <ProcessArg argConfig={arg} />}</For>
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
          <PlayStopButton />
          <button
            type="button"
            class="btn btn-circle btn-outline btn-sm"
            onClick={props.openModal}
            title="View logs"
          >
            <ScrollText size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
};
