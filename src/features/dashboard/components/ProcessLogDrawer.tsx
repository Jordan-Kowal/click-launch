import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Search,
  Trash2,
  X,
} from "lucide-solid";
import { createEffect, createSignal, For, on, onCleanup, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { LogType } from "@/electron/enums";
import type { ProcessLogData } from "@/electron/types";
import { isLiveUpdate } from "@/utils/ansiToHtml";
import { useDashboardContext } from "../contexts";
import { ProcessStatus } from "../enums";
import { ProcessLogRow } from "./ProcessLogRow";

type ProcessLogDrawerProps = {
  processName: string;
  isOpen: boolean;
  onClose: () => void;
};

const MAX_LOGS = 1_500;
const BATCH_DELAY_MS = 500;
const BATCH_DELAY_MS_AUTO_SCROLL = 100;
const SEARCH_DELAY_MS = 500;

export const ProcessLogDrawer = (props: ProcessLogDrawerProps) => {
  const { yamlConfig, getProcessId, getProcessStatus } = useDashboardContext();
  const processStatus = () => getProcessStatus(props.processName);
  const isRunning = () => processStatus() === ProcessStatus.RUNNING;

  const [uiState, setUiState] = createStore({
    autoScroll: true,
    isPaused: false,
  });

  let searchTimer: number | null = null;
  const [searchValue, setSearchValue] = createSignal<string | undefined>("");
  const [searchState, setSearchState] = createStore({
    term: "",
    currentMatchIndex: -1,
    matchingLogIndices: [] as number[],
  });

  const [logsByProcess, setLogsByProcess] = createStore<
    Record<string, ProcessLogData[]>
  >({});
  const [pendingLogsByProcess, setPendingLogsByProcess] = createStore<
    Record<string, ProcessLogData[]>
  >({});

  const currentLogs = () => logsByProcess[props.processName] || [];
  const processNames = () => yamlConfig()?.processes.map((p) => p.name) || [];

  let logsContainerRef!: HTMLDivElement;
  const logRefs = new Map<number, HTMLElement>();
  let batchTimer: number | null = null;

  const clearBatchTimer = () => {
    if (batchTimer === null) return;
    clearTimeout(batchTimer);
    batchTimer = null;
  };

  const clearSearchTimer = () => {
    if (searchTimer === null) return;
    clearTimeout(searchTimer);
    searchTimer = null;
  };

  const flushLogs = () => {
    const names = processNames();
    names.forEach((processName) => {
      const pending = pendingLogsByProcess[processName] || [];
      if (pending.length === 0) return;

      const current = logsByProcess[processName] || [];
      const updated = [...current];

      // Process each pending log
      // If it's a live update, it will replace the previous log
      pending.forEach((log) => {
        const isUpdate = log.type !== LogType.EXIT && isLiveUpdate(log.output);

        if (isUpdate && updated.length > 0) {
          updated[updated.length - 1] = log;
        } else {
          updated.push(log);
        }
      });

      if (updated.length > MAX_LOGS) {
        updated.splice(0, updated.length - MAX_LOGS);
      }

      setLogsByProcess(processName, updated);
      setPendingLogsByProcess(processName, []);
    });
  };

  const addLog = (logData: ProcessLogData) => {
    if (uiState.isPaused) return;

    const names = processNames();
    const processName = names.find(
      (name) => logData.processId === getProcessId(name),
    );

    if (!processName) return;

    const currentPending = pendingLogsByProcess[processName] || [];
    setPendingLogsByProcess(processName, [...currentPending, logData]);

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
    const processName = props.processName;
    setLogsByProcess(processName, []);
    setPendingLogsByProcess(processName, []);
    setSearchState({
      term: "",
      currentMatchIndex: -1,
      matchingLogIndices: [],
    });
    clearBatchTimer();
    clearSearchTimer();
  };

  const onSearchChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    setSearchValue(target.value);
    clearSearchTimer();
    searchTimer = window.setTimeout(() => {
      setSearchState("term", target.value);
      searchTimer = null;
    }, SEARCH_DELAY_MS);
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
  createEffect(on(() => currentLogs().length, scrollToBottom));

  // Update matching indices when search term or logs change
  createEffect(() => {
    const searchTerm = searchState.term;
    const logs = currentLogs();

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

  // Listen for logs from all processes
  createEffect(() => {
    window.electronAPI.onProcessLog((logData) => {
      addLog(logData);
    });

    onCleanup(() => {
      window.electronAPI.removeProcessLogListener();
      clearBatchTimer();
      clearSearchTimer();
      flushLogs(); // Flush any remaining logs on cleanup
    });
  });

  return (
    <div class="drawer-side">
      <button
        type="button"
        class="drawer-overlay"
        onClick={props.onClose}
        aria-label="Close drawer"
      />
      <div class="w-[95vw] h-full bg-base-100 flex flex-col pt-6">
        {/* Header */}
        <div class="px-4 py-2 border-b border-base-300">
          <div class="flex flex-row items-center gap-2">
            <button
              type="button"
              class="btn btn-ghost btn-circle btn-sm no-drag"
              onClick={props.onClose}
            >
              <ArrowLeft size={20} />
            </button>
            <h3 class="font-bold m-0!">Logs - {props.processName}</h3>
            <Show
              when={isRunning()}
              fallback={<div class="badge badge-neutral">Idle</div>}
            >
              <div class="badge badge-primary">Running</div>
            </Show>
          </div>
          <button
            type="button"
            class="btn btn-sm btn-circle absolute right-4 top-8"
            onClick={props.onClose}
          >
            <X size={16} />
          </button>
        </div>

        {/* Search and options */}
        <div class="py-2 px-4 border-b border-base-300 gap-2 flex flex-col md:flex-row md:items-center md:justify-between">
          <div class="flex items-center gap-4 min-h-12">
            <div class="relative w-full md:w-96">
              <label class="input input-sm w-full">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search logs... (Enter: next, Shift+Enter: prev)"
                  class="grow w-full"
                  value={searchValue()}
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
              when={currentLogs().length > 0}
              fallback={
                <div class="flex items-center justify-center h-full text-gray-400">
                  No logs yet
                </div>
              }
            >
              <div class={`font-mono text-sm space-y-1`}>
                <For each={currentLogs()}>
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
    </div>
  );
};
