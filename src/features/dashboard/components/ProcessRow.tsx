import { Play, ScrollText } from "lucide-react";
import { memo } from "react";
import type { ProcessConfig } from "@/types/electron";

type ProcessRowProps = {
  process: ProcessConfig;
};

const ProcessRow: React.FC<ProcessRowProps> = memo(({ process }) => {
  const { name, base_command } = process;

  const handlePlay = () => {};
  const handleLogs = () => {};

  return (
    <tr className="hover:bg-gray-100" data-testid="process-row">
      <td className="align-middle">
        <div className="flex flex-col gap-0">
          <div>{name}</div>
          <div className="text-xs italic text-gray-400">{base_command}</div>
        </div>
      </td>
      <td className="align-middle">
        <div className="flex align-start">
          <div className="badge badge-primary">Running</div>
        </div>
      </td>
      <td className="align-middle">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePlay}
            type="button"
            className="btn btn-primary btn-circle btn-sm"
          >
            <Play size={16} />
          </button>
          <button
            onClick={handleLogs}
            type="button"
            className="btn btn-neutral btn-circle btn-outline btn-sm"
          >
            <ScrollText size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
});

export { ProcessRow };
