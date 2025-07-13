import { getByTestId } from "@testing-library/react";
import { describe, test } from "vitest";
import { render } from "@/tests/utils";
import { BaseLayout } from "./BaseLayout";

describe.concurrent("BaseLayout", () => {
  test("should render the component without navbar", ({ expect }) => {
    const { container } = render(
      <BaseLayout dataTestId="main">
        <div>Content</div>
      </BaseLayout>,
    );

    const main = getByTestId<HTMLDivElement>(container, "main");
    const navbar = getByTestId<HTMLDivElement>(container, "navbar");

    expect(main).toBeVisible();
    expect(main).toHaveTextContent("Content");
    expect(navbar).toBeVisible();
  });

  test("should handle extra classnames", ({ expect }) => {
    const { container } = render(
      <BaseLayout dataTestId="main" className="extra">
        <div>Content</div>
      </BaseLayout>,
    );

    const main = getByTestId<HTMLDivElement>(container, "main");
    expect(main).toBeVisible();
    expect(main).toHaveClass("extra");
  });
});
