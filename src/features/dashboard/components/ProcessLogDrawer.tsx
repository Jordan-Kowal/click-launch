import { createVirtualizer } from "@tanstack/solid-virtual";
import {
  ArrowDown,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Download,
  Regex,
  Search,
  Trash2,
  X,
} from "lucide-solid";
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  Match,
  on,
  onCleanup,
  Show,
  Switch,
} from "solid-js";
import { createStore } from "solid-js/store";
import { useSettingsContext } from "@/contexts";
import { LogType } from "@/electron/enums";
import type { ProcessLogData } from "@/electron/types";
import { useToast } from "@/hooks";
import { isLiveUpdate } from "@/utils/ansiToHtml";
import { formatLogsAsText, generateExportFilename } from "@/utils/logExport";
import { useDashboardContext } from "../contexts";
import { ProcessStatus } from "../enums";
import { KeyboardShortcutsModal } from "./KeyboardShortcutsModal";
import { PlayStopButton } from "./PlayStopButton";
import { ProcessLogRow } from "./ProcessLogRow";
import { ProcessResources } from "./ProcessResources";

type ProcessLogDrawerProps = {
  processName: string;
  isOpen: boolean;
  onClose: () => void;
};

type LogWithId = ProcessLogData & { id: string };

const BATCH_DELAY_MS = 500;
const BATCH_DELAY_MS_AUTO_SCROLL = 100;
const SEARCH_DELAY_MS = 500;
const SCROLL_TO_BOTTOM_THRESHOLD = 200;
const VIRTUALIZER_ESTIMATE_SIZE = 24;
const VIRTUALIZER_OVERSCAN = 10;

export const ProcessLogDrawer = (props: ProcessLogDrawerProps) => {
  const {
    yamlConfig,
    rootDirectory,
    getProcessId,
    getProcessStatus,
    getProcessData,
    getProcessResources,
  } = useDashboardContext();
  const { settings } = useSettingsContext();
  const toast = useToast();
  const processStatus = () => getProcessStatus(props.processName);
  const processData = () => getProcessData(props.processName);
  const resources = () => getProcessResources(props.processName);
  const isRunning = () =>
    processStatus() === ProcessStatus.RUNNING ||
    processStatus() === ProcessStatus.RESTARTING;

  const [uiState, setUiState] = createStore({
    autoScroll: true,
    isPaused: false,
  });
  const [isAtBottom, setIsAtBottom] = createSignal(true);
  const [selectedLogId, setSelectedLogId] = createSignal<string | null>(null);
  const [showShortcuts, setShowShortcuts] = createSignal(false);

  let searchTimer: number | null = null;
  const [searchValue, setSearchValue] = createSignal<string | undefined>("");
  const [isFilterMode, setIsFilterMode] = createSignal(false);
  const [isRegexMode, setIsRegexMode] = createSignal(false);
  const [regexError, setRegexError] = createSignal<string | null>(null);
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

  const matchingLogIdSet = createMemo(
    () => new Set(searchState.matchingLogIds),
  );

  // Filter logs based on mode: in filter mode, only show matching logs
  const displayedLogs = createMemo(() => {
    const logs = currentLogs();
    if (!isFilterMode() || !searchState.term.trim()) {
      return logs;
    }
    const idSet = matchingLogIdSet();
    return logs.filter((log) => idSet.has(log.id));
  });

  let logsContainerRef!: HTMLDivElement;
  let searchInputRef!: HTMLInputElement;
  let batchTimer: number | null = null;
  let scrollAnimationFrame: number | null = null;
  let previousSearchTerm = "";

  const virtualizer = createVirtualizer({
    get count() {
      return displayedLogs().length;
    },
    getScrollElement: () => logsContainerRef,
    estimateSize: () => VIRTUALIZER_ESTIMATE_SIZE,
    overscan: VIRTUALIZER_OVERSCAN,
  });

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

      const maxLogs = settings().logBufferSize;
      if (updated.length > maxLogs) {
        updated.splice(0, updated.length - maxLogs);
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
    if (!uiState.autoScroll) return;
    const count = displayedLogs().length;
    if (count === 0) return;
    virtualizer.scrollToIndex(count - 1, { align: "end" });
  };

  const scrollToBottomManual = () => {
    const count = displayedLogs().length;
    if (count === 0) return;
    virtualizer.scrollToIndex(count - 1, { align: "end" });
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

  const exportLogs = async () => {
    const logs = currentLogs();
    if (logs.length === 0) {
      toast.error("No logs to export");
      return;
    }
    const rootDir = rootDirectory();
    if (!rootDir) {
      toast.error("No project directory available");
      return;
    }
    try {
      const content = formatLogsAsText(logs, props.processName);
      const fileName = generateExportFilename(props.processName);
      const dirPath = `${rootDir}/logs/click-launch`;
      const filePath = await window.electronAPI.writeFile(
        dirPath,
        fileName,
        content,
      );
      toast.success(`Logs exported to ${filePath}`);
    } catch (error) {
      toast.error(
        `Failed to export logs: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
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
    const logs = displayedLogs();
    const logIndex = logs.findIndex((log) => log.id === logId);
    if (logIndex >= 0) {
      virtualizer.scrollToIndex(logIndex, { align: "center" });
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

  // Moves to next or previous match using Enter key (search mode only)
  const handleSearchKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !isFilterMode()) {
      e.shiftKey ? goToPrevMatch() : goToNextMatch();
    }
  };

  /* Exits the drawer on "Escape" key if the drawer is open and the search input is not focused */
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key !== "Escape" || !props.isOpen) return;
    if (showShortcuts()) {
      setShowShortcuts(false);
      return;
    }
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

  /* Toggles the keyboard shortcuts modal on CMD/Ctrl + / */
  const handleShortcutsToggle = (e: KeyboardEvent) => {
    if (e.key !== "/" || !(e.metaKey || e.ctrlKey) || !props.isOpen) return;
    e.preventDefault();
    setShowShortcuts((prev) => !prev);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    handleEscape(e);
    handleCmdF(e);
    handleShortcutsToggle(e);
  };

  // Auto-scroll to bottom when logs are rendered
  createEffect(on(() => currentLogs().length, scrollToBottom));

  // Update matching log IDs when search term or logs change
  createEffect(() => {
    const searchTerm = searchState.term;
    const logs = currentLogs();
    const useRegex = isRegexMode();
    // Early exit: empty search term clears all matches and selections
    if (!searchTerm.trim()) {
      previousSearchTerm = searchTerm;
      setRegexError(null);
      setSearchState({
        term: searchTerm,
        matchingLogIds: [],
        currentMatchIndex: -1,
      });
      setSelectedLogId(null);
      return;
    }
    // Regex mode: compile pattern and validate syntax
    let regex: RegExp | null = null;
    if (useRegex) {
      try {
        regex = new RegExp(searchTerm, "i");
        setRegexError(null);
      } catch (error) {
        // Invalid regex: show error and clear matches
        setRegexError((error as Error).message);
        setSearchState({
          term: searchTerm,
          matchingLogIds: [],
          currentMatchIndex: -1,
        });
        setSelectedLogId(null);
        previousSearchTerm = searchTerm;
        return;
      }
    }
    // Find all logs matching the search term (excluding EXIT logs)
    const matchingIds: string[] = [];
    logs.forEach((log) => {
      if (log.type === LogType.EXIT) return;
      const matches = useRegex
        ? regex?.test(log.output)
        : log.output.toLowerCase().includes(searchTerm.toLowerCase());
      if (matches) {
        matchingIds.push(log.id);
      }
    });
    // Determine which match to select and highlight
    let newCurrentMatchIndex = -1;
    const currentSelectedId = selectedLogId();
    if (matchingIds.length > 0) {
      if (searchTerm !== previousSearchTerm) {
        // New search term: jump to first match
        newCurrentMatchIndex = 0;
        setSelectedLogId(matchingIds[0]);
      } else if (currentSelectedId && matchingIds.includes(currentSelectedId)) {
        // Same search, current selection still valid: preserve it
        newCurrentMatchIndex = matchingIds.indexOf(currentSelectedId);
      } else {
        // Same search, but current selection no longer valid: reset to first match
        newCurrentMatchIndex = 0;
        setSelectedLogId(matchingIds[0]);
      }
    } else {
      // No matches found: clear selection
      setSelectedLogId(null);
    }
    // Update state tracking for next effect run
    previousSearchTerm = searchTerm;
    // Commit the new search state
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
      <div class="w-[95vw] h-full bg-base-100 flex flex-col pt-6 relative">
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
            <Switch>
              <Match when={processStatus() === ProcessStatus.RUNNING}>
                <div class="badge badge-primary">Running</div>
              </Match>
              <Match when={processStatus() === ProcessStatus.RESTARTING}>
                <div class="badge badge-warning">
                  Restart ({processData()?.retryCount ?? 0}/
                  {processData()?.maxRetries ?? 3})
                </div>
              </Match>
              <Match when={processStatus() === ProcessStatus.CRASHED}>
                <div class="badge badge-error">Crashed</div>
              </Match>
              <Match when={true}>
                <div class="badge badge-neutral">Idle</div>
              </Match>
            </Switch>
            <ProcessResources resources={resources()} isRunning={isRunning()} />
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
        <div class="py-3 px-4 border-b border-base-300 gap-2 flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div class="flex items-center gap-4 min-h-12">
            <div class="relative w-full lg:w-96">
              <label class="input input-sm w-full">
                <Search size={16} />
                <input
                  ref={searchInputRef!}
                  type="text"
                  placeholder={
                    isFilterMode()
                      ? "Filter logs..."
                      : "Search logs... (Enter: next, Shift+Enter: prev)"
                  }
                  class="grow w-full"
                  value={searchValue()}
                  onInput={onSearchChange}
                  onKeyDown={handleSearchKeyDown}
                />
                <button
                  type="button"
                  class={`btn btn-xs btn-circle ${isRegexMode() ? "btn-secondary" : "btn-ghost"}`}
                  onClick={() => setIsRegexMode(!isRegexMode())}
                  title="Toggle regex mode"
                >
                  <Regex size={16} />
                </button>
              </label>
              <Show when={regexError()}>
                <div class="text-error text-xs mt-1 absolute">
                  {regexError()}
                </div>
              </Show>
            </div>
            <div class="flex items-center gap-1 shrink-0 whitespace-nowrap justify-end lg:justify-start">
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
                  <Show
                    when={isFilterMode()}
                    fallback={
                      <>
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
                      </>
                    }
                  >
                    <span class="text-sm text-gray-500">
                      {searchState.matchingLogIds.length} match
                      {searchState.matchingLogIds.length === 1 ? "" : "es"}
                    </span>
                  </Show>
                </Show>
              </Show>
            </div>
            <label class="flex items-center gap-2 cursor-pointer text-xs whitespace-nowrap">
              <input
                type="checkbox"
                class="toggle toggle-xs toggle-primary"
                checked={isFilterMode()}
                onChange={(e) =>
                  setIsFilterMode((e.target as HTMLInputElement).checked)
                }
              />
              Filter mode
            </label>
          </div>

          {/* Options */}
          <div class="flex items-center gap-4 text-xs self-end lg:self-auto">
            <label class="flex items-center gap-2 cursor-pointer whitespace-nowrap">
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
            <label class="flex items-center gap-2 cursor-pointer whitespace-nowrap">
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
            <div class="tooltip tooltip-bottom" data-tip="Export logs">
              <button
                type="button"
                class="btn btn-outline btn-primary btn-xs btn-square"
                onClick={exportLogs}
              >
                <Download size={16} />
              </button>
            </div>
            <div class="tooltip tooltip-bottom" data-tip="Clear logs">
              <button
                type="button"
                class="btn btn-outline btn-error btn-xs btn-square"
                onClick={clearLogs}
              >
                <Trash2 size={16} />
              </button>
            </div>
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
              <div
                class="font-mono text-sm pl-1 w-full"
                style={{
                  "padding-top": `${virtualizer.getVirtualItems()[0]?.start ?? 0}px`,
                  "padding-bottom": `${(() => {
                    const items = virtualizer.getVirtualItems();
                    const lastItem = items[items.length - 1];
                    if (!lastItem) return 0;
                    return virtualizer.getTotalSize() - lastItem.end;
                  })()}px`,
                }}
              >
                <For each={virtualizer.getVirtualItems()}>
                  {(virtualRow) => {
                    const log = () => displayedLogs()[virtualRow.index];
                    const isCurrentMatch = () => selectedLogId() === log()?.id;

                    return (
                      <Show when={log()}>
                        <div
                          ref={virtualizer.measureElement}
                          data-index={virtualRow.index}
                        >
                          <ProcessLogRow
                            log={log()!}
                            searchTerm={searchState.term}
                            isRegexMode={isRegexMode()}
                            isCurrentMatch={isCurrentMatch()}
                          />
                        </div>
                      </Show>
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

        {/* Keyboard shortcuts hint */}
        <div class="border-t border-base-300 flex justify-end px-1">
          <button
            type="button"
            class="btn btn-ghost btn-xs text-base-content/50"
            onClick={() => setShowShortcuts(true)}
          >
            <kbd class="kbd kbd-xs">⌘</kbd>
            <kbd class="kbd kbd-xs">/</kbd>
            <span>Shortcuts</span>
          </button>
        </div>

        {/* Keyboard shortcuts modal overlay */}
        <KeyboardShortcutsModal
          isOpen={showShortcuts()}
          onClose={() => setShowShortcuts(false)}
        />
      </div>
    </div>
  );
};
