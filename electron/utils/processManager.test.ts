import type { ChildProcess } from "node:child_process";
import { spawn } from "node:child_process";
import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  isProcessRunning,
  startProcess,
  stopAllProcesses,
  stopProcess,
} from "./processManager";

const mockChildProcess = {
  on: vi.fn(),
  kill: vi.fn(),
  killed: false,
  exitCode: null,
} as unknown as ChildProcess;

vi.mock("node:child_process", () => ({
  spawn: vi.fn(() => mockChildProcess),
}));

vi.mock("node:crypto", () => ({
  randomUUID: vi.fn(() => "test-uuid"),
}));

vi.mock("electron", () => ({
  BrowserWindow: {
    getAllWindows: vi.fn(() => []),
  },
}));

describe("processManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    (mockChildProcess as any).killed = false;
    (mockChildProcess as any).exitCode = null;
  });

  describe("startProcess", () => {
    test("should return success when process starts", async () => {
      const result = await startProcess("/test", "npm start");

      expect(result.success).toBe(true);
      expect(result.processId).toBe("test-uuid");
      expect(result.error).toBeUndefined();
    });

    test("should return failure when spawn throws error", async () => {
      vi.mocked(spawn).mockImplementationOnce(() => {
        throw new Error("Command not found");
      });

      const result = await startProcess("/test", "invalid-command");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Command not found");
      expect(result.processId).toBeUndefined();
    });
  });

  describe("stopProcess", () => {
    test("should return success when stopping existing process", async () => {
      await startProcess("/test", "npm start");
      const result = await stopProcess("test-uuid");

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test("should return success when process doesn't exist", async () => {
      const result = await stopProcess("non-existent");

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe("isProcessRunning", () => {
    test("should return true for running process", async () => {
      await startProcess("/test", "npm start");
      const result = await isProcessRunning("test-uuid");

      expect(result).toBe(true);
    });

    test("should return false for non-existent process", async () => {
      const result = await isProcessRunning("non-existent");

      expect(result).toBe(false);
    });

    test("should return false for killed process", async () => {
      await startProcess("/test", "npm start");
      (mockChildProcess as any).killed = true;

      const result = await isProcessRunning("test-uuid");

      expect(result).toBe(false);
    });
  });

  describe("stopAllProcesses", () => {
    test("should not throw error", () => {
      expect(() => stopAllProcesses()).not.toThrow();
    });
  });
});
