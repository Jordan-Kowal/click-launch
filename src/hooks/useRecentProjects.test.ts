import { describe, test } from "vitest";
import { renderHook } from "@/tests/utils";
import { useRecentProjects } from "./useRecentProjects";

const TEMPORARY_KEY = "recent-projects";

describe.concurrent("useRecentProjects", () => {
  test("should return empty projects array when no data is stored", ({
    expect,
  }) => {
    const { result } = renderHook(() => useRecentProjects());
    const { projects } = result.current;
    expect(projects).toEqual([]);
  });

  test("should return stored projects", ({ expect }) => {
    const testProjects = ["/path/to/project1.yaml", "/path/to/project2.yaml"];
    localStorage.setItem(TEMPORARY_KEY, JSON.stringify(testProjects));

    const { result } = renderHook(() => useRecentProjects());
    const { projects } = result.current;
    expect(projects).toEqual(testProjects);
  });

  test("should handle invalid JSON data by resetting to empty array", ({
    expect,
  }) => {
    localStorage.setItem(TEMPORARY_KEY, "invalid json");

    const { result } = renderHook(() => useRecentProjects());
    const { projects } = result.current;
    expect(projects).toEqual([]);
    expect(localStorage.getItem(TEMPORARY_KEY)).toBe("[]");
  });

  test("should register a new project at the beginning of the list", ({
    expect,
  }) => {
    const existingProjects = ["/path/to/project1.yaml"];
    localStorage.setItem(TEMPORARY_KEY, JSON.stringify(existingProjects));

    const { result } = renderHook(() => useRecentProjects());
    const { registerProject } = result.current;

    registerProject("/path/to/project2.yaml");

    const { result: updatedResult } = renderHook(() => useRecentProjects());
    const { projects } = updatedResult.current;
    expect(projects).toEqual([
      "/path/to/project2.yaml",
      "/path/to/project1.yaml",
    ]);
  });

  test("should move existing project to the beginning when registered again", ({
    expect,
  }) => {
    const existingProjects = [
      "/path/to/project1.yaml",
      "/path/to/project2.yaml",
    ];
    localStorage.setItem(TEMPORARY_KEY, JSON.stringify(existingProjects));

    const { result } = renderHook(() => useRecentProjects());
    const { registerProject } = result.current;

    registerProject("/path/to/project2.yaml");

    const { result: updatedResult } = renderHook(() => useRecentProjects());
    const { projects } = updatedResult.current;
    expect(projects).toEqual([
      "/path/to/project2.yaml",
      "/path/to/project1.yaml",
    ]);
  });

  test("should limit projects to MAX (10) items", ({ expect }) => {
    const manyProjects = Array.from(
      { length: 12 },
      (_, i) => `/path/to/project${i}.yaml`,
    );
    localStorage.setItem(TEMPORARY_KEY, JSON.stringify(manyProjects));

    const { result } = renderHook(() => useRecentProjects());
    const { registerProject } = result.current;

    registerProject("/path/to/new-project.yaml");

    const { result: updatedResult } = renderHook(() => useRecentProjects());
    const { projects } = updatedResult.current;
    expect(projects).toHaveLength(10);
    expect(projects[0]).toBe("/path/to/new-project.yaml");
  });

  test("should remove a project from the list", ({ expect }) => {
    const existingProjects = [
      "/path/to/project1.yaml",
      "/path/to/project2.yaml",
    ];
    localStorage.setItem(TEMPORARY_KEY, JSON.stringify(existingProjects));

    const { result } = renderHook(() => useRecentProjects());
    const { removeProject } = result.current;

    removeProject("/path/to/project1.yaml");

    const { result: updatedResult } = renderHook(() => useRecentProjects());
    const { projects } = updatedResult.current;
    expect(projects).toEqual(["/path/to/project2.yaml"]);
  });

  test("should handle removing non-existent project gracefully", ({
    expect,
  }) => {
    const existingProjects = ["/path/to/project1.yaml"];
    localStorage.setItem(TEMPORARY_KEY, JSON.stringify(existingProjects));

    const { result } = renderHook(() => useRecentProjects());
    const { removeProject } = result.current;

    removeProject("/path/to/non-existent.yaml");

    const { result: updatedResult } = renderHook(() => useRecentProjects());
    const { projects } = updatedResult.current;
    expect(projects).toEqual(["/path/to/project1.yaml"]);
  });

  test("should remove multiple projects", ({ expect }) => {
    const existingProjects = [
      "/path/to/project1.yaml",
      "/path/to/project2.yaml",
      "/path/to/project3.yaml",
    ];
    localStorage.setItem(TEMPORARY_KEY, JSON.stringify(existingProjects));

    const { result } = renderHook(() => useRecentProjects());
    const { removeProjects } = result.current;

    // Mix of valid paths (existing), invalid paths (non-existent), and unsupported types
    removeProjects([
      "/path/to/project1.yaml", // valid - should be removed
      "/path/to/non-existent.yaml", // invalid - doesn't exist, should be ignored
      "", // unsupported - empty string
      null, // unsupported - null
      undefined, // unsupported - undefined
      42, // unsupported - number
      "/path/to/project3.yaml", // valid - should be removed
    ] as any);

    const { result: updatedResult } = renderHook(() => useRecentProjects());
    const { projects } = updatedResult.current;
    expect(projects).toEqual(["/path/to/project2.yaml"]);
  });
});
