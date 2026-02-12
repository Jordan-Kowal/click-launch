import { createEffect, createMemo, createSignal, on } from "solid-js";
import { createStore } from "solid-js/store";
import { LogType } from "@/electron/enums";
import type { LogWithId } from "./useLogStore";

const SEARCH_DELAY_MS = 500;

type ScrollAlign = "start" | "center" | "end" | "auto";

type UseLogSearchParams = {
  currentLogs: () => LogWithId[];
  scrollToIndex: (index: number, options?: { align: ScrollAlign }) => void;
};

export const useLogSearch = ({
  currentLogs,
  scrollToIndex,
}: UseLogSearchParams) => {
  let searchTimer: number | null = null;
  let previousSearchTerm = "";

  const [searchValue, setSearchValue] = createSignal<string | undefined>("");
  const [isFilterMode, setIsFilterMode] = createSignal(false);
  const [isRegexMode, setIsRegexMode] = createSignal(false);
  const [regexError, setRegexError] = createSignal<string | null>(null);
  const [selectedLogId, setSelectedLogId] = createSignal<string | null>(null);
  const [searchState, setSearchState] = createStore({
    term: "",
    currentMatchIndex: -1,
    matchingLogIds: [] as string[],
  });

  const matchingLogIdSet = createMemo(
    () => new Set(searchState.matchingLogIds),
  );

  const displayedLogs = createMemo(() => {
    const logs = currentLogs();
    if (!isFilterMode() || !searchState.term.trim()) {
      return logs;
    }
    const idSet = matchingLogIdSet();
    return logs.filter((log) => idSet.has(log.id));
  });

  const clearSearchTimer = () => {
    if (searchTimer === null) return;
    clearTimeout(searchTimer);
    searchTimer = null;
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

  const goToMatch = (matchIndex: number) => {
    const logIds = searchState.matchingLogIds;
    if (logIds.length === 0 || matchIndex < 0 || matchIndex >= logIds.length) {
      return;
    }
    const logId = logIds[matchIndex];
    const logs = displayedLogs();
    const logIndex = logs.findIndex((log) => log.id === logId);
    if (logIndex >= 0) {
      scrollToIndex(logIndex, { align: "center" });
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

  const handleSearchKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !isFilterMode()) {
      e.shiftKey ? goToPrevMatch() : goToNextMatch();
    }
  };

  const clearSearch = () => {
    setSearchState({
      term: "",
      currentMatchIndex: -1,
      matchingLogIds: [],
    });
    setSelectedLogId(null);
    setSearchValue("");
    clearSearchTimer();
  };

  // Update matching log IDs when search term, logs, or regex mode change
  createEffect(
    on([() => searchState.term, currentLogs, isRegexMode], () => {
      const searchTerm = searchState.term;
      const logs = currentLogs();
      const useRegex = isRegexMode();

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

      let regex: RegExp | null = null;
      if (useRegex) {
        try {
          regex = new RegExp(searchTerm, "i");
          setRegexError(null);
        } catch (error) {
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

      let newCurrentMatchIndex = -1;
      const currentSelectedId = selectedLogId();
      if (matchingIds.length > 0) {
        if (searchTerm !== previousSearchTerm) {
          newCurrentMatchIndex = 0;
          setSelectedLogId(matchingIds[0]);
        } else if (
          currentSelectedId &&
          matchingIds.includes(currentSelectedId)
        ) {
          newCurrentMatchIndex = matchingIds.indexOf(currentSelectedId);
        } else {
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
    }),
  );

  return {
    searchValue,
    searchState,
    isFilterMode,
    setIsFilterMode,
    isRegexMode,
    setIsRegexMode,
    regexError,
    selectedLogId,
    matchingLogIdSet,
    displayedLogs,
    onSearchChange,
    goToNextMatch,
    goToPrevMatch,
    handleSearchKeyDown,
    clearSearch,
    clearSearchTimer,
  };
};
