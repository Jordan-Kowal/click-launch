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

  test("Can toggle and show options", ({ expect }) => {
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
    expect(toggleButton).toBeInTheDocument();

    fireEvent.click(toggleButton);

    expect(screen.getByText("Hide options")).toBeInTheDocument();
    expect(screen.getByText("Port:")).toBeInTheDocument();
    expect(screen.getByTestId("Port-input")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Hide options"));

    expect(screen.getByText("Show options")).toBeInTheDocument();
    expect(screen.queryByText("Port:")).not.toBeInTheDocument();
  });
});
