import {
  getByTestId,
  render,
  renderHook,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, test } from "vitest";
import type { ValidationResult, YamlConfig } from "@/electron/types";
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

const TestComponent: React.FC = () => {
  const { isLoading, yamlConfig, errors, parseFile } = useDashboardContext();
  return (
    <div data-testid="dashboard-test">
      <div data-testid="loading">{isLoading ? "loading" : "idle"}</div>
      <div data-testid="config">{yamlConfig?.project_name || "no-config"}</div>
      <div data-testid="errors">{errors.length}</div>
      <button data-testid="parse-btn" type="button" onClick={parseFile}>
        Parse
      </button>
    </div>
  );
};

describe.sequential("DashboardContext", () => {
  beforeEach(() => {
    validateYamlMock.mockClear();
  });

  test("renders children correctly", ({ expect }) => {
    const validResult: ValidationResult = {
      isValid: true,
      config: mockValidConfig,
      errors: [],
    };
    validateYamlMock.mockResolvedValue(validResult);

    const { container } = render(
      <DashboardProvider selectedFile="/test/file.yaml">
        <div data-testid="child">Test Child</div>
      </DashboardProvider>,
    );

    const child = getByTestId(container, "child");
    expect(child).toBeInTheDocument();
  });

  test("throws error when hook is used outside provider", ({ expect }) => {
    expect(() => {
      render(<TestComponent />);
    }).toThrow("useDashboard must be used within a DashboardProvider");
  });

  test("shows loading state during file parsing", async ({ expect }) => {
    let resolveValidation: (result: ValidationResult) => void;
    const validationPromise = new Promise<ValidationResult>((resolve) => {
      resolveValidation = resolve;
    });
    validateYamlMock.mockReturnValue(validationPromise);

    const { container } = render(
      <DashboardProvider selectedFile="/test/file.yaml">
        <TestComponent />
      </DashboardProvider>,
    );

    const loading = getByTestId(container, "loading");
    expect(loading).toHaveTextContent("loading");

    resolveValidation!({
      isValid: true,
      config: mockValidConfig,
      errors: [],
    });

    await waitFor(() => {
      expect(loading).toHaveTextContent("idle");
    });
  });

  test("handles successful yaml validation", async ({ expect }) => {
    const validResult: ValidationResult = {
      isValid: true,
      config: mockValidConfig,
      errors: [],
    };
    validateYamlMock.mockResolvedValue(validResult);

    const { container } = render(
      <DashboardProvider selectedFile="/test/file.yaml">
        <TestComponent />
      </DashboardProvider>,
    );

    await waitFor(() => {
      const config = getByTestId(container, "config");
      const errors = getByTestId(container, "errors");
      expect(config).toHaveTextContent("test-project");
      expect(errors).toHaveTextContent("0");
    });
  });

  test("handles yaml validation errors", async ({ expect }) => {
    const errorResult: ValidationResult = {
      isValid: false,
      config: null,
      errors: [
        { message: "Invalid yaml", path: "line 1" },
        { message: "Missing field", path: "line 5" },
      ],
    };
    validateYamlMock.mockResolvedValue(errorResult);

    const { container } = render(
      <DashboardProvider selectedFile="/test/file.yaml">
        <TestComponent />
      </DashboardProvider>,
    );

    await waitFor(() => {
      const config = getByTestId(container, "config");
      const errors = getByTestId(container, "errors");
      expect(config).toHaveTextContent("no-config");
      expect(errors).toHaveTextContent("2");
    });
  });

  test("does not parse file when selectedFile is null", ({ expect }) => {
    render(
      <DashboardProvider selectedFile={null}>
        <TestComponent />
      </DashboardProvider>,
    );

    expect(validateYamlMock).not.toHaveBeenCalled();
  });
});

describe.sequential("useDashboardContext", () => {
  beforeEach(() => {
    validateYamlMock.mockClear();
    validateYamlMock.mockResolvedValue({
      isValid: true,
      config: mockValidConfig,
      errors: [],
    });
  });

  test("throws error when used outside provider", ({ expect }) => {
    expect(() => {
      renderHook(() => useDashboardContext());
    }).toThrow("useDashboard must be used within a DashboardProvider");
  });

  test("parseFile handles validation success correctly", async ({ expect }) => {
    validateYamlMock.mockResolvedValue({
      isValid: true,
      config: mockValidConfig,
      errors: [],
    });

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

    validateYamlMock.mockClear();
    validateYamlMock.mockResolvedValue({
      isValid: true,
      config: mockValidConfig,
      errors: [],
    });

    await result.current.parseFile();

    await waitFor(() => {
      expect(result.current.yamlConfig).toEqual(mockValidConfig);
      expect(result.current.errors).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });
  });

  test("parseFile handles validation errors correctly", async ({ expect }) => {
    validateYamlMock.mockResolvedValue({
      isValid: true,
      config: mockValidConfig,
      errors: [],
    });

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
