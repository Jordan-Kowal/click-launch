import {
  ArrowDown,
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
import { PlayStopButton } from "./PlayStopButton";
import { ProcessLogRow } from "./ProcessLogRow";

type ProcessLogDrawerProps = {
  processName: string;
  isOpen: boolean;
  onClose: () => void;
};

type LogWithId = ProcessLogData & { id: string };

const MAX_LOGS = 1_500;
const BATCH_DELAY_MS = 500;
const BATCH_DELAY_MS_AUTO_SCROLL = 100;
const SEARCH_DELAY_MS = 500;
const SCROLL_TO_BOTTOM_THRESHOLD = 200;

export const ProcessLogDrawer = (props: ProcessLogDrawerProps) => {
  const { yamlConfig, getProcessId, getProcessStatus } = useDashboardContext();
  const processStatus = () => getProcessStatus(props.processName);
  const isRunning = () => processStatus() === ProcessStatus.RUNNING;

  const [uiState, setUiState] = createStore({
    autoScroll: true,
    isPaused: false,
  });
  const [isAtBottom, setIsAtBottom] = createSignal(true);
  const [selectedLogId, setSelectedLogId] = createSignal<string | null>(null);

  let searchTimer: number | null = null;
  const [searchValue, setSearchValue] = createSignal<string | undefined>("");
  const [searchState, setSearchState] = createStore({
    term: "",
    currentMatchIndex: -1,
    matchingLogIds: [] as string[],
  });

  const [logsByProcess, setLogsByProcess] = createStore<
    Record<string, LogWithId[]>
  >({});
  const [pendingLogsByProcess, setPendingLogsByProcess] = createStore<
    Record<string, ProcessLogData[]>
  >({});

  const currentLogs = () => logsByProcess[props.processName] || [];
  const processNames = () => yamlConfig()?.processes.map((p) => p.name) || [];

  let logsContainerRef!: HTMLDivElement;
  let searchInputRef!: HTMLInputElement;
  const logRefs = new Map<string, HTMLElement>();
  let batchTimer: number | null = null;
  let scrollAnimationFrame: number | null = null;
  let previousSearchTerm = "";

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
          // Replace the last log with updated version, keeping the same ID
          const lastLog = updated[updated.length - 1];
          updated[updated.length - 1] = { ...log, id: lastLog.id };
        } else {
          // Generate unique ID for new log
          updated.push({ ...log, id: crypto.randomUUID() });
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

  const checkIfAtBottom = () => {
    if (!logsContainerRef) return;
    const { scrollTop, scrollHeight, clientHeight } = logsContainerRef;
    const atBottom =
      scrollHeight - scrollTop - clientHeight < SCROLL_TO_BOTTOM_THRESHOLD;
    setIsAtBottom(atBottom);
  };

  const handleScrollThrottled = () => {
    if (scrollAnimationFrame !== null) return;
    scrollAnimationFrame = requestAnimationFrame(() => {
      checkIfAtBottom();
      scrollAnimationFrame = null;
    });
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

  const scrollToBottomManual = () => {
    if (!logsContainerRef) return;
    logsContainerRef.scrollTo({
      top: logsContainerRef.scrollHeight,
      behavior: "smooth",
    });
  };

  const clearLogs = () => {
    const processName = props.processName;
    setLogsByProcess(processName, []);
    setPendingLogsByProcess(processName, []);
    setSearchState({
      term: "",
      currentMatchIndex: -1,
      matchingLogIds: [],
    });
    setSelectedLogId(null);
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
    const logIds = searchState.matchingLogIds;
    if (logIds.length === 0 || matchIndex < 0 || matchIndex >= logIds.length) {
      return;
    }
    const logId = logIds[matchIndex];
    const logElement = logRefs.get(logId);
    if (logElement && logsContainerRef) {
      logElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    setSearchState("currentMatchIndex", matchIndex);
    setSelectedLogId(logId);
  };

  const goToNextMatch = () => {
    const logIds = searchState.matchingLogIds;
    if (logIds.length === 0) return;
    const nextIndex =
      searchState.currentMatchIndex < logIds.length - 1
        ? searchState.currentMatchIndex + 1
        : 0;
    goToMatch(nextIndex);
  };

  const goToPrevMatch = () => {
    const logIds = searchState.matchingLogIds;
    if (logIds.length === 0) return;
    const prevIndex =
      searchState.currentMatchIndex > 0
        ? searchState.currentMatchIndex - 1
        : logIds.length - 1;
    goToMatch(prevIndex);
  };

  // Moves to next or previous match using Enter key
  const handleSearchKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.shiftKey ? goToPrevMatch() : goToNextMatch();
    }
  };

  /* Exits the drawer on "Escape" key if the drawer is open and the search input is not focused */
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key !== "Escape" || !props.isOpen) return;
    const activeElement = document.activeElement;
    if (activeElement === searchInputRef) return;
    props.onClose();
  };

  /* Focuses the search input on CMD+F if the drawer is open and the search input is not focused */
  const handleCmdF = (e: KeyboardEvent) => {
    if (e.key !== "f" || !e.metaKey || !props.isOpen) return;
    const activeElement = document.activeElement;
    if (activeElement === searchInputRef) return;
    e.preventDefault();
    searchInputRef.focus();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    handleEscape(e);
    handleCmdF(e);
  };

  // Auto-scroll to bottom when logs are rendered
  createEffect(on(() => currentLogs().length, scrollToBottom));

  // Update matching log IDs when search term or logs change
  createEffect(() => {
    const searchTerm = searchState.term;
    const logs = currentLogs();

    if (!searchTerm.trim()) {
      previousSearchTerm = searchTerm;
      setSearchState({
        term: searchTerm,
        matchingLogIds: [],
        currentMatchIndex: -1,
      });
      setSelectedLogId(null);
      return;
    }

    const matchingIds: string[] = [];
    logs.forEach((log) => {
      if (log.type === LogType.EXIT) return;
      if (log.output.toLowerCase().includes(searchTerm.toLowerCase())) {
        matchingIds.push(log.id);
      }
    });

    // Preserve the current selection if search term hasn't changed
    let newCurrentMatchIndex = -1;
    const currentSelectedId = selectedLogId();

    if (matchingIds.length > 0) {
      // If search term changed, reset to first match
      if (searchTerm !== previousSearchTerm) {
        newCurrentMatchIndex = 0;
        setSelectedLogId(matchingIds[0]);
      }
      // If search term is the same, try to preserve selection
      else if (currentSelectedId && matchingIds.includes(currentSelectedId)) {
        // Same log is still in matches, preserve selection
        newCurrentMatchIndex = matchingIds.indexOf(currentSelectedId);
      } else {
        // No valid selection, default to first match
        newCurrentMatchIndex = 0;
        setSelectedLogId(matchingIds[0]);
      }
    } else {
      setSelectedLogId(null);
    }

    previousSearchTerm = searchTerm;

    setSearchState({
      term: searchTerm,
      matchingLogIds: matchingIds,
      currentMatchIndex: newCurrentMatchIndex,
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

  /* Register the keydown event listener */
  createEffect(() => {
    if (!props.isOpen) return;
    window.addEventListener("keydown", handleKeyDown);
    onCleanup(() => {
      window.removeEventListener("keydown", handleKeyDown);
    });
  });

  /* Track scroll position to show/hide scroll to bottom button */
  createEffect(() => {
    if (!props.isOpen) return;
    const container = logsContainerRef;
    if (!container) return;
    checkIfAtBottom();
    container.addEventListener("scroll", handleScrollThrottled);
    onCleanup(() => {
      container.removeEventListener("scroll", handleScrollThrottled);
      if (scrollAnimationFrame !== null) {
        cancelAnimationFrame(scrollAnimationFrame);
        scrollAnimationFrame = null;
      }
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
            <PlayStopButton processName={props.processName} />
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
                  ref={searchInputRef!}
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
                  when={searchState.matchingLogIds.length > 0}
                  fallback={
                    <span class="text-sm text-gray-500">No result</span>
                  }
                >
                  <span class="text-sm text-gray-500">
                    {searchState.currentMatchIndex + 1} /{" "}
                    {searchState.matchingLogIds.length}
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
        <div class="flex-1 overflow-hidden bg-gray-900 relative">
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
                  {(log) => {
                    const isCurrentMatch = () => selectedLogId() === log.id;

                    return (
                      <ProcessLogRow
                        log={log}
                        searchTerm={searchState.term}
                        isCurrentMatch={isCurrentMatch()}
                        ref={(el: HTMLDivElement | undefined) => {
                          if (el) {
                            logRefs.set(log.id, el);
                          } else {
                            logRefs.delete(log.id);
                          }
                        }}
                      />
                    );
                  }}
                </For>
              </div>
            </Show>
          </div>
          <Show when={!isAtBottom()}>
            <button
              type="button"
              class="btn btn-circle btn-primary absolute bottom-3 right-6 shadow-lg"
              onClick={scrollToBottomManual}
              title="Scroll to bottom"
            >
              <ArrowDown size={20} />
            </button>
          </Show>
        </div>
      </div>
    </div>
  );
};
