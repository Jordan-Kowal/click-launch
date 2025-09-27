import { render, screen } from "@testing-library/react";
import { describe, test } from "vitest";
import { ArgType } from "@/electron/enums";
import type { ArgConfig, ProcessConfig } from "@/electron/types";
import { ProcessProvider } from "../contexts/ProcessContext";
import { ProcessArg } from "./ProcessArg";

const mockProcess: ProcessConfig = {
  name: "test-process",
  base_command: "echo hello",
  args: [],
};

const TestWrapper = ({ argConfig }: { argConfig: ArgConfig }) => (
  <ProcessProvider process={mockProcess} rootDirectory="test-directory">
    <ProcessArg argConfig={argConfig} />
  </ProcessProvider>
);

describe("ProcessArg", () => {
  test("Renders a pre-checked toggle", ({ expect }) => {
    const argConfig: ArgConfig = {
      type: ArgType.TOGGLE,
      name: "Debug Mode",
      default: true,
      values: [
        { value: true, output: "--true" },
        { value: false, output: "--false" },
      ],
    };

    render(<TestWrapper argConfig={argConfig} />);

    expect(screen.getByText("Debug Mode:")).toBeInTheDocument();
    expect(screen.getByTestId("Debug Mode-toggle")).toBeChecked();
  });

  test("Renders an unchecked toggle", ({ expect }) => {
    const argConfig: ArgConfig = {
      type: ArgType.TOGGLE,
      name: "Verbose Mode",
      default: false,
      values: [
        { value: true, output: "--true" },
        { value: false, output: "--false" },
      ],
    };

    render(<TestWrapper argConfig={argConfig} />);

    expect(screen.getByText("Verbose Mode:")).toBeInTheDocument();
    expect(screen.getByTestId("Verbose Mode-toggle")).not.toBeChecked();
  });

  test("Renders a select with default value and all options", ({ expect }) => {
    const argConfig: ArgConfig = {
      type: ArgType.SELECT,
      name: "Environment",
      default: "prod",
      values: [
        { value: "dev", output: "--development" },
        { value: "prod", output: "--production" },
      ],
    };

    render(<TestWrapper argConfig={argConfig} />);

    expect(screen.getByText("Environment:")).toBeInTheDocument();
    const select = screen.getByTestId("Environment-select");
    expect(select).toBeInTheDocument();

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveTextContent("dev");
    expect(options[1]).toHaveTextContent("prod");
  });

  test("Renders an input with default value", ({ expect }) => {
    const argConfig: ArgConfig = {
      type: ArgType.INPUT,
      name: "Port",
      default: "test value",
      output_prefix: "--port",
    };

    render(<TestWrapper argConfig={argConfig} />);

    expect(screen.getByText("Port:")).toBeInTheDocument();
    expect(screen.getByTestId("Port-input")).toBeInTheDocument();
    expect(screen.getByTestId("Port-input")).toHaveValue("test value");
  });

  test("Renders nothing for unsupported type", ({ expect }) => {
    const argConfig: ArgConfig = {
      type: "UNSUPPORTED" as ArgType,
      name: "Unknown",
      default: "",
      output_prefix: "",
      values: [],
    };

    const { container } = render(<TestWrapper argConfig={argConfig} />);

    expect(container).toBeEmptyDOMElement();
  });
});
