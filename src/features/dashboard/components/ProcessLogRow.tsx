import { Copy } from "lucide-solid";
import { createMemo, For, type JSX, Show } from "solid-js";
import { useSettingsContext } from "@/contexts";
import { useToast } from "@/hooks";
import type { ProcessLogData } from "@/types";
import { LogType } from "@/types";
import { parseAnsiToSegments } from "@/utils/ansiToHtml";
import { formatTimestamp } from "@/utils/formatters";

type ProcessLogRowProps = {
  log: ProcessLogData;
  searchTerm?: string;
  isRegexMode?: boolean;
  isCurrentMatch?: boolean;
};

const highlightSearchTerm = (
  text: string,
  searchTerm: string,
  regex: RegExp,
): JSX.Element => {
  if (!searchTerm) return text;

  const parts = text.split(regex);

  return (
    <For each={parts}>
      {(part) =>
        regex.test(part) ? (
          <mark class="bg-yellow-300 text-black">{part}</mark>
        ) : (
          part
        )
      }
    </For>
  );
};

export const ProcessLogRow = (props: ProcessLogRowProps) => {
  const { settings } = useSettingsContext();
  const toast = useToast();

  const copyLogLine = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => toast.success("Copied to clipboard"),
      () => toast.error("Failed to copy"),
    );
  };
  if (props.log.type === LogType.EXIT) {
    return (
      <div>
        <Show when={settings().showTimestamps}>
          <div>{formatTimestamp(props.log.timestamp)}</div>
        </Show>
        <div>{props.log.code}</div>
        <div>{props.log.signal}</div>
      </div>
    );
  }

  const logOutput = () =>
    props.log.type === LogType.EXIT ? "" : props.log.output;

  // Memoize expensive ANSI parsing - only recompute when log output changes
  const segments = createMemo(() => {
    return parseAnsiToSegments(logOutput() || "");
  });

  // Memoize search regex - only recreate when search term changes
  const searchRegex = createMemo(() => {
    if (!props.searchTerm) return null;
    try {
      const pattern = props.isRegexMode
        ? props.searchTerm
        : props.searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`(${pattern})`, "gi");
    } catch {
      return null;
    }
  });

  return (
    <div
      class={`group relative ${
        props.isCurrentMatch ? "bg-gray-700 rounded" : ""
      } whitespace-pre-wrap wrap-break-word`}
    >
      <button
        type="button"
        class="btn btn-ghost btn-xs absolute -left-5 top-0 opacity-0 group-hover:opacity-100 transition-opacity min-h-0 h-auto p-0.5"
        onClick={() => copyLogLine(logOutput())}
        title="Copy log line"
      >
        <Copy size={14} />
      </button>
      <Show when={settings().showTimestamps}>
        <span class="text-gray-400 italic">
          [{formatTimestamp(props.log.timestamp)}]{" "}
        </span>
      </Show>
      <For each={segments()}>
        {(segment) => (
          <span class={segment.classes.join(" ")}>
            {props.searchTerm && searchRegex()
              ? highlightSearchTerm(
                  segment.text,
                  props.searchTerm,
                  searchRegex()!,
                )
              : segment.text}
          </span>
        )}
      </For>
    </div>
  );
};
