import { getByTestId } from "@testing-library/react";
import { describe, test } from "vitest";
import { render } from "@/tests/utils";
import { NavBar } from "./NavBar";

describe.concurrent("NavBar", () => {
  test("should render the component", ({ expect }) => {
    const { container } = render(<NavBar />);
    const navbar = getByTestId<HTMLDivElement>(container, "navbar");

    expect(navbar).toBeVisible();

    expect(navbar).toHaveTextContent("Devbox Services GUI");
  });

  test("should handle redirects", ({ expect }) => {
    const { container } = render(<NavBar />);

    const navbar = getByTestId<HTMLDivElement>(container, "navbar");
    const homeLink = getByTestId<HTMLLinkElement>(
      container,
      "navbar-home-link",
    );
    const settingsLink = getByTestId<HTMLLinkElement>(
      container,
      "navbar-settings-link",
    );

    expect(navbar).toBeVisible();
    expect(homeLink.href).toMatch(/\/$/);
    expect(settingsLink.href).toMatch(/\/$/);
  });
});
