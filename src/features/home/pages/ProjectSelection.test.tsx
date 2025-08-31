import { getByTestId, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, test } from "vitest";
import {
  navigateMock,
  openFileDialogMock,
  toastErrorMock,
  validatePathsMock,
} from "@/tests/mocks/globals";
import { render } from "@/tests/utils";
import ProjectSelection from "./ProjectSelection";

describe("ProjectSelection", () => {
  beforeEach(() => {
    navigateMock.mockClear();
    openFileDialogMock.mockClear();
    validatePathsMock.mockClear();
    toastErrorMock.mockClear();
    localStorage.clear();
  });

  test("should render the page", ({ expect }) => {
    const { container } = render(<ProjectSelection />);
    const homepage = getByTestId<HTMLDivElement>(
      container,
      "project-selection",
    );

    expect(homepage).toBeVisible();
    expect(homepage).toHaveTextContent("Devbox Services GUI");
    expect(homepage).toHaveTextContent("Open new project");
    expect(homepage).toHaveTextContent("Recent Projects");
  });

  test("should open file dialog and navigate to dashboard when file is selected", async ({
    expect,
  }) => {
    const user = userEvent.setup();
    const testFilePath = "/path/to/selected/file.yml";

    openFileDialogMock.mockResolvedValue(testFilePath);

    const { container } = render(<ProjectSelection />);
    const openButton = getByTestId(container, "open-project-button");

    await user.click(openButton);

    expect(openFileDialogMock).toHaveBeenCalledOnce();
    expect(navigateMock).toHaveBeenCalledWith(
      `/dashboard?file=${encodeURIComponent(testFilePath)}`,
    );
  });

  test("should not navigate when no file is selected", async ({ expect }) => {
    const user = userEvent.setup();

    openFileDialogMock.mockResolvedValue(undefined);

    const { container } = render(<ProjectSelection />);
    const openButton = getByTestId(container, "open-project-button");

    await user.click(openButton);

    expect(openFileDialogMock).toHaveBeenCalledOnce();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  test("should display recent projects", async ({ expect }) => {
    const testProjects = ["/path/to/project1.yaml", "/path/to/project2.yaml"];
    validatePathsMock.mockResolvedValue([]);

    localStorage.setItem("recent-projects", JSON.stringify(testProjects));

    const { container } = render(<ProjectSelection />);
    const projectLink1 = getByTestId(container, "project-link-0");
    const projectLink2 = getByTestId(container, "project-link-1");

    expect(projectLink1).toHaveTextContent(testProjects[0]);
    expect(projectLink2).toHaveTextContent(testProjects[1]);
  });

  test("should clean invalid paths on mount", async ({ expect }) => {
    const testProjects = [
      "/valid/path.yaml",
      "/invalid/path1.yaml",
      "/invalid/path2.yaml",
    ];

    validatePathsMock.mockResolvedValue([
      ["/valid/path.yaml"],
      ["/invalid/path1.yaml", "/invalid/path2.yaml"],
    ]);
    localStorage.setItem("recent-projects", JSON.stringify(testProjects));

    render(<ProjectSelection />);

    await waitFor(() => {
      expect(validatePathsMock).toHaveBeenCalledWith(testProjects);
    });

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        "Removed 2 invalid project(s) from recent list",
      );
    });

    const updatedProjects = JSON.parse(
      localStorage.getItem("recent-projects") || "[]",
    );
    expect(updatedProjects).toEqual(["/valid/path.yaml"]);
  });
});
