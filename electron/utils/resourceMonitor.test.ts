import { exec } from "node:child_process";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { getProcessResources } from "./resourceMonitor";

vi.mock("node:child_process", () => ({
  exec: vi.fn(),
}));

const mockExec = vi.mocked(exec);

describe("resourceMonitor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getProcessResources", () => {
    test("should return resource data for running processes", async () => {
      mockExec.mockImplementation((_cmd: string, callback: any) => {
        callback(null, "  5.2  65536\n  2.1  32768\n");
        return {} as any;
      });

      const result = await getProcessResources({ "proc-1": 1234 });

      expect(result["proc-1"]).toEqual({
        cpu: 7.3,
        memoryBytes: (65536 + 32768) * 1024,
      });
    });

    test("should return zeros when ps command fails", async () => {
      mockExec.mockImplementation((_cmd: string, callback: any) => {
        callback(new Error("No such process"), "");
        return {} as any;
      });

      const result = await getProcessResources({ "proc-1": 9999 });

      expect(result["proc-1"]).toEqual({ cpu: 0, memoryBytes: 0 });
    });

    test("should return zeros when output is empty", async () => {
      mockExec.mockImplementation((_cmd: string, callback: any) => {
        callback(null, "");
        return {} as any;
      });

      const result = await getProcessResources({ "proc-1": 1234 });

      expect(result["proc-1"]).toEqual({ cpu: 0, memoryBytes: 0 });
    });

    test("should handle multiple processes in parallel", async () => {
      let callCount = 0;
      mockExec.mockImplementation((_cmd: string, callback: any) => {
        callCount++;
        if (callCount === 1) {
          callback(null, "  10.0  102400\n");
        } else {
          callback(null, "  3.5  51200\n");
        }
        return {} as any;
      });

      const result = await getProcessResources({
        "proc-1": 1000,
        "proc-2": 2000,
      });

      expect(result["proc-1"]).toBeDefined();
      expect(result["proc-2"]).toBeDefined();
      expect(mockExec).toHaveBeenCalledTimes(2);
    });

    test("should return empty object when no processes given", async () => {
      const result = await getProcessResources({});
      expect(result).toEqual({});
      expect(mockExec).not.toHaveBeenCalled();
    });
  });
});
