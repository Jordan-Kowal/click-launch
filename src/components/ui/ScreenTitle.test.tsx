import { fireEvent, getByTestId, queryByTestId } from "@testing-library/react";
import { describe, test } from "vitest";
import { navigateMock } from "@/tests/mocks/globals";
import { render } from "@/tests/utils";
import { ScreenTitle } from "./ScreenTitle";

describe.concurrent("ScreenTitle", () => {
  test("should render the component with title", ({ expect }) => {
    const { container } = render(<ScreenTitle title="Test Title" />);

    const backButton = queryByTestId(container, "back-button");
    const title = container.querySelector("h2");

    expect(backButton).toBeNull();
    expect(title).toBeVisible();
    expect(title).toHaveTextContent("Test Title");
  });

  test("should call navigate with backHref when back button is clicked", ({
    expect,
  }) => {
    const { container } = render(
      <ScreenTitle title="Test Title" backHref="/back-url" />,
    );

    const backButton = getByTestId(container, "back-button");

    fireEvent.click(backButton);

    expect(navigateMock).toHaveBeenCalledWith("/back-url");
  });
});
