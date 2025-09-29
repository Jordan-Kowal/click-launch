import { createMemo, For, type JSX } from "solid-js";
import { LogType } from "@/electron/enums";
import type { ProcessLogData } from "@/electron/types";
import { parseAnsiToSegments } from "@/utils/ansiToHtml";

type ProcessLogRowProps = {
  log: ProcessLogData;
  index: number;
  searchTerm?: string;
  isCurrentMatch?: boolean;
  ref?: (el: HTMLDivElement | undefined) => void;
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
  if (props.log.type === LogType.EXIT) {
    return (
      <div>
        <div>{props.log.timestamp}</div>
        <div>{props.log.code}</div>
        <div>{props.log.signal}</div>
      </div>
    );
  }

  // Memoize expensive ANSI parsing - only recompute when log output changes
  const segments = createMemo(() => {
    const output = props.log.type === LogType.EXIT ? "" : props.log.output;
    return parseAnsiToSegments(output || "");
  });

  // Memoize search regex - only recreate when search term changes
  const searchRegex = createMemo(() => {
    if (!props.searchTerm) return null;
    return new RegExp(
      `(${props.searchTerm.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")})`,
      "gi",
    );
  });

  return (
    <div
      ref={props.ref}
      data-log-index={props.index}
      class={`${
        props.isCurrentMatch
          ? "ring-2 ring-primary bg-primary/10 rounded p-1"
          : ""
      } whitespace-pre-wrap break-words`}
    >
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
