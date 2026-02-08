import { createMemo, Show } from "solid-js";
import type { ProcessResourceData } from "@/electron/types";
import { formatBytes, formatCpu } from "@/utils/formatters";

type ProcessResourcesProps = {
  resources: ProcessResourceData | undefined;
  isRunning: boolean;
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
    <Show
      when={props.isRunning && cpu() && memory()}
      fallback={
        <div class="flex flex-col gap-0">
          <div class="text-xs text-gray-500 font-mono whitespace-nowrap">
            CPU: —
          </div>
          <div class="text-xs text-gray-500 font-mono whitespace-nowrap">
            RAM: —
          </div>
        </div>
      }
    >
      <div class="flex flex-col gap-0">
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
      </div>
    </Show>
  );
};
