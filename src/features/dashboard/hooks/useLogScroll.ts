import { createVirtualizer } from "@tanstack/solid-virtual";
import { createEffect, createSignal, on, onCleanup } from "solid-js";
import type { LogWithId } from "./useLogStore";

const SCROLL_TO_BOTTOM_THRESHOLD = 200;
const VIRTUALIZER_ESTIMATE_SIZE = 24;
const VIRTUALIZER_OVERSCAN = 10;

type UseLogScrollParams = {
  displayedLogs: () => LogWithId[];
  currentLogsLength: () => number;
  autoScroll: () => boolean;
  isOpen: () => boolean;
};

export const useLogScroll = ({
  displayedLogs,
  currentLogsLength,
  autoScroll,
  isOpen,
}: UseLogScrollParams) => {
  const [isAtBottom, setIsAtBottom] = createSignal(true);

  let logsContainerRef: HTMLDivElement | undefined;
  let scrollAnimationFrame: number | null = null;

  const setLogsContainerRef = (el: HTMLDivElement) => {
    logsContainerRef = el;
  };

  const virtualizer = createVirtualizer({
    get count() {
      return displayedLogs().length;
    },
    getScrollElement: () => logsContainerRef ?? null,
    estimateSize: () => VIRTUALIZER_ESTIMATE_SIZE,
    overscan: VIRTUALIZER_OVERSCAN,
  });

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
    if (!autoScroll()) return;
    const count = displayedLogs().length;
    if (count === 0) return;
    virtualizer.scrollToIndex(count - 1, { align: "end" });
  };

  const scrollToBottomManual = () => {
    const count = displayedLogs().length;
    if (count === 0) return;
    virtualizer.scrollToIndex(count - 1, { align: "end" });
  };

  // Auto-scroll to bottom when logs are rendered
  createEffect(on(currentLogsLength, scrollToBottom));

  // Track scroll position to show/hide scroll to bottom button
  createEffect(() => {
    if (!isOpen()) return;
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

  return {
    isAtBottom,
    setLogsContainerRef,
    virtualizer,
    scrollToBottom,
    scrollToBottomManual,
  };
};
