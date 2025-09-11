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

const LOG_BATCH_INTERVAL_MS = 500;

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
    const logsContainerRef = useRef<HTMLDivElement>(null);

    // Batching for performance - collect logs and flush every X ms
    const logBatchRef = useRef<ProcessLogData[]>([]);
    const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const flushLogs = useCallback(() => {
      if (logBatchRef.current.length === 0) return;
      setLogs((prev) => [...prev, ...logBatchRef.current]);
      logBatchRef.current = [];
      batchTimeoutRef.current = null;
    }, []);

    const addLogToBatch = useCallback(
      (logData: ProcessLogData) => {
        logBatchRef.current.push(logData);
        if (batchTimeoutRef.current) {
          clearTimeout(batchTimeoutRef.current);
        }
        batchTimeoutRef.current = setTimeout(flushLogs, LOG_BATCH_INTERVAL_MS);
      },
      [flushLogs],
    );

    const clearLogs = useCallback(() => {
      setLogs([]);
      logBatchRef.current = [];
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
      console.log({ search, matches });
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
        addLogToBatch(logData);
      });
      return () => {
        window.electronAPI.removeProcessLogListener();
        if (batchTimeoutRef.current) {
          clearTimeout(batchTimeoutRef.current);
          flushLogs();
        }
      };
    }, [processId, addLogToBatch, flushLogs]);

    if (!isOpen || !processId) return null;

    return (
      <dialog className="modal modal-open" onClose={onClose}>
        <div className="modal-box w-full max-w-[100vw] h-full max-h-[100vh] flex flex-col p-0">
          {/* Header */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <h2 className="font-bold text-xl">Logs - {processName}</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn btn-outline btn-error btn-sm"
                onClick={clearLogs}
                title="Clear logs"
              >
                <Trash2 size={16} />
                Clear
              </button>
              <button
                type="button"
                className="btn btn-sm btn-circle"
                onClick={onClose}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-t border-base-300">
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
          </div>

          {/* Logs content */}
          <div className="flex-1 overflow-hidden">
            <div ref={logsContainerRef} className="h-full overflow-y-auto p-4">
              {logs.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No logs yet
                </div>
              ) : (
                <div className="font-mono text-sm space-y-1">
                  {logs.map((log, index) => (
                    <ProcessLogRow
                      key={`${log.timestamp}-${index}`}
                      log={log}
                      index={index}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </dialog>
    );
  },
);
