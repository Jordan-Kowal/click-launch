import {
  getByTestId,
  render,
  renderHook,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, test } from "vitest";
import type { YamlConfig } from "@/electron/types";
import { validateYamlMock } from "@/tests/mocks/globals";
import { DashboardProvider, useDashboardContext } from "./DashboardContext";

const mockValidConfig: YamlConfig = {
  project_name: "test-project",
  processes: [
    {
      name: "test-process",
      base_command: "echo",
      args: [],
    },
  ],
};

describe("DashboardContext", () => {
  beforeEach(() => {
    validateYamlMock.mockClear();
    validateYamlMock.mockResolvedValue({
      isValid: true,
      config: mockValidConfig,
      errors: [],
    });
  });

  test("Context does not parse file when selectedFile is null", ({
    expect,
  }) => {
    render(
      <DashboardProvider selectedFile={null}>
        <div data-testid="child">Test Child</div>
      </DashboardProvider>,
    );

    expect(validateYamlMock).not.toHaveBeenCalled();
  });

  test("Context renders children correctly", ({ expect }) => {
    const { container } = render(
      <DashboardProvider selectedFile="/test/file.yaml">
        <div data-testid="child">Test Child</div>
      </DashboardProvider>,
    );

    const child = getByTestId(container, "child");
    expect(child).toBeInTheDocument();
  });

  test("Hook parseFile handles validation success correctly", async ({
    expect,
  }) => {
    const { result } = renderHook(() => useDashboardContext(), {
      wrapper: ({ children }) => (
        <DashboardProvider selectedFile="/test/file.yaml">
          {children}
        </DashboardProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await result.current.parseFile();

    await waitFor(() => {
      expect(result.current.yamlConfig).toEqual(mockValidConfig);
      expect(result.current.errors).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });
  });

  test("Hook parseFile handles validation errors correctly", async ({
    expect,
  }) => {
    const { result } = renderHook(() => useDashboardContext(), {
      wrapper: ({ children }) => (
        <DashboardProvider selectedFile="/test/file.yaml">
          {children}
        </DashboardProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const validationErrors = [
      { message: "Invalid syntax", path: "line 1" },
      { message: "Missing field", path: "line 5" },
    ];

    validateYamlMock.mockResolvedValue({
      isValid: false,
      config: null,
      errors: validationErrors,
    });

    await result.current.parseFile();

    await waitFor(() => {
      expect(result.current.yamlConfig).toBeNull();
      expect(result.current.errors).toEqual(validationErrors);
      expect(result.current.isLoading).toBe(false);
    });
  });
});
