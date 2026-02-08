import { ChevronDown, ChevronRight, Play, Square } from "lucide-solid";
import { createMemo, Show } from "solid-js";
import { useDashboardContext } from "../contexts/";

type ProcessGroupHeaderProps = {
  groupName: string;
  totalCount: number;
};

export const ProcessGroupHeader = (props: ProcessGroupHeaderProps) => {
  const {
    isGroupCollapsed,
    toggleGroupCollapsed,
    getGroupRunningCount,
    startGroup,
    stopGroup,
  } = useDashboardContext();

  const collapsed = () => isGroupCollapsed(props.groupName);
  const runningCount = () => getGroupRunningCount(props.groupName);

  const hasRunning = createMemo(() => runningCount() > 0);
  const hasStopped = createMemo(() => runningCount() < props.totalCount);

  return (
    <tr class="bg-base-300">
      <td colspan="4" class="p-2!">
        <div class="flex items-center justify-between">
          <button
            type="button"
            class="btn btn-ghost btn-sm gap-2 px-1"
            onClick={() => toggleGroupCollapsed(props.groupName)}
          >
            <Show when={collapsed()} fallback={<ChevronDown size={16} />}>
              <ChevronRight size={16} />
            </Show>
            <span>{props.groupName}</span>
            <span class="badge badge-sm badge-neutral">
              {runningCount()}/{props.totalCount} running
            </span>
          </button>
          <div class="flex items-center gap-1">
            <Show when={hasStopped()}>
              <button
                type="button"
                class="btn btn-primary btn-xs"
                onClick={() => startGroup(props.groupName)}
                title="Start all in group"
              >
                <Play size={12} />
                Start All
              </button>
            </Show>
            <Show when={hasRunning()}>
              <button
                type="button"
                class="btn btn-error btn-xs"
                onClick={() => stopGroup(props.groupName)}
                title="Stop all in group"
              >
                <Square size={12} />
                Stop All
              </button>
            </Show>
          </div>
        </div>
      </td>
    </tr>
  );
};
