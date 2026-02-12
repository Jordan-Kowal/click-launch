import type { VirtualItem, Virtualizer } from "@tanstack/solid-virtual";
import { ArrowDown } from "lucide-solid";
import { type Accessor, For, Show } from "solid-js";
import type { LogWithId } from "../hooks/useLogStore";
import { ProcessLogRow } from "./ProcessLogRow";

type LogVirtualListProps = {
  currentLogs: () => LogWithId[];
  displayedLogs: () => LogWithId[];
  searchTerm: string;
  isRegexMode: boolean;
  selectedLogId: Accessor<string | null>;
  isAtBottom: Accessor<boolean>;
  virtualizer: Virtualizer<HTMLDivElement, Element>;
  setLogsContainerRef: (el: HTMLDivElement) => void;
  onScrollToBottom: () => void;
};

export const LogVirtualList = (props: LogVirtualListProps) => {
  return (
    <div class="flex-1 overflow-hidden bg-gray-900 relative">
      <div
        ref={props.setLogsContainerRef}
        class="h-full overflow-y-auto p-4 bg-gray-900 text-white"
      >
        <Show
          when={props.currentLogs().length > 0}
          fallback={
            <div class="flex items-center justify-center h-full text-gray-400">
              No logs yet
            </div>
          }
        >
          <div
            class="font-mono text-sm pl-1 w-full"
            style={{
              "padding-top": `${(props.virtualizer.getVirtualItems() as VirtualItem[])[0]?.start ?? 0}px`,
              "padding-bottom": `${(() => {
                const items =
                  props.virtualizer.getVirtualItems() as VirtualItem[];
                const lastItem = items[items.length - 1];
                if (!lastItem) return 0;
                return props.virtualizer.getTotalSize() - lastItem.end;
              })()}px`,
            }}
          >
            <For each={props.virtualizer.getVirtualItems() as VirtualItem[]}>
              {(virtualRow) => {
                const log = () => props.displayedLogs()[virtualRow.index];
                const isCurrentMatch = () =>
                  props.selectedLogId() === log()?.id;

                return (
                  <div
                    ref={props.virtualizer.measureElement}
                    data-index={virtualRow.index}
                  >
                    <Show when={log()}>
                      <ProcessLogRow
                        log={log()!}
                        searchTerm={props.searchTerm}
                        isRegexMode={props.isRegexMode}
                        isCurrentMatch={isCurrentMatch()}
                      />
                    </Show>
                  </div>
                );
              }}
            </For>
          </div>
        </Show>
      </div>
      <Show when={!props.isAtBottom()}>
        <button
          type="button"
          class="btn btn-circle btn-primary absolute bottom-3 right-6 shadow-lg"
          onClick={props.onScrollToBottom}
          title="Scroll to bottom"
        >
          <ArrowDown size={20} />
        </button>
      </Show>
    </div>
  );
};
