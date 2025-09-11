import { Search, Trash2, X } from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
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
    }, []);

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
            <div className="relative">
              <label className="input w-full">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search logs..."
                  className="grow w-full"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
            </div>
          </div>

          {/* Logs content */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto p-4">
              {logs.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  {search ? "No logs found matching search" : "No logs yet"}
                </div>
              ) : (
                <div className="font-mono text-sm space-y-1">
                  {logs.map((log, index) => (
                    <ProcessLogRow
                      key={`${log.timestamp}-${index}`}
                      log={log}
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
