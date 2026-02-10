import { Copy } from "lucide-solid";
import { createMemo, For, type JSX } from "solid-js";
import { LogType } from "@/electron/enums";
import type { ProcessLogData } from "@/electron/types";
import { useToast } from "@/hooks";
import { parseAnsiToSegments } from "@/utils/ansiToHtml";

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
        <div>{props.log.timestamp}</div>
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
      <span class="text-gray-400 italic">[{props.log.timestamp}] </span>
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
