import { ChartLine } from "lucide-solid";
import { createMemo, Show } from "solid-js";
import type { ProcessResourceData } from "@/types";
import { formatBytes, formatCpu } from "@/utils/formatters";

type ProcessResourcesProps = {
  resources: ProcessResourceData | undefined;
  isRunning: boolean;
  onViewMore?: () => void;
};

export const ProcessResources = (props: ProcessResourcesProps) => {
  const cpu = createMemo(() => {
    if (!props.isRunning || !props.resources) return null;
    return formatCpu(props.resources.cpu);
  });

  const memory = createMemo(() => {
    if (!props.isRunning || !props.resources) return null;
    return formatBytes(props.resources.memoryBytes);
  });

  return (
    <div class="flex flex-col gap-0">
      <Show
        when={props.isRunning && cpu() && memory()}
        fallback={
          <>
            <div class="text-xs text-base-content/50 font-mono whitespace-nowrap">
              CPU: —
            </div>
            <div class="text-xs text-base-content/50 font-mono whitespace-nowrap">
              RAM: —
            </div>
          </>
        }
      >
        <div
          class="text-xs font-mono whitespace-nowrap text-base-content"
          title="CPU usage"
        >
          CPU: {cpu()}
        </div>
        <div
          class="text-xs font-mono whitespace-nowrap text-base-content"
          title="Memory usage"
        >
          RAM: {memory()}
        </div>
      </Show>
      <Show when={props.onViewMore}>
        <button
          type="button"
          class="btn btn-link btn-xs gap-1 mt-0.5 px-0! self-start"
          onClick={props.onViewMore}
          title="View resource history"
        >
          <ChartLine size={12} />
          <span class="text-xs">View more</span>
        </button>
      </Show>
    </div>
  );
};
