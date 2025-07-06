import { getByTestId } from "@testing-library/react";
import { describe, test, vi } from "vitest";
import { render } from "@/tests/utils";
import { Routes } from "./Routes";

vi.mock("@/api/queries", async () => {
  const actual = await vi.importActual("@/api/queries");
  return {
    ...actual,
    useAppConfig: vi.fn(),
    useSelf: vi.fn(),
  };
});

describe.concurrent("Routes", () => {
  test("should render the component", ({ expect }) => {
    const { container } = render(<Routes />);
    expect(container).toBeDefined();
  });

  test("should render the project selection page by default", async ({
    expect,
  }) => {
    const { container } = render(<Routes />);
    await new Promise((resolve) => setTimeout(resolve, 100));
    const homepage = getByTestId(container, "project-selection");

    expect(homepage).toBeVisible();
  });
});
