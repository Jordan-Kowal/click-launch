import { ChevronDown, ChevronUp, Search, Trash2, X } from "lucide-react";
import {
  type ChangeEvent,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { LogType } from "@/electron/enums";
import type { ProcessLogData } from "@/electron/types";
import { useProcessContext } from "../contexts";
import { ProcessLogRow } from "./ProcessLogRow";

type ProcessLogModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const ProcessLogModal = memo(
  ({ isOpen, onClose }: ProcessLogModalProps) => {
    const { name: processName, processId } = useProcessContext();

    const [logs, setLogs] = useState<ProcessLogData[]>([]);
    const [search, setSearch] = useState("");
    const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
    const [matchingLogIndices, setMatchingLogIndices] = useState<number[]>([]);
    const [autoScroll, setAutoScroll] = useState(true);
    const [wrapLines, setWrapLines] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const logsContainerRef = useRef<HTMLDivElement>(null);

    const addLog = useCallback(
      (logData: ProcessLogData) => {
        if (isPaused) return;
        setLogs((prev) => [...prev, logData]);
      },
      [isPaused],
    );

    // Auto-scroll to bottom when new logs are added
    // biome-ignore lint/correctness/useExhaustiveDependencies: watcher
    useEffect(() => {
      if (autoScroll && logsContainerRef.current) {
        logsContainerRef.current.scrollTop =
          logsContainerRef.current.scrollHeight;
      }
    }, [logs, autoScroll]);

    const clearLogs = useCallback(() => {
      setLogs([]);
      setSearch("");
      setCurrentMatchIndex(-1);
      setMatchingLogIndices([]);
    }, []);

    const onSearchChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
    }, []);

    // Update matching indices when search term or logs change
    useEffect(() => {
      if (!search.trim()) {
        setMatchingLogIndices([]);
        setCurrentMatchIndex(-1);
        return;
      }
      const matches: number[] = [];
      logs.forEach((log, index) => {
        if (log.type === LogType.EXIT) return;
        if (log.output.toLowerCase().includes(search.toLowerCase())) {
          matches.push(index);
        }
      });
      setMatchingLogIndices(matches);
      setCurrentMatchIndex(matches.length > 0 ? 0 : -1);
    }, [search, logs]);

    // Navigate to specific match
    const goToMatch = useCallback(
      (matchIndex: number) => {
        if (
          matchingLogIndices.length === 0 ||
          matchIndex < 0 ||
          matchIndex >= matchingLogIndices.length
        ) {
          return;
        }
        const logIndex = matchingLogIndices[matchIndex];
        const logElement = document.querySelector(
          `[data-log-index="${logIndex}"]`,
        );
        if (logElement && logsContainerRef.current) {
          logElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        setCurrentMatchIndex(matchIndex);
      },
      [matchingLogIndices],
    );

    const goToNextMatch = useCallback(() => {
      if (matchingLogIndices.length === 0) return;
      const nextIndex =
        currentMatchIndex < matchingLogIndices.length - 1
          ? currentMatchIndex + 1
          : 0;
      goToMatch(nextIndex);
    }, [currentMatchIndex, matchingLogIndices.length, goToMatch]);

    const goToPrevMatch = useCallback(() => {
      if (matchingLogIndices.length === 0) return;
      const prevIndex =
        currentMatchIndex > 0
          ? currentMatchIndex - 1
          : matchingLogIndices.length - 1;
      goToMatch(prevIndex);
    }, [currentMatchIndex, matchingLogIndices.length, goToMatch]);

    // Moves to next or previous match using Enter key
    const handleSearchKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
          e.shiftKey ? goToPrevMatch() : goToNextMatch();
        }
      },
      [goToNextMatch, goToPrevMatch],
    );

    /** Listen for logs */
    useEffect(() => {
      if (!processId) return;
      window.electronAPI.onProcessLog((logData) => {
        if (logData.processId !== processId) return;
        addLog(logData);
      });
      return () => {
        window.electronAPI.removeProcessLogListener();
      };
    }, [processId, addLog]);

    if (!isOpen || !processId) return null;

    return (
      <dialog className="modal modal-open" onClose={onClose}>
        <div className="modal-box w-full max-w-[100vw] h-full max-h-[100vh] flex flex-col p-0">
          {/* Header */}
          <div className="flex items-center justify-between p-4">
            <h2 className="font-bold text-xl !mb-0">Logs - {processName}</h2>
            <button
              type="button"
              className="btn btn-sm btn-circle"
              onClick={onClose}
            >
              <X size={16} />
            </button>
          </div>
          {/* Search and options */}
          <div className="p-4 border-b border-t border-base-300 gap-4 flex flex-col">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <label className="input w-full">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Search logs... (Enter: next, Shift+Enter: prev)"
                    className="grow w-full"
                    value={search}
                    onChange={onSearchChange}
                    onKeyDown={handleSearchKeyDown}
                  />
                </label>
              </div>
              {search && matchingLogIndices.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-500">
                    {currentMatchIndex + 1} / {matchingLogIndices.length}
                  </span>
                  <button
                    type="button"
                    className="btn btn-xs btn-ghost"
                    onClick={goToPrevMatch}
                    title="Previous match (Shift+Enter)"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-xs btn-ghost"
                    onClick={goToNextMatch}
                    title="Next match (Enter)"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
              )}
            </div>
            {/* Options */}
            <div className="flex items-center gap-4 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm checkbox-primary"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                />
                Auto-scroll to latest
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm checkbox-primary"
                  checked={wrapLines}
                  onChange={(e) => setWrapLines(e.target.checked)}
                />
                Wrap long lines
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm checkbox-primary"
                  checked={isPaused}
                  onChange={(e) => setIsPaused(e.target.checked)}
                />
                Pause updates
              </label>
              <button
                type="button"
                className="btn btn-outline btn-error btn-sm"
                onClick={clearLogs}
                title="Clear logs"
              >
                <Trash2 size={16} />
                Clear logs
              </button>
            </div>
          </div>

          {/* Logs content */}
          <div className="flex-1 overflow-hidden">
            <div ref={logsContainerRef} className="h-full overflow-y-auto p-4">
              {logs.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No logs yet
                </div>
              ) : (
                <div
                  className={`font-mono text-sm space-y-1 ${wrapLines ? "" : "overflow-x-auto"}`}
                >
                  {logs.map((log, index) => {
                    const isCurrentMatch =
                      currentMatchIndex >= 0 &&
                      matchingLogIndices[currentMatchIndex] === index;

                    return (
                      <ProcessLogRow
                        key={`${log.timestamp}-${index}`}
                        log={log}
                        index={index}
                        searchTerm={search}
                        isCurrentMatch={isCurrentMatch}
                        wrapLines={wrapLines}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </dialog>
    );
  },
);
