import { getByTestId, queryByTestId } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, test } from "vitest";
import { navigateMock, openFileDialogMock } from "@/tests/mocks/globals";
import { render } from "@/tests/utils";
import ProjectSelection from "./ProjectSelection";

describe.sequential("ProjectSelection", () => {
  beforeEach(() => {
    navigateMock.mockClear();
    openFileDialogMock.mockClear();
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

  test("should navigate to dashboard when recent project is clicked", async ({
    expect,
  }) => {
    const user = userEvent.setup();
    const testProjects = ["/path/to/project1.yaml", "/path/to/project2.yaml"];

    localStorage.setItem("recent-projects", JSON.stringify(testProjects));

    const { container } = render(<ProjectSelection />);
    const projectLink = getByTestId(container, "project-link-0");

    await user.click(projectLink);

    expect(navigateMock).toHaveBeenCalledWith(
      `/dashboard?file=${encodeURIComponent(testProjects[0])}`,
    );
  });

  test("should remove project when remove button is clicked", async ({
    expect,
  }) => {
    const user = userEvent.setup();
    const testProjects = ["/path/to/project1.yaml", "/path/to/project2.yaml"];

    localStorage.setItem("recent-projects", JSON.stringify(testProjects));

    const { container } = render(<ProjectSelection />);
    const removeButton = getByTestId(container, "remove-project-1");

    await user.click(removeButton);

    // Project should be removed from localStorage
    const updatedProjects = JSON.parse(
      localStorage.getItem("recent-projects") || "[]",
    );
    expect(updatedProjects).toEqual(["/path/to/project1.yaml"]);

    // The button should no longer exist in the DOM after re-render
    const removedProjectLink = queryByTestId(container, "project-link-1");
    expect(removedProjectLink).toBeNull();
  });
});
