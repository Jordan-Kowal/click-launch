import { fireEvent, render, screen } from "@testing-library/react";
import { describe, test } from "vitest";
import { ArgType } from "@/electron/enums";
import type { ArgConfig } from "@/electron/types";
import { ProcessRowWrapper } from "./ProcessRow";

const TestWrapper = ({
  name,
  command,
  args = [],
}: {
  name: string;
  command: string;
  args?: ArgConfig[];
}) => (
  <table>
    <tbody>
      <ProcessRowWrapper
        process={{
          name,
          base_command: command,
          args,
        }}
        index={0}
      />
    </tbody>
  </table>
);

describe("ProcessRow", () => {
  test("Renders correctly with command name, status, buttons", ({ expect }) => {
    render(<TestWrapper name="test-service" command="npm start" args={[]} />);

    expect(screen.getByTestId("process-name")).toHaveTextContent(
      "test-service",
    );
    expect(screen.getByTestId("process-command")).toHaveTextContent(
      "npm start",
    );
    expect(screen.getByText("Running")).toBeInTheDocument();
    expect(screen.getByTestId("play-button")).toBeInTheDocument();
    expect(screen.getByTestId("logs-button")).toBeInTheDocument();
  });

  test("Can toggle and show options", async ({ expect }) => {
    const mockArgs: ArgConfig[] = [
      {
        type: ArgType.INPUT,
        name: "Port",
        default: "3000",
        output_prefix: "--port",
        values: [],
      },
    ];

    render(
      <TestWrapper name="test-service" command="npm start" args={mockArgs} />,
    );

    const toggleButton = screen.getByText("Show options");
    const options = screen.getByTestId("process-options-0");

    expect(toggleButton).toBeInTheDocument();
    expect(options).toHaveClass("hidden");

    fireEvent.click(toggleButton);

    expect(screen.getByText("Hide options")).toBeInTheDocument();
    expect(options).not.toHaveClass("hidden");

    fireEvent.click(toggleButton);

    expect(screen.getByText("Show options")).toBeInTheDocument();
    expect(options).toHaveClass("hidden");
  });

  test("Does not render the Show Options button if there are no args", ({
    expect,
  }) => {
    render(<TestWrapper name="test-service" command="npm start" args={[]} />);

    expect(screen.queryByText("Show options")).not.toBeInTheDocument();
  });
});
