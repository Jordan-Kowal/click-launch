import { getByTestId } from "@testing-library/react";
import { describe, test } from "vitest";
import { render } from "@/tests/utils";
import type { ProcessConfig } from "@/types/electron";
import { ProcessRow } from "./ProcessRow";

const mockProcess: ProcessConfig = {
  name: "test-service",
  base_command: "npm start",
  allows_free_text: false,
  args: [],
};

describe.concurrent("ProcessRow", () => {
  test("should render the component", async ({ expect }) => {
    const { container } = render(<ProcessRow process={mockProcess} />);
    const processRow = getByTestId(container, "process-row");
    expect(processRow).toBeVisible();
    expect(processRow).toHaveTextContent("test-service");
    expect(processRow).toHaveTextContent("npm start");
    expect(processRow).toHaveTextContent("Running");
  });
});
