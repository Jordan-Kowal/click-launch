import { ChevronDown, ChevronUp, ScrollText } from "lucide-react";
import { memo, useCallback, useMemo, useState } from "react";
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

export const ProcessRowWrapper: React.FC<ProcessRowWrapperProps> = memo(
  ({ process, index, rootDirectory }) => {
    const [modalIsOpen, setModalIsOpen] = useState(false);

    const openModal = useCallback(() => {
      setModalIsOpen(true);
    }, []);

    const closeModal = useCallback(() => {
      setModalIsOpen(false);
    }, []);

    return (
      <ProcessProvider process={process} rootDirectory={rootDirectory}>
        <ProcessRow index={index} openModal={openModal} />
        <ProcessLogModal isOpen={modalIsOpen} onClose={closeModal} />
      </ProcessProvider>
    );
  },
);

type ProcessRowProps = {
  index: number;
  openModal: () => void;
};

const ProcessRow: React.FC<ProcessRowProps> = memo(({ index, openModal }) => {
  const { name, command, args, status, startTime } = useProcessContext();
  const [showOptions, setShowOptions] = useState(false);

  const toggleOptions = useCallback(
    () => setShowOptions(!showOptions),
    [showOptions],
  );

  const statusVariant = useMemo(() => {
    switch (status) {
      case ProcessStatus.STARTING:
      case ProcessStatus.RUNNING:
      case ProcessStatus.STOPPING:
        return "badge-primary";
      case ProcessStatus.STOPPED:
        return "badge-ghost";
      case ProcessStatus.CRASHED:
        return "badge-error";
      default:
        return "badge-neutral";
    }
  }, [status]);

  const button = useMemo(
    () => (
      <button
        type="button"
        className="btn btn-link btn-xs self-start text-primary pl-0 ml-0"
        onClick={toggleOptions}
      >
        {showOptions ? "Hide options" : "Show options"}
        {showOptions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
    ),
    [toggleOptions, showOptions],
  );

  const hasOptions = args && args.length > 0;

  return (
    <tr
      data-testid={`process-row-${index}`}
      className={`${index % 2 !== 0 ? "bg-neutral-100" : ""}`}
    >
      <td className="align-top w-auto min-w-0 !p-2">
        <div className="flex flex-col gap-2 min-w-0">
          <div className="flex flex-col gap-0 min-w-0">
            <div className="truncate" data-testid="process-name">
              {name}
            </div>
            <div
              className="text-xs italic text-gray-400 truncate"
              data-testid="process-command"
            >
              {command}
            </div>
            {hasOptions && button}
          </div>
          {hasOptions && (
            <div
              className={`flex flex-col gap-2 ${!showOptions ? "hidden" : ""}`}
              data-testid={`process-options-${index}`}
            >
              {args!.map((arg) => (
                <ProcessArg key={arg.name} argConfig={arg} />
              ))}
            </div>
          )}
        </div>
      </td>
      <td className="align-top w-32 flex-shrink-0 !p-2">
        <div className="flex flex-col items-start gap-1">
          <div className={`badge ${statusVariant}`}>{status}</div>
          <ProcessDuration
            startTime={startTime}
            isRunning={status === ProcessStatus.RUNNING}
          />
        </div>
      </td>
      <td className="align-top w-32 flex-shrink-0 !p-2">
        <div className="flex items-center gap-2">
          <PlayStopButton />
          <button
            type="button"
            className="btn btn-neutral btn-circle btn-outline btn-sm"
            data-testid="logs-button"
            onClick={openModal}
            title="View logs"
          >
            <ScrollText size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
});
