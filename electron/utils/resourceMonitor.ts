import { exec } from "node:child_process";

export type ProcessResourceData = {
  cpu: number;
  memoryBytes: number;
};

/**
 * Get CPU and memory usage for a process and all its children using `ps`.
 * macOS only. Uses process group (-g) to capture child processes.
 */
const getProcessStats = (pid: number): Promise<ProcessResourceData> => {
  return new Promise((resolve) => {
    // Use -g to get the entire process group (parent + children spawned with detached/shell)
    exec(`ps -g ${pid} -o %cpu=,rss=`, (error, stdout) => {
      if (error || !stdout.trim()) {
        resolve({ cpu: 0, memoryBytes: 0 });
        return;
      }
      const lines = stdout
        .trim()
        .split("\n")
        .filter((line) => line.trim() !== "");
      let totalCpu = 0;
      let totalRssKb = 0;
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 2) {
          totalCpu += Number.parseFloat(parts[0]) || 0;
          totalRssKb += Number.parseInt(parts[1], 10) || 0;
        }
      }
      resolve({
        cpu: Math.round(totalCpu * 10) / 10,
        memoryBytes: totalRssKb * 1024,
      });
    });
  });
};

/**
 * Get resource usage for multiple processes by their PIDs.
 * Returns a map of processId -> resource data.
 */
export const getProcessResources = async (
  pidMap: Record<string, number>,
): Promise<Record<string, ProcessResourceData>> => {
  const result: Record<string, ProcessResourceData> = {};
  const entries = Object.entries(pidMap);

  const promises = entries.map(async ([processId, pid]) => {
    const stats = await getProcessStats(pid);
    result[processId] = stats;
  });

  await Promise.all(promises);
  return result;
};
