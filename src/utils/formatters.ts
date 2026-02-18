const UNITS = ["B", "KB", "MB", "GB", "TB"];

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    UNITS.length - 1,
  );
  const value = bytes / 1024 ** exponent;
  const decimals = exponent >= 3 ? 1 : 0; // 1 decimal for GB+
  const formatted = exponent === 0 ? value.toString() : value.toFixed(decimals);
  return `${formatted} ${UNITS[exponent]}`;
};

export const formatCpu = (percent: number): string => {
  return `${percent.toFixed(1)}%`;
};

/** Formats an ISO/UTC timestamp to local "HH:MM:SS.μμμμμμ" with fixed 6-digit microseconds. */
export const formatTimestamp = (iso: string): string => {
  const date = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  const hms = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  const fracMatch = iso.match(/\.(\d+)/);
  const micros = (fracMatch?.[1] ?? "0").padEnd(6, "0").slice(0, 6);
  return `${hms}.${micros}`;
};
