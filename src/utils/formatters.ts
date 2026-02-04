const UNITS = ["B", "KB", "MB", "GB", "TB"];

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    UNITS.length - 1,
  );
  const value = bytes / 1024 ** exponent;
  const formatted = exponent === 0 ? value.toString() : value.toFixed(1);
  return `${formatted} ${UNITS[exponent]}`;
};

export const formatCpu = (percent: number): string => {
  return `${percent.toFixed(1)}%`;
};
