import { ChevronDown, ChevronUp, Search, Trash2, X } from "lucide-solid";
import { createEffect, createSignal, For, onCleanup, Show } from "solid-js";
import { LogType } from "@/electron/enums";
import type { ProcessLogData } from "@/electron/types";
import { useProcessContext } from "../contexts";
import { ProcessLogRow } from "./ProcessLogRow";

type ProcessLogModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const MAX_LOGS = 1000; // Limit to prevent memory issues

export const ProcessLogModal = (props: ProcessLogModalProps) => {
  const { name: processName, processId } = useProcessContext();

  const [logs, setLogs] = createSignal<ProcessLogData[]>([]);
  const [search, setSearch] = createSignal("");
  const [currentMatchIndex, setCurrentMatchIndex] = createSignal(-1);
  const [matchingLogIndices, setMatchingLogIndices] = createSignal<number[]>(
    [],
  );
  const [autoScroll, setAutoScroll] = createSignal(true);
  const [wrapLines, setWrapLines] = createSignal(true);
  const [isPaused, setIsPaused] = createSignal(false);

  let logsContainerRef!: HTMLDivElement;
  const logRefs = new Map<number, HTMLElement>();

  const addLog = (logData: ProcessLogData) => {
    if (isPaused()) return;
    setLogs((prev) => {
      const newLogs = [...prev, logData];
      // Use circular buffer to prevent memory issues
      return newLogs.length > MAX_LOGS ? newLogs.slice(-MAX_LOGS) : newLogs;
    });
  };

  // Auto-scroll to bottom when new logs are added or modal opens
  createEffect(() => {
    if (autoScroll() && logsContainerRef) {
      // Small delay to ensure DOM is rendered
      setTimeout(() => {
        if (logsContainerRef) {
          logsContainerRef.scrollTop = logsContainerRef.scrollHeight;
        }
      }, 100);
    }
  });

  const clearLogs = () => {
    setLogs([]);
    setSearch("");
    setCurrentMatchIndex(-1);
    setMatchingLogIndices([]);
  };

  const onSearchChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    setSearch(target.value);
  };

  // Update matching indices when search term or logs change
  createEffect(() => {
    const searchTerm = search();
    const logsList = logs();

    if (!searchTerm.trim()) {
      setMatchingLogIndices([]);
      setCurrentMatchIndex(-1);
      return;
    }

    const matches: number[] = [];
    logsList.forEach((log, index) => {
      if (log.type === LogType.EXIT) return;
      if (log.output.toLowerCase().includes(searchTerm.toLowerCase())) {
        matches.push(index);
      }
    });
    setMatchingLogIndices(matches);
    setCurrentMatchIndex(matches.length > 0 ? 0 : -1);
  });

  // Navigate to specific match using refs
  const goToMatch = (matchIndex: number) => {
    const indices = matchingLogIndices();
    if (
      indices.length === 0 ||
      matchIndex < 0 ||
      matchIndex >= indices.length
    ) {
      return;
    }
    const logIndex = indices[matchIndex];
    const logElement = logRefs.get(logIndex);
    if (logElement && logsContainerRef) {
      logElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    setCurrentMatchIndex(matchIndex);
  };

  const goToNextMatch = () => {
    const indices = matchingLogIndices();
    if (indices.length === 0) return;
    const nextIndex =
      currentMatchIndex() < indices.length - 1 ? currentMatchIndex() + 1 : 0;
    goToMatch(nextIndex);
  };

  const goToPrevMatch = () => {
    const indices = matchingLogIndices();
    if (indices.length === 0) return;
    const prevIndex =
      currentMatchIndex() > 0 ? currentMatchIndex() - 1 : indices.length - 1;
    goToMatch(prevIndex);
  };

  // Moves to next or previous match using Enter key
  const handleSearchKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.shiftKey ? goToPrevMatch() : goToNextMatch();
    }
  };

  // Listen for logs
  createEffect(() => {
    const pid = processId();
    if (!pid) return;

    window.electronAPI.onProcessLog((logData) => {
      if (logData.processId !== pid) return;
      addLog(logData);
    });

    onCleanup(() => {
      if (window.electronAPI) {
        window.electronAPI.removeProcessLogListener();
      }
    });
  });

  return (
    <dialog class="modal" open={props.isOpen}>
      <div class="modal-box w-full max-w-[100vw] h-full max-h-[100vh] flex flex-col p-0">
        {/* Header */}
        <div class="flex items-center justify-between p-4">
          <h2 class="font-bold text-xl !mb-0">Logs - {processName}</h2>
          <button
            type="button"
            class="btn btn-sm btn-circle relative -top-4"
            onClick={props.onClose}
          >
            <X size={16} />
          </button>
        </div>

        {/* Search and options */}
        <div class="p-4 border-b border-t border-base-300 gap-4 flex flex-col">
          <div class="flex items-center gap-2">
            <div class="relative flex-1">
              <label class="input w-full">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search logs... (Enter: next, Shift+Enter: prev)"
                  class="grow w-full"
                  value={search()}
                  onInput={onSearchChange}
                  onKeyDown={handleSearchKeyDown}
                />
              </label>
            </div>
            <Show when={search() && matchingLogIndices().length > 0}>
              <div class="flex items-center gap-1">
                <span class="text-sm text-gray-500">
                  {currentMatchIndex() + 1} / {matchingLogIndices().length}
                </span>
                <button
                  type="button"
                  class="btn btn-xs btn-ghost"
                  onClick={goToPrevMatch}
                  title="Previous match (Shift+Enter)"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  type="button"
                  class="btn btn-xs btn-ghost"
                  onClick={goToNextMatch}
                  title="Next match (Enter)"
                >
                  <ChevronDown size={14} />
                </button>
              </div>
            </Show>
          </div>

          {/* Options */}
          <div class="flex items-center gap-4 text-sm">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                class="checkbox checkbox-sm checkbox-primary"
                checked={autoScroll()}
                onChange={(e) =>
                  setAutoScroll((e.target as HTMLInputElement).checked)
                }
              />
              Auto-scroll to latest
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                class="checkbox checkbox-sm checkbox-primary"
                checked={wrapLines()}
                onChange={(e) =>
                  setWrapLines((e.target as HTMLInputElement).checked)
                }
              />
              Wrap long lines
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                class="checkbox checkbox-sm checkbox-primary"
                checked={isPaused()}
                onChange={(e) =>
                  setIsPaused((e.target as HTMLInputElement).checked)
                }
              />
              Pause updates
            </label>
            <button
              type="button"
              class="btn btn-outline btn-error btn-sm"
              onClick={clearLogs}
              title="Clear logs"
            >
              <Trash2 size={16} />
              Clear logs
            </button>
          </div>
        </div>

        {/* Logs content */}
        <div class="flex-1 overflow-hidden bg-gray-900">
          <div
            ref={logsContainerRef!}
            class="h-full overflow-y-auto p-4 bg-gray-900 text-white"
          >
            <Show
              when={logs().length > 0}
              fallback={
                <div class="flex items-center justify-center h-full text-gray-400">
                  No logs yet
                </div>
              }
            >
              <div
                class={`font-mono text-sm space-y-1 ${wrapLines() ? "" : "overflow-x-auto"}`}
              >
                <For each={logs()}>
                  {(log, index) => {
                    const isCurrentMatch = () =>
                      currentMatchIndex() >= 0 &&
                      matchingLogIndices()[currentMatchIndex()] === index();

                    return (
                      <ProcessLogRow
                        log={log}
                        index={index()}
                        searchTerm={search()}
                        isCurrentMatch={isCurrentMatch()}
                        wrapLines={wrapLines()}
                        ref={(el: HTMLDivElement | undefined) => {
                          if (el) {
                            logRefs.set(index(), el);
                          } else {
                            logRefs.delete(index());
                          }
                        }}
                      />
                    );
                  }}
                </For>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </dialog>
  );
};
