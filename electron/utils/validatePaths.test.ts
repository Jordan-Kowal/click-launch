import { existsSync } from "node:fs";
import { describe, expect, test, vi } from "vitest";
import { validatePaths } from "./validatedPaths";

// Mock fs module
vi.mock("node:fs", () => ({
  existsSync: vi.fn(),
}));

describe("validatePaths", () => {
  test("should return both valid and invalid paths", () => {
    const mockExistsSync = vi.mocked(existsSync);
    mockExistsSync
      .mockReturnValueOnce(true) // first path exists
      .mockReturnValueOnce(false) // second path doesn't exist
      .mockReturnValueOnce(false) // third path doesn't exist
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false);
    const paths = [
      "/valid/path1.yml",
      "/invalid/path2.yml",
      "/invalid/path3.yml",
    ];
    const [validPaths, invalidPaths] = validatePaths(paths);

    expect(mockExistsSync).toHaveBeenCalledTimes(6);
    expect(validPaths).toEqual(["/valid/path1.yml"]);
    expect(invalidPaths).toEqual(["/invalid/path2.yml", "/invalid/path3.yml"]);
  });
});
