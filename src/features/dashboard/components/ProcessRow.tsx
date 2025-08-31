import { ChevronDown, ChevronUp, Play, ScrollText } from "lucide-react";
import { memo, useCallback, useMemo, useState } from "react";
import type { ProcessConfig } from "@/electron/types";
import { ProcessProvider, useProcessContext } from "../contexts/";
import { ProcessArg } from "./ProcessArg";

type ProcessRowWrapperProps = {
  process: ProcessConfig;
  index: number;
};

export const ProcessRowWrapper: React.FC<ProcessRowWrapperProps> = memo(
  ({ process, index }) => {
    return (
      <ProcessProvider process={process}>
        <ProcessRow index={index} />
      </ProcessProvider>
    );
  },
);

type ProcessRowProps = {
  index: number;
};

const ProcessRow: React.FC<ProcessRowProps> = memo(({ index }) => {
  const { name, command, args } = useProcessContext();
  const [showOptions, setShowOptions] = useState(false);

  const toggleOptions = useCallback(
    () => setShowOptions(!showOptions),
    [showOptions],
  );

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

  return (
    <tr className="hover:bg-gray-100" data-testid={`process-row-${index}`}>
      <td className="align-top w-auto min-w-0">
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
            {button}
          </div>
          {showOptions && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-8 mt-2">
              {args.map((arg) => (
                <ProcessArg key={arg.name} argConfig={arg} />
              ))}
            </div>
          )}
        </div>
      </td>
      <td className="align-top w-32 flex-shrink-0">
        <div className="flex align-start">
          <div className="badge badge-primary">Running</div>
        </div>
      </td>
      <td className="align-top w-32 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn btn-primary btn-circle btn-sm"
            data-testid="play-button"
          >
            <Play size={16} />
          </button>
          <button
            type="button"
            className="btn btn-neutral btn-circle btn-outline btn-sm"
            data-testid="logs-button"
          >
            <ScrollText size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
});
