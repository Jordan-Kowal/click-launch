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
    const logoLink = getByTestId<HTMLLinkElement>(
      container,
      "navbar-logo-link",
    );
    const homeLink = getByTestId<HTMLLinkElement>(
      container,
      "navbar-home-link",
    );

    expect(navbar).toBeVisible();
    expect(logoLink.href).toMatch(/\/$/);
    expect(homeLink.href).toMatch(/\/$/);
  });
});
