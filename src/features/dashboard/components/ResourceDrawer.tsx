import { createEffect, onCleanup, Show } from "solid-js";
import { NAVBAR_HEIGHT } from "@/components/layout/constants";
import { useSettingsContext } from "@/contexts";
import { formatBytes, formatCpu } from "@/utils/formatters";
import { useDashboardContext } from "../contexts";
import { ProcessDrawerHeader } from "./ProcessDrawerHeader";
import { ResourceChart } from "./ResourceChart";

type ResourceDrawerProps = {
  processName: string;
  isOpen: boolean;
  onClose: () => void;
};

export const ResourceDrawer = (props: ResourceDrawerProps) => {
  const { getProcessResourceHistory } = useDashboardContext();
  const { settings } = useSettingsContext();

  const history = () => getProcessResourceHistory(props.processName);
  const theme = () => settings().theme;
  const hasData = () => history().length > 0;
  const latestEntry = () => {
    const h = history();
    return h.length > 0 ? h[h.length - 1] : null;
  };

  createEffect(() => {
    if (!props.isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") props.onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    onCleanup(() => window.removeEventListener("keydown", handleKeyDown));
  });

  return (
    <div class="drawer-side">
      <button
        type="button"
        class="drawer-overlay"
        onClick={props.onClose}
        aria-label="Close drawer"
      />
      <div
        class="w-[95vw] h-full bg-base-100 flex flex-col relative overflow-y-auto"
        style={{ "padding-top": `${NAVBAR_HEIGHT + 4}px` }}
      >
        <ProcessDrawerHeader
          title="Resources"
          processName={props.processName}
          onClose={props.onClose}
        />
        <Show
          when={hasData()}
          fallback={
            <div class="flex-1 flex items-center justify-center">
              <p class="text-base-content/50 text-lg">
                No resource data available yet. Start the process to begin
                collecting metrics.
              </p>
            </div>
          }
        >
          <div class="flex flex-col flex-1 min-h-0 p-4 gap-4">
            <Show when={latestEntry()}>
              {(entry) => (
                <div class="flex justify-center">
                  <div class="stats shadow">
                    <div class="stat place-items-center">
                      <div class="stat-title">CPU</div>
                      <div class="stat-value text-info text-2xl">
                        {formatCpu(entry().cpu)}
                      </div>
                    </div>
                    <div class="stat place-items-center">
                      <div class="stat-title">Memory</div>
                      <div class="stat-value text-success text-2xl">
                        {formatBytes(entry().memoryBytes)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Show>
            <div class="rounded-box bg-base-200 p-2 flex-1 flex flex-col min-h-0">
              <ResourceChart
                history={history}
                theme={theme}
                historyMinutes={() => settings().resourceHistoryMinutes}
              />
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
};
