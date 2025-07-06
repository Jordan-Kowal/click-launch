import { getByTestId } from "@testing-library/react";
import { describe, test } from "vitest";
import { render } from "@/tests/utils";
import { Main } from "./Main";

describe.concurrent("Main", () => {
  test("should render the component without navbar", ({ expect }) => {
    const { container } = render(
      <Main dataTestId="main">
        <div>Content</div>
      </Main>,
    );

    const main = getByTestId<HTMLDivElement>(container, "main");
    const navbar = getByTestId<HTMLDivElement>(container, "navbar");

    expect(main).toBeVisible();
    expect(main).toHaveTextContent("Content");
    expect(main).toHaveStyle({ marginTop: "64px" });
    expect(navbar).toBeVisible();
  });

  test("should handle extra classnames", ({ expect }) => {
    const { container } = render(
      <Main dataTestId="main" className="extra">
        <div>Content</div>
      </Main>,
    );

    const main = getByTestId<HTMLDivElement>(container, "main");
    expect(main).toBeVisible();
    expect(main).toHaveClass("extra");
  });
});
