import { memo } from "react";
import { LogType } from "@/electron/enums";
import type { ProcessLogData } from "@/electron/types";
import { parseAnsiToSegments } from "@/utils/ansiToHtml";

type ProcessLogRowProps = {
  log: ProcessLogData;
};

export const ProcessLogRow = memo(({ log }: ProcessLogRowProps) => {
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
    <div>
      <span className="text-gray-500 italic">[{log.timestamp}]</span>
      {segments.map((segment, segIndex) => (
        <span
          key={`${log.timestamp}-${segIndex}`}
          className={segment.classes.join(" ")}
        >
          {segment.text}
        </span>
      ))}
    </div>
  );
});
