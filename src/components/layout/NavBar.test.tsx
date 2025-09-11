import { fireEvent, getByTestId, waitFor } from "@testing-library/react";
import { beforeEach, describe, test } from "vitest";
import {
  navigateMock,
  stopAllProcessesMock,
  useLocationMock,
} from "@/tests/mocks/globals";
import { render } from "@/tests/utils";
import { NavBar } from "./NavBar";

describe.concurrent("NavBar", () => {
  beforeEach(() => {
    navigateMock.mockClear();
  });

  test("should render the component", ({ expect }) => {
    const { container } = render(<NavBar />);
    const navbar = getByTestId<HTMLDivElement>(container, "navbar");

    expect(navbar).toBeVisible();
    expect(navbar).toHaveTextContent("Click Launch");
  });

  test("should handle redirects", ({ expect }) => {
    const { container } = render(<NavBar />);

    const navbar = getByTestId<HTMLDivElement>(container, "navbar");
    const homeLink = getByTestId<HTMLLinkElement>(
      container,
      "navbar-home-link",
    );

    expect(navbar).toBeVisible();
    expect(homeLink.href).toMatch(/\/$/);
  });

  test("home button does nothing when on homepage", ({ expect }) => {
    useLocationMock.mockReturnValue(["/", navigateMock]);

    const { container } = render(<NavBar />);
    const homeButton = getByTestId(container, "navbar-project-selection-link");

    fireEvent.click(homeButton);

    expect(navigateMock).not.toHaveBeenCalled();
  });

  test("home button opens modal and redirects when confirmed", async ({
    expect,
  }) => {
    useLocationMock.mockReturnValue(["/dashboard", navigateMock]);

    const { container } = render(<NavBar />);
    const homeButton = getByTestId(container, "navbar-project-selection-link");

    fireEvent.click(homeButton);

    const modal = container.querySelector("dialog[open]");
    expect(modal).toBeInTheDocument();

    const confirmButton = getByTestId(container, "modal-confirm-button");
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(stopAllProcessesMock).toHaveBeenCalled();
    });
  });
});
