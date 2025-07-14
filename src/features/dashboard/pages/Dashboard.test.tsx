import { getByTestId, queryByTestId } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, test } from "vitest";
import {
  navigateMock,
  toastErrorMock,
  useSearchMock,
} from "@/tests/mocks/globals";
import { render } from "@/tests/utils";
import Dashboard from "./Dashboard";

describe.concurrent("Dashboard", () => {
  beforeEach(() => {
    useSearchMock.mockReturnValue("?file=/path/to/test.yml");
  });

  test("should render the page with file selected", ({ expect }) => {
    const { container } = render(<Dashboard />);
    const dashboard = getByTestId<HTMLDivElement>(container, "dashboard");

    expect(dashboard).toBeVisible();
    expect(dashboard).toHaveTextContent("Dashboard");
    expect(dashboard).toHaveTextContent("Selected Project File");
    expect(dashboard).toHaveTextContent("/path/to/test.yml");
  });

  test("should navigate to home when back button is clicked", async ({
    expect,
  }) => {
    const user = userEvent.setup();

    const { container } = render(<Dashboard />);
    const backButton = getByTestId(container, "back-button");

    await user.click(backButton);

    expect(navigateMock).toHaveBeenCalledWith("/");
  });

  test("should redirect to home and show error toast when no file is provided", ({
    expect,
  }) => {
    useSearchMock.mockReturnValue("");

    const { container } = render(<Dashboard />);
    const dashboard = queryByTestId<HTMLDivElement>(container, "dashboard");

    expect(dashboard).toBeNull();
    expect(toastErrorMock).toHaveBeenCalledWith("No project file selected.");
    expect(navigateMock).toHaveBeenCalledWith("/");
  });
});
