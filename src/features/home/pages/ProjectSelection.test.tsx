import { getByTestId } from "@testing-library/react";
import { describe, test } from "vitest";
import { render } from "@/tests/utils";
import ProjectSelection from "./ProjectSelection";

describe.concurrent("ProjectSelection", () => {
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
});
