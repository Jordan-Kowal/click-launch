import { memo, type ReactNode } from "react";
import { LogType } from "@/electron/enums";
import type { ProcessLogData } from "@/electron/types";
import { parseAnsiToSegments } from "@/utils/ansiToHtml";

type ProcessLogRowProps = {
  log: ProcessLogData;
  index: number;
  searchTerm?: string;
  isCurrentMatch?: boolean;
};

const highlightSearchTerm = (text: string, searchTerm: string): ReactNode => {
  if (!searchTerm) return text;

  const regex = new RegExp(
    `(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi",
  );
  const parts = text.split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      // biome-ignore lint/suspicious/noArrayIndexKey: Supported
      <mark key={`${part}-${index}`} className="bg-yellow-300 text-black">
        {part}
      </mark>
    ) : (
      part
    ),
  );
};

export const ProcessLogRow = memo(
  ({ log, index, searchTerm, isCurrentMatch }: ProcessLogRowProps) => {
    if (log.type === LogType.EXIT) {
      return (
        <div>
          <div>{log.timestamp}</div>
          <div>{log.code}</div>
          <div>{log.signal}</div>
        </div>
      );
    }

    const segments = parseAnsiToSegments(log.output || "");

    return (
      <div
        data-log-index={index}
        className={
          isCurrentMatch ? "ring-2 ring-primary bg-primary/10 rounded p-1" : ""
        }
      >
        <span className="text-gray-500 italic">[{log.timestamp}]</span>
        {segments.map((segment, segIndex) => (
          <span
            key={`${log.timestamp}-${segIndex}`}
            className={segment.classes.join(" ")}
          >
            {searchTerm
              ? highlightSearchTerm(segment.text, searchTerm)
              : segment.text}
          </span>
        ))}
      </div>
    );
  },
);
