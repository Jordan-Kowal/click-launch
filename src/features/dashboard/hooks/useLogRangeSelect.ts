import { createMemo, createSignal } from "solid-js";
import { stripAnsiCodes } from "@/utils/logExport";
import type { LogWithId } from "./useLogStore";

type UseLogRangeSelectProps = {
  displayedLogs: () => LogWithId[];
  onSelectionStarted: () => void;
  onAnchorPicked: () => void;
  onCancelled: () => void;
  onCopied: (lineCount: number) => void;
  onCopyFailed: (error: unknown) => void;
};

export const useLogRangeSelect = (props: UseLogRangeSelectProps) => {
  const [isSelecting, setIsSelecting] = createSignal(false);
  const [anchorIdx, setAnchorIdx] = createSignal<number | null>(null);
  const [focusIdx, setFocusIdx] = createSignal<number | null>(null);

  const range = createMemo<{ start: number; end: number } | null>(() => {
    const a = anchorIdx();
    const f = focusIdx();
    if (a === null || f === null) return null;
    return { start: Math.min(a, f), end: Math.max(a, f) };
  });

  const isInRange = (index: number): boolean => {
    const r = range();
    return r !== null && index >= r.start && index <= r.end;
  };

  const reset = () => {
    setAnchorIdx(null);
    setFocusIdx(null);
  };

  const toggle = () => {
    if (isSelecting()) {
      reset();
      setIsSelecting(false);
      props.onCancelled();
    } else {
      setIsSelecting(true);
      props.onSelectionStarted();
    }
  };

  const handleRowClick = async (index: number) => {
    if (!isSelecting()) return;

    if (anchorIdx() === null) {
      setAnchorIdx(index);
      setFocusIdx(null);
      props.onAnchorPicked();
      return;
    }

    setFocusIdx(index);

    const r = range();
    if (!r) return;

    const slice = props.displayedLogs().slice(r.start, r.end + 1);
    const text = slice
      .map((log) => {
        if ("output" in log) return stripAnsiCodes(log.output).trimEnd();
        return "";
      })
      .filter(Boolean)
      .join("\n");

    try {
      await navigator.clipboard.writeText(text);
      props.onCopied(slice.length);
    } catch (error) {
      props.onCopyFailed(error);
    }

    reset();
    setIsSelecting(false);
  };

  return {
    isSelecting,
    anchorIdx,
    focusIdx,
    isInRange,
    toggle,
    handleRowClick,
  };
};
