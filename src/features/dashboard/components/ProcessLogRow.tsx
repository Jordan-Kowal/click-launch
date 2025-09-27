import { For, type JSX } from "solid-js";
import { LogType } from "@/electron/enums";
import type { ProcessLogData } from "@/electron/types";
import { parseAnsiToSegments } from "@/utils/ansiToHtml";

type ProcessLogRowProps = {
  log: ProcessLogData;
  index: number;
  searchTerm?: string;
  isCurrentMatch?: boolean;
  wrapLines?: boolean;
};

const highlightSearchTerm = (text: string, searchTerm: string): JSX.Element => {
  if (!searchTerm) return text;

  const regex = new RegExp(
    `(${searchTerm.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")})`,
    "gi",
  );
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

  const segments = parseAnsiToSegments(props.log.output || "");

  return (
    <div
      data-log-index={props.index}
      class={`${
        props.isCurrentMatch
          ? "ring-2 ring-primary bg-primary/10 rounded p-1"
          : ""
      } ${props.wrapLines ? "whitespace-pre-wrap break-words" : "whitespace-pre overflow-x-auto"}`}
    >
      <span class="text-gray-400 italic">[{props.log.timestamp}] </span>
      <For each={segments}>
        {(segment) => (
          <span class={segment.classes.join(" ")}>
            {props.searchTerm
              ? highlightSearchTerm(segment.text, props.searchTerm)
              : segment.text}
          </span>
        )}
      </For>
    </div>
  );
};
