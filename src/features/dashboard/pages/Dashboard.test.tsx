import { getByTestId, render } from "@testing-library/react";
import { beforeEach, describe, test, vi } from "vitest";
import * as dashboardContext from "../contexts/DashboardContext";
import Dashboard from "./Dashboard";

const mockParseFile = vi.fn();

describe("Dashboard", () => {
  beforeEach(() => {
    mockParseFile.mockClear();
  });

  test("renders loading ring when isLoading is true", ({ expect }) => {
    vi.spyOn(dashboardContext, "useDashboardContext").mockReturnValue({
      isLoading: true,
      yamlConfig: null,
      errors: [{ message: "Test error" }],
      parseFile: mockParseFile,
    });

    const { container } = render(<Dashboard />);
    const loadingDashboard = getByTestId(container, "loading-dashboard");

    expect(loadingDashboard).toBeInTheDocument();
  });

  test("renders error list when errors exist", ({ expect }) => {
    vi.spyOn(dashboardContext, "useDashboardContext").mockReturnValue({
      isLoading: false,
      yamlConfig: null,
      errors: [{ message: "Test error" }],
      parseFile: mockParseFile,
    });

    const { container } = render(<Dashboard />);
    const errorDashboard = getByTestId(container, "error-dashboard");
    const errorList = getByTestId(container, "error-list");

    expect(errorDashboard).toBeInTheDocument();
    expect(errorList).toBeInTheDocument();
  });

  test("renders normal dashboard when no loading and no errors", ({
    expect,
  }) => {
    vi.spyOn(dashboardContext, "useDashboardContext").mockReturnValue({
      isLoading: false,
      yamlConfig: { project_name: "MyProject", processes: [] },
      errors: [],
      parseFile: mockParseFile,
    });

    const { container } = render(<Dashboard />);
    const dashboard = getByTestId(container, "dashboard");

    expect(dashboard).toBeInTheDocument();
    expect(dashboard).toHaveTextContent("MyProject");
    expect(dashboard).toHaveTextContent("Processes");
  });
});
