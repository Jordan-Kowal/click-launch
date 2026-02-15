import { createEffect, onCleanup, Show } from "solid-js";
import { useSettingsContext } from "@/contexts";
import { formatBytes, formatCpu } from "@/utils/formatters";
import { useDashboardContext } from "../contexts";
import { LightweightResourceChart } from "./LightweightResourceChart";
import { ResourceDrawerHeader } from "./ResourceDrawerHeader";

type ResourceDrawerProps = {
  processName: string;
  isOpen: boolean;
  onClose: () => void;
};

export const ResourceDrawer = (props: ResourceDrawerProps) => {
  const {
    getProcessResourceHistory,
    getProcessSessionPeaks,
    getProcessWindowPeaks,
  } = useDashboardContext();
  const { settings } = useSettingsContext();

  const history = () => getProcessResourceHistory(props.processName);
  const theme = () => settings().theme;
  const hasData = () => history().length > 0;
  const sessionPeaks = () => getProcessSessionPeaks(props.processName);
  const windowPeaks = () => getProcessWindowPeaks(props.processName);

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
      <div class="w-[95vw] h-full bg-base-100 flex flex-col pt-6 relative overflow-y-auto">
        <ResourceDrawerHeader
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
            <div class="flex justify-center">
              <div class="stats shadow">
                <Show when={windowPeaks()}>
                  {(peaks) => (
                    <>
                      <div class="stat place-items-center">
                        <div class="stat-title">
                          CPU peak ({settings().resourceHistoryMinutes}min)
                        </div>
                        <div class="stat-value text-info text-2xl">
                          {formatCpu(peaks().cpu)}
                        </div>
                      </div>
                      <div class="stat place-items-center">
                        <div class="stat-title">
                          Mem peak ({settings().resourceHistoryMinutes}min)
                        </div>
                        <div class="stat-value text-success text-2xl">
                          {formatBytes(peaks().memoryBytes)}
                        </div>
                      </div>
                    </>
                  )}
                </Show>
                <Show when={sessionPeaks()}>
                  {(peaks) => (
                    <>
                      <div class="stat place-items-center">
                        <div class="stat-title">CPU peak (session)</div>
                        <div class="stat-value text-info text-2xl">
                          {formatCpu(peaks().cpu)}
                        </div>
                      </div>
                      <div class="stat place-items-center">
                        <div class="stat-title">Mem peak (session)</div>
                        <div class="stat-value text-success text-2xl">
                          {formatBytes(peaks().memoryBytes)}
                        </div>
                      </div>
                    </>
                  )}
                </Show>
              </div>
            </div>
            <div class="rounded-box bg-base-200 p-2">
              <LightweightResourceChart history={history} theme={theme} />
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
};
