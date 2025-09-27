import { getByTestId, render, renderHook } from "@testing-library/react";
import { describe, test } from "vitest";
import { ArgType } from "@/electron/enums";
import type { ProcessConfig } from "@/electron/types";
import { ProcessStatus } from "../enums";
import { ProcessProvider, useProcessContext } from "./ProcessContext";

const mockProcess: ProcessConfig = {
  name: "test-process",
  base_command: "echo hello",
  args: [
    {
      type: ArgType.SELECT,
      name: "Environment",
      default: "dev",
      output_prefix: "--env",
      values: [
        { value: "dev", output: "dev" },
        { value: "prod", output: "prod" },
      ],
    },
  ],
};

describe("ProcessContext", () => {
  test("Hook throws error when used outside provider", ({ expect }) => {
    expect(() => {
      renderHook(() => useProcessContext());
    }).toThrow("useProcess must be used within a ProcessProvider");
  });

  test("Provider renders children correctly", ({ expect }) => {
    const { container } = render(
      <ProcessProvider process={mockProcess} rootDirectory="test-directory">
        <div data-testid="child">Test Child</div>
      </ProcessProvider>,
    );

    const child = getByTestId(container, "child");
    expect(child).toBeInTheDocument();
  });

  test("Hook returns correct values", ({ expect }) => {
    const { result } = renderHook(() => useProcessContext(), {
      wrapper: ({ children }) => (
        <ProcessProvider process={mockProcess} rootDirectory="test-directory">
          {children}
        </ProcessProvider>
      ),
    });

    expect(result.current.name).toBe("test-process");
    expect(result.current.command).toBe("echo hello");
    expect(result.current.args).toHaveLength(mockProcess.args!.length);
    expect(result.current.status).toBe(ProcessStatus.STOPPED);
  });

  test("Hook updates command correctly", ({ expect }) => {
    const { result, rerender } = renderHook(() => useProcessContext(), {
      wrapper: ({ children }) => (
        <ProcessProvider process={mockProcess} rootDirectory="test-directory">
          {children}
        </ProcessProvider>
      ),
    });

    expect(result.current.command).toBe("echo hello");
    result.current.updateCommand("Environment", "--env=prod");
    rerender();
    expect(result.current.command).toBe("echo hello --env=prod");
  });
});
