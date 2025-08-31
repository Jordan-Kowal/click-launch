import { getByTestId, render } from "@testing-library/react";
import { beforeEach, describe, test, vi } from "vitest";
import type { YamlConfig } from "@/electron/types";
import {
  navigateMock,
  toastMock,
  useLocationMock,
  useSearchMock,
  validateYamlMock,
} from "@/tests/mocks/globals";
import { DashboardRouter } from "./DashboardRouter";

vi.mock("../pages/Dashboard", () => ({
  default: () => <div data-testid="dashboard-page">Dashboard Page</div>,
}));

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

describe.sequential("DashboardRouter", () => {
  beforeEach(() => {
    useLocationMock.mockReturnValue(["/dashboard", navigateMock]);
    toastMock.error.mockClear();
    navigateMock.mockClear();
    validateYamlMock.mockClear();
    validateYamlMock.mockResolvedValue({
      isValid: true,
      config: mockValidConfig,
      errors: [],
    });
  });

  test("returns null, redirects, and shows toast error when no selectedFile", ({
    expect,
  }) => {
    useSearchMock.mockReturnValue("");

    const { container } = render(<DashboardRouter />);

    expect(container.firstChild).toBeNull();
    expect(toastMock.error).toHaveBeenCalledWith("No project file selected.");
    expect(navigateMock).toHaveBeenCalledWith("/");
  });

  test("returns null, redirects, and shows toast error when empty file parameter", ({
    expect,
  }) => {
    useSearchMock.mockReturnValue("?file=");

    const { container } = render(<DashboardRouter />);

    expect(container.firstChild).toBeNull();
    expect(toastMock.error).toHaveBeenCalledWith("No project file selected.");
    expect(navigateMock).toHaveBeenCalledWith("/");
  });

  test("renders dashboard when selectedFile exists", ({ expect }) => {
    useSearchMock.mockReturnValue("?file=%2Fpath%2Fto%2Ffile.yaml");

    const { container } = render(<DashboardRouter />);
    const dashboard = getByTestId(container, "dashboard-page");

    expect(dashboard).toBeInTheDocument();
    expect(toastMock.error).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
