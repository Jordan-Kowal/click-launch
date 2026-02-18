/** biome-ignore-all lint/suspicious/noControlCharactersInRegex: Stripping ANSI escape codes */

import type { ProcessLogData } from "@/types";
import { LogType } from "@/types";

const ANSI_REGEX = /\x1b\[[0-9;]*[A-Za-z]/g;

export const stripAnsiCodes = (text: string): string =>
  text.replace(ANSI_REGEX, "");

const formatTimestamp = (iso: string): string => {
  const date = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

export const formatLogsAsText = (
  logs: ProcessLogData[],
  processName: string,
): string => {
  const header = `Logs for "${processName}"\nExported at ${new Date().toISOString()}\n${"─".repeat(60)}\n`;

  const lines = logs.map((log) => {
    const ts = formatTimestamp(log.timestamp);
    if (log.type === LogType.EXIT) {
      const detail =
        log.code !== null ? `code ${log.code}` : `signal ${log.signal}`;
      return `[${ts}] [exit] Process exited with ${detail}`;
    }
    return `[${ts}] [${log.type}] ${stripAnsiCodes(log.output).trimEnd()}`;
  });

  return `${header + lines.join("\n")}\n`;
};

export const generateExportFilename = (processName: string): string => {
  const slug = processName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `${slug}-${ts}.txt`;
};
