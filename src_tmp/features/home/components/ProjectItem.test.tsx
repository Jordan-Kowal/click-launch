import { getByTestId } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test } from "vitest";
import { navigateMock } from "@/tests/mocks/globals";
import { render } from "@/tests/utils";
import { ProjectItem } from "./ProjectItem";

describe("ProjectItem", () => {
  test("should render the component", ({ expect }) => {
    const { container } = render(
      <ProjectItem project="/path/to/project.yaml" index={0} />,
    );
    const projectLink = getByTestId(container, "project-link-0");
    expect(projectLink).toHaveTextContent("/path/to/project.yaml");
  });

  test("should navigate to dashboard when clicked", async ({ expect }) => {
    const user = userEvent.setup();
    const testProjects = ["/path/to/project1.yaml", "/path/to/project2.yaml"];

    localStorage.setItem("recent-projects", JSON.stringify(testProjects));

    const { container } = render(
      <ProjectItem project={testProjects[0]} index={0} />,
    );
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

    const { container } = render(
      <ProjectItem project={testProjects[1]} index={1} />,
    );
    const removeButton = getByTestId(container, "remove-project-1");

    await user.click(removeButton);

    // Project should be removed from localStorage
    const updatedProjects = JSON.parse(
      localStorage.getItem("recent-projects") ?? "[]",
    );
    expect(updatedProjects).toEqual(["/path/to/project1.yaml"]);
  });
});
