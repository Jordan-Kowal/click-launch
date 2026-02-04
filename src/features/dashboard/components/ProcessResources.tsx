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

  const cpuColorClass = createMemo(() => {
    if (!props.resources) return "text-base-content";
    if (props.resources.cpu >= 80) return "text-error";
    if (props.resources.cpu >= 50) return "text-warning";
    return "text-base-content";
  });

  const memoryColorClass = createMemo(() => {
    if (!props.resources) return "text-base-content";
    const mb = props.resources.memoryBytes / (1024 * 1024);
    if (mb >= 1024) return "text-error";
    if (mb >= 512) return "text-warning";
    return "text-base-content";
  });

  return (
    <Show
      when={props.isRunning && cpu() && memory()}
      fallback={
        <div class="text-xs text-gray-500 font-mono whitespace-nowrap">
          — / —
        </div>
      }
    >
      <div class="flex flex-col gap-0">
        <div
          class={`text-xs font-mono whitespace-nowrap ${cpuColorClass()}`}
          title="CPU usage"
        >
          {cpu()}
        </div>
        <div
          class={`text-xs font-mono whitespace-nowrap ${memoryColorClass()}`}
          title="Memory usage"
        >
          {memory()}
        </div>
      </div>
    </Show>
  );
};
