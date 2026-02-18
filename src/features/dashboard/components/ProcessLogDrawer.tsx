import { FileService } from "@backend";
import { createStore } from "solid-js/store";
import { NAVBAR_HEIGHT } from "@/components/layout/constants";
import { useSettingsContext } from "@/contexts";
import { useToast } from "@/hooks";
import { formatLogsAsText, generateExportFilename } from "@/utils/logExport";
import { useDashboardContext } from "../contexts";
import { isProcessActive } from "../enums";
import {
  useDrawerKeyboard,
  useLogScroll,
  useLogSearch,
  useLogStore,
} from "../hooks";
import { KeyboardShortcutsModal } from "./KeyboardShortcutsModal";
import { LogSearchBar } from "./LogSearchBar";
import { LogVirtualList } from "./LogVirtualList";
import { ProcessDrawerHeader } from "./ProcessDrawerHeader";
import { ProcessResources } from "./ProcessResources";

type ProcessLogDrawerProps = {
  processName: string;
  isOpen: boolean;
  onClose: () => void;
  onOpenResourceDrawer?: () => void;
};

export const ProcessLogDrawer = (props: ProcessLogDrawerProps) => {
  const {
    yamlConfig,
    rootDirectory,
    getProcessId,
    getProcessStatus,
    getProcessResources,
  } = useDashboardContext();
  const { settings } = useSettingsContext();
  const resources = () => getProcessResources(props.processName);
  const isRunning = () => isProcessActive(getProcessStatus(props.processName));
  const toast = useToast();

  let searchInputRef: HTMLInputElement | undefined;

  // Shared UI state owned by the orchestrator
  // (needed by both useLogStore and useLogScroll, avoiding circular deps)
  const [uiState, setUiState] = createStore({
    autoScroll: true,
    isPaused: false,
  });

  // Use mutable ref for scrollToIndex (same pattern as DashboardProvider)
  // to break the circular dependency between useLogSearch and useLogScroll
  let scrollToIndex: (
    index: number,
    options?: { align: "start" | "center" | "end" | "auto" },
  ) => void = () => {};

  const logStore = useLogStore({
    processName: () => props.processName,
    yamlConfig,
    getProcessId,
    autoScroll: () => uiState.autoScroll,
    isPaused: () => uiState.isPaused,
    logBufferSize: () => settings().logBufferSize,
  });

  const logSearch = useLogSearch({
    currentLogs: logStore.currentLogs,
    scrollToIndex: (i, o) => scrollToIndex(i, o),
  });

  const logScroll = useLogScroll({
    displayedLogs: logSearch.displayedLogs,
    currentLogsLength: () => logStore.currentLogs().length,
    autoScroll: () => uiState.autoScroll,
    isOpen: () => props.isOpen,
  });

  // Wire up the forward reference now that logScroll is available
  scrollToIndex = logScroll.virtualizer.scrollToIndex.bind(
    logScroll.virtualizer,
  );

  const keyboard = useDrawerKeyboard({
    isOpen: () => props.isOpen,
    onClose: () => props.onClose(),
    searchInputRef: () => searchInputRef,
  });

  const clearAll = () => {
    logStore.clearLogs();
    logSearch.clearSearch();
  };

  const exportLogs = async () => {
    const logs = logStore.currentLogs();
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
      const filePath = await FileService.WriteFile(dirPath, fileName, content);
      toast.success(`Logs exported to ${filePath}`);
    } catch (error) {
      toast.error(
        `Failed to export logs: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  return (
    <div class="drawer-side">
      <button
        type="button"
        class="drawer-overlay"
        onClick={props.onClose}
        aria-label="Close drawer"
      />
      <div
        class="w-[95vw] h-full bg-base-100 flex flex-col relative"
        style={{ "padding-top": `${NAVBAR_HEIGHT + 4}px` }}
      >
        <ProcessDrawerHeader
          title="Logs"
          processName={props.processName}
          onClose={props.onClose}
        >
          <ProcessResources
            resources={resources()}
            isRunning={isRunning()}
            onViewMore={props.onOpenResourceDrawer}
          />
        </ProcessDrawerHeader>

        <LogSearchBar
          searchInputRef={(el) => {
            searchInputRef = el;
          }}
          searchValue={logSearch.searchValue}
          searchState={logSearch.searchState}
          isFilterMode={logSearch.isFilterMode}
          setIsFilterMode={logSearch.setIsFilterMode}
          isRegexMode={logSearch.isRegexMode}
          setIsRegexMode={logSearch.setIsRegexMode}
          regexError={logSearch.regexError}
          onSearchChange={logSearch.onSearchChange}
          goToNextMatch={logSearch.goToNextMatch}
          goToPrevMatch={logSearch.goToPrevMatch}
          handleSearchKeyDown={logSearch.handleSearchKeyDown}
          uiState={uiState}
          setUiState={setUiState}
          onExport={exportLogs}
          onClear={clearAll}
        />

        <LogVirtualList
          currentLogs={logStore.currentLogs}
          displayedLogs={logSearch.displayedLogs}
          searchTerm={logSearch.searchState.term}
          isRegexMode={logSearch.isRegexMode()}
          selectedLogId={logSearch.selectedLogId}
          isAtBottom={logScroll.isAtBottom}
          virtualizer={logScroll.virtualizer}
          setLogsContainerRef={logScroll.setLogsContainerRef}
          onScrollToBottom={logScroll.scrollToBottomManual}
        />

        {/* Keyboard shortcuts hint */}
        <div class="border-t border-base-300 flex justify-end px-1">
          <button
            type="button"
            class="btn btn-ghost btn-xs text-base-content/50"
            onClick={() => keyboard.setShowShortcuts(true)}
          >
            <kbd class="kbd kbd-xs">⌘</kbd>
            <kbd class="kbd kbd-xs">/</kbd>
            <span>Shortcuts</span>
          </button>
        </div>

        <KeyboardShortcutsModal
          isOpen={keyboard.showShortcuts()}
          onClose={() => keyboard.setShowShortcuts(false)}
        />
      </div>
    </div>
  );
};
