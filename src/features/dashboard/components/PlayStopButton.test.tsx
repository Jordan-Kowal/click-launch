import { fireEvent, render, screen } from "@testing-library/react";
import { describe, test, vi } from "vitest";
import * as processContext from "../contexts/ProcessContext";
import { ProcessStatus } from "../enums";
import { PlayStopButton } from "./PlayStopButton";

const mockStartProcess = vi.fn();
const mockStopProcess = vi.fn();

const TestWrapper = ({ status }: { status: ProcessStatus }) => {
  vi.spyOn(processContext, "useProcessContext").mockReturnValue({
    name: "test-process",
    args: [],
    command: "echo hello",
    status,
    updateCommand: vi.fn(),
    startProcess: mockStartProcess,
    stopProcess: mockStopProcess,
  });

  return <PlayStopButton />;
};

describe("PlayStopButton", () => {
  test("Renders play button when stopped and calls startProcess on click", ({
    expect,
  }) => {
    render(<TestWrapper status={ProcessStatus.STOPPED} />);

    const playButton = screen.getByTestId("play-button");
    expect(playButton).toBeInTheDocument();

    fireEvent.click(playButton);
    expect(mockStartProcess).toHaveBeenCalledOnce();
    expect(mockStopProcess).not.toHaveBeenCalled();
  });

  test("Renders play button when crashed and calls startProcess on click", ({
    expect,
  }) => {
    render(<TestWrapper status={ProcessStatus.CRASHED} />);

    const playButton = screen.getByTestId("play-button");
    expect(playButton).toBeInTheDocument();

    fireEvent.click(playButton);
    expect(mockStartProcess).toHaveBeenCalledOnce();
    expect(mockStopProcess).not.toHaveBeenCalled();
  });

  test("Renders starting button when starting and no click handler", ({
    expect,
  }) => {
    render(<TestWrapper status={ProcessStatus.STARTING} />);

    const startingButton = screen.getByTestId("starting-button");
    expect(startingButton).toBeInTheDocument();

    fireEvent.click(startingButton);
    expect(mockStartProcess).not.toHaveBeenCalled();
    expect(mockStopProcess).not.toHaveBeenCalled();
  });

  test("Renders running button when running and calls stopProcess on click", ({
    expect,
  }) => {
    render(<TestWrapper status={ProcessStatus.RUNNING} />);

    const runningButton = screen.getByTestId("running-button");
    expect(runningButton).toBeInTheDocument();

    fireEvent.click(runningButton);
    expect(mockStopProcess).toHaveBeenCalledOnce();
    expect(mockStartProcess).not.toHaveBeenCalled();
  });

  test("Renders stopping button when stopping and no click handler", ({
    expect,
  }) => {
    render(<TestWrapper status={ProcessStatus.STOPPING} />);

    const stoppingButton = screen.getByTestId("stopping-button");
    expect(stoppingButton).toBeInTheDocument();

    fireEvent.click(stoppingButton);
    expect(mockStartProcess).not.toHaveBeenCalled();
    expect(mockStopProcess).not.toHaveBeenCalled();
  });
});
