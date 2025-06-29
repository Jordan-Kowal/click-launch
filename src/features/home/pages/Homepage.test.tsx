import { getByTestId } from "@testing-library/react";
import { describe, test } from "vitest";
import { render } from "@/tests/utils";
import Homepage from "./Homepage";

describe.concurrent("Homepage", () => {
  test("should render the page", ({ expect }) => {
    const { container } = render(<Homepage />);
    const homepage = getByTestId<HTMLDivElement>(container, "homepage");

    expect(homepage).toBeVisible();
    expect(homepage).toHaveTextContent("Devbox Services GUI");
  });

  test("should redirect to settings", ({ expect }) => {
    const { container } = render(<Homepage />);
    const settingsLink = getByTestId<HTMLLinkElement>(
      container,
      "settings-link",
    );

    expect(settingsLink).toBeVisible();
  });
});
