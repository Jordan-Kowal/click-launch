import {
  ChevronDown,
  ChevronUp,
  Download,
  Regex,
  Search,
  Trash2,
} from "lucide-solid";
import { type Accessor, type Setter, Show } from "solid-js";
import type { SetStoreFunction } from "solid-js/store";

type LogSearchBarProps = {
  searchInputRef: (el: HTMLInputElement) => void;
  searchValue: Accessor<string | undefined>;
  searchState: {
    term: string;
    currentMatchIndex: number;
    matchingLogIds: string[];
  };
  isFilterMode: Accessor<boolean>;
  setIsFilterMode: Setter<boolean>;
  isRegexMode: Accessor<boolean>;
  setIsRegexMode: Setter<boolean>;
  regexError: Accessor<string | null>;
  onSearchChange: (e: Event) => void;
  goToNextMatch: () => void;
  goToPrevMatch: () => void;
  handleSearchKeyDown: (e: KeyboardEvent) => void;
  uiState: { autoScroll: boolean; isPaused: boolean };
  setUiState: SetStoreFunction<{ autoScroll: boolean; isPaused: boolean }>;
  onExport: () => void;
  onClear: () => void;
};

export const LogSearchBar = (props: LogSearchBarProps) => {
  return (
    <div class="py-3 px-4 border-b border-base-300 gap-2 flex flex-col lg:flex-row lg:items-center lg:justify-between">
      <div class="flex items-center gap-4 min-h-12">
        <div class="relative w-full lg:w-96">
          <label class="input input-sm w-full">
            <Search size={16} />
            <input
              ref={props.searchInputRef}
              type="text"
              placeholder={
                props.isFilterMode()
                  ? "Filter logs..."
                  : "Search logs... (Enter: next, Shift+Enter: prev)"
              }
              class="grow w-full"
              value={props.searchValue()}
              onInput={props.onSearchChange}
              onKeyDown={props.handleSearchKeyDown}
            />
            <button
              type="button"
              class={`btn btn-xs btn-circle ${props.isRegexMode() ? "btn-secondary" : "btn-ghost"}`}
              onClick={() => props.setIsRegexMode(!props.isRegexMode())}
              title="Toggle regex mode"
            >
              <Regex size={16} />
            </button>
          </label>
          <Show when={props.regexError()}>
            <div class="text-error text-xs mt-1 absolute">
              {props.regexError()}
            </div>
          </Show>
        </div>
        <div class="flex items-center gap-1 shrink-0 whitespace-nowrap justify-end lg:justify-start">
          <Show
            when={props.searchState.term}
            fallback={<span class="text-sm text-gray-500">No search</span>}
          >
            <Show
              when={props.searchState.matchingLogIds.length > 0}
              fallback={<span class="text-sm text-gray-500">No result</span>}
            >
              <Show
                when={props.isFilterMode()}
                fallback={
                  <>
                    <span class="text-sm text-gray-500">
                      {props.searchState.currentMatchIndex + 1} /{" "}
                      {props.searchState.matchingLogIds.length}
                    </span>
                    <div class="flex items-center gap-0 flex-col">
                      <button
                        type="button"
                        class="btn btn-xs btn-ghost"
                        onClick={props.goToPrevMatch}
                        title="Previous match (Shift+Enter)"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        class="btn btn-xs btn-ghost"
                        onClick={props.goToNextMatch}
                        title="Next match (Enter)"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                  </>
                }
              >
                <span class="text-sm text-gray-500">
                  {props.searchState.matchingLogIds.length} match
                  {props.searchState.matchingLogIds.length === 1 ? "" : "es"}
                </span>
              </Show>
            </Show>
          </Show>
        </div>
        <label class="flex items-center gap-2 cursor-pointer text-xs whitespace-nowrap">
          <input
            type="checkbox"
            class="toggle toggle-xs toggle-primary"
            checked={props.isFilterMode()}
            onChange={(e) =>
              props.setIsFilterMode((e.target as HTMLInputElement).checked)
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
            checked={props.uiState.autoScroll}
            onChange={(e) =>
              props.setUiState(
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
            checked={props.uiState.isPaused}
            onChange={(e) =>
              props.setUiState(
                "isPaused",
                (e.target as HTMLInputElement).checked,
              )
            }
          />
          Pause
        </label>
        <div class="tooltip tooltip-bottom" data-tip="Export logs">
          <button
            type="button"
            class="btn btn-outline btn-primary btn-xs btn-square"
            onClick={props.onExport}
          >
            <Download size={16} />
          </button>
        </div>
        <div class="tooltip tooltip-bottom" data-tip="Clear logs">
          <button
            type="button"
            class="btn btn-outline btn-error btn-xs btn-square"
            onClick={props.onClear}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
