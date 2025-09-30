import { ChevronDown, ChevronUp, Search, Trash2, X } from "lucide-solid";
import { createEffect, createSignal, For, on, onCleanup, Show } from "solid-js";
import { createMutable, createStore } from "solid-js/store";
import { LogType } from "@/electron/enums";
import type { ProcessLogData } from "@/electron/types";
import { useProcessContext } from "../contexts";
import { ProcessLogRow } from "./ProcessLogRow";

type ProcessLogModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const MAX_LOGS = 2_000;
const BATCH_DELAY_MS = 500;
const BATCH_DELAY_MS_AUTO_SCROLL = 100;

export const ProcessLogModal = (props: ProcessLogModalProps) => {
  const { name: processName, processId } = useProcessContext();

  const [uiState, setUiState] = createStore({
    autoScroll: true,
    isPaused: false,
  });

  const [searchState, setSearchState] = createStore({
    term: "",
    currentMatchIndex: -1,
    matchingLogIndices: [] as number[],
  });

  const logs = createMutable<ProcessLogData[]>([]);
  const [pendingLogs, setPendingLogs] = createSignal<ProcessLogData[]>([]);

  let logsContainerRef!: HTMLDivElement;
  const logRefs = new Map<number, HTMLElement>();
  let batchTimer: number | null = null;

  const flushLogs = () => {
    const pending = pendingLogs();
    if (pending.length === 0) return;
    logs.push(...pending);
    if (logs.length > MAX_LOGS) {
      logs.splice(0, logs.length - MAX_LOGS);
    }
    setPendingLogs([]);
  };

  const addLog = (logData: ProcessLogData) => {
    if (uiState.isPaused) return;
    setPendingLogs((prev) => [...prev, logData]);
    // Use shorter batch time when auto-scroll is enabled for better UX
    const batchDelay = uiState.autoScroll
      ? BATCH_DELAY_MS_AUTO_SCROLL
      : BATCH_DELAY_MS;
    // Start batch timer if not already running
    if (batchTimer !== null) return;
    batchTimer = window.setTimeout(() => {
      flushLogs();
      batchTimer = null;
    }, batchDelay);
  };

  const scrollToBottom = () => {
    if (!uiState.autoScroll || !logsContainerRef) return;
    setTimeout(() => {
      if (!logsContainerRef) return;
      logsContainerRef.scrollTo({
        top: logsContainerRef.scrollHeight,
        behavior: "smooth",
      });
    }, 50);
  };

  const clearLogs = () => {
    logs.length = 0;
    setPendingLogs([]);
    setSearchState({
      term: "",
      currentMatchIndex: -1,
      matchingLogIndices: [],
    });
    if (batchTimer !== null) {
      clearTimeout(batchTimer);
      batchTimer = null;
    }
  };

  const onSearchChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    setSearchState("term", target.value);
  };

  // Navigate to specific match using refs
  const goToMatch = (matchIndex: number) => {
    const indices = searchState.matchingLogIndices;
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
    setSearchState("currentMatchIndex", matchIndex);
  };

  const goToNextMatch = () => {
    const indices = searchState.matchingLogIndices;
    if (indices.length === 0) return;
    const nextIndex =
      searchState.currentMatchIndex < indices.length - 1
        ? searchState.currentMatchIndex + 1
        : 0;
    goToMatch(nextIndex);
  };

  const goToPrevMatch = () => {
    const indices = searchState.matchingLogIndices;
    if (indices.length === 0) return;
    const prevIndex =
      searchState.currentMatchIndex > 0
        ? searchState.currentMatchIndex - 1
        : indices.length - 1;
    goToMatch(prevIndex);
  };

  // Moves to next or previous match using Enter key
  const handleSearchKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.shiftKey ? goToPrevMatch() : goToNextMatch();
    }
  };

  // Auto-scroll to bottom when logs are rendered
  createEffect(on(() => logs.length, scrollToBottom));

  // Update matching indices when search term or logs change
  createEffect(() => {
    const searchTerm = searchState.term;

    if (!searchTerm.trim()) {
      setSearchState({
        term: searchTerm,
        matchingLogIndices: [],
        currentMatchIndex: -1,
      });
      return;
    }

    const matches: number[] = [];
    logs.forEach((log, index) => {
      if (log.type === LogType.EXIT) return;
      if (log.output.toLowerCase().includes(searchTerm.toLowerCase())) {
        matches.push(index);
      }
    });

    setSearchState({
      term: searchTerm,
      matchingLogIndices: matches,
      currentMatchIndex: matches.length > 0 ? 0 : -1,
    });
  });

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
      if (batchTimer !== null) {
        clearTimeout(batchTimer);
        flushLogs(); // Flush any remaining logs on cleanup
        batchTimer = null;
      }
    });
  });

  return (
    <dialog class="modal" open={props.isOpen}>
      <div class="modal-box w-full max-w-[100vw] h-full max-h-[100vh] flex flex-col p-0">
        {/* Header */}
        <h2 class="font-bold text-xl !mt-4 !mb-4 text-center">
          Logs - {processName}
        </h2>
        <button
          type="button"
          class="btn btn-sm btn-circle absolute right-3 top-3"
          onClick={props.onClose}
        >
          <X size={16} />
        </button>
        <div class="flex items-center justify-between p-0"></div>
        {/* Search and options */}
        <div class="py-2 px-4 border-b border-t border-base-300 gap-2 flex flex-col md:flex-row md:items-center md:justify-between">
          <div class="flex items-center gap-4 min-h-12">
            <div class="relative w-full md:w-96">
              <label class="input input-sm w-full">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search logs... (Enter: next, Shift+Enter: prev)"
                  class="grow w-full"
                  value={searchState.term}
                  onInput={onSearchChange}
                  onKeyDown={handleSearchKeyDown}
                />
              </label>
            </div>
            <div class="flex items-center gap-1 w-25 justify-end md:justify-start">
              <Show
                when={searchState.term}
                fallback={<span class="text-sm text-gray-500">No search</span>}
              >
                <Show
                  when={searchState.matchingLogIndices.length > 0}
                  fallback={
                    <span class="text-sm text-gray-500">No result</span>
                  }
                >
                  <span class="text-sm text-gray-500">
                    {searchState.currentMatchIndex + 1} /{" "}
                    {searchState.matchingLogIndices.length}
                  </span>
                  <div class="flex items-center gap-0 flex-col">
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
              </Show>
            </div>
          </div>

          {/* Options */}
          <div class="flex items-center gap-4 text-xs">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                class="checkbox checkbox-xs checkbox-primary"
                checked={uiState.autoScroll}
                onChange={(e) =>
                  setUiState(
                    "autoScroll",
                    (e.target as HTMLInputElement).checked,
                  )
                }
              />
              Auto-scroll
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                class="checkbox checkbox-xs checkbox-primary"
                checked={uiState.isPaused}
                onChange={(e) =>
                  setUiState("isPaused", (e.target as HTMLInputElement).checked)
                }
              />
              Pause
            </label>
            <button
              type="button"
              class="btn btn-outline btn-error btn-xs"
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
              when={logs.length > 0}
              fallback={
                <div class="flex items-center justify-center h-full text-gray-400">
                  No logs yet
                </div>
              }
            >
              <div class={`font-mono text-sm space-y-1`}>
                <For each={logs}>
                  {(log, index) => {
                    const isCurrentMatch = () =>
                      searchState.currentMatchIndex >= 0 &&
                      searchState.matchingLogIndices[
                        searchState.currentMatchIndex
                      ] === index();

                    return (
                      <ProcessLogRow
                        log={log}
                        index={index()}
                        searchTerm={searchState.term}
                        isCurrentMatch={isCurrentMatch()}
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
