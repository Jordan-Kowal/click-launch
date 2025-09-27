import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, test, vi } from "vitest";
import * as processContext from "../contexts/ProcessContext";
import { ProcessStatus } from "../enums";
import { PlayStopButton } from "./PlayStopButton";

const mockStartProcess = vi.fn();
const mockStopProcess = vi.fn();

// Mock the electron API
const mockElectronAPI = {
  startProcess: vi.fn(),
  stopProcess: vi.fn(),
  getProcessStatus: vi.fn(),
};

Object.defineProperty(window, "electronAPI", {
  value: mockElectronAPI,
  writable: true,
});

const TestWrapper = ({ status }: { status: ProcessStatus }) => {
  vi.spyOn(processContext, "useProcessContext").mockReturnValue({
    name: "test-process",
    args: [],
    command: "echo hello",
    status,
    updateCommand: vi.fn(),
    startProcess: mockStartProcess,
    stopProcess: mockStopProcess,
    processId: "test-process-id",
    startTime: null,
  });

  return <PlayStopButton />;
};

describe("PlayStopButton", () => {
  test("Renders play button when stopped and calls startProcess on click", async ({
    expect,
  }) => {
    render(<TestWrapper status={ProcessStatus.STOPPED} />);

    const playButton = screen.getByTestId("play-button");
    expect(playButton).toBeInTheDocument();

    fireEvent.click(playButton);
    await waitFor(() => {
      expect(mockStartProcess).toHaveBeenCalledOnce();
    });
    expect(mockStopProcess).not.toHaveBeenCalled();
  });

  test("Renders play button when crashed and calls startProcess on click", async ({
    expect,
  }) => {
    render(<TestWrapper status={ProcessStatus.CRASHED} />);

    const playButton = screen.getByTestId("play-button");
    expect(playButton).toBeInTheDocument();

    fireEvent.click(playButton);
    await waitFor(() => {
      expect(mockStartProcess).toHaveBeenCalledOnce();
    });
    expect(mockStopProcess).not.toHaveBeenCalled();
  });

  test("Renders starting button when starting and no click handler", async ({
    expect,
  }) => {
    render(<TestWrapper status={ProcessStatus.STARTING} />);

    const startingButton = screen.getByTestId("starting-button");
    expect(startingButton).toBeInTheDocument();

    fireEvent.click(startingButton);

    // Wait a bit to ensure no async calls happen
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockStartProcess).not.toHaveBeenCalled();
    expect(mockStopProcess).not.toHaveBeenCalled();
  });

  test("Renders running button when running and calls stopProcess on click", async ({
    expect,
  }) => {
    render(<TestWrapper status={ProcessStatus.RUNNING} />);

    const runningButton = screen.getByTestId("running-button");
    expect(runningButton).toBeInTheDocument();

    fireEvent.click(runningButton);
    await waitFor(() => {
      expect(mockStopProcess).toHaveBeenCalledOnce();
    });
    expect(mockStartProcess).not.toHaveBeenCalled();
  });

  test("Renders stopping button when stopping and no click handler", async ({
    expect,
  }) => {
    render(<TestWrapper status={ProcessStatus.STOPPING} />);

    const stoppingButton = screen.getByTestId("stopping-button");
    expect(stoppingButton).toBeInTheDocument();

    fireEvent.click(stoppingButton);

    // Wait a bit to ensure no async calls happen
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockStartProcess).not.toHaveBeenCalled();
    expect(mockStopProcess).not.toHaveBeenCalled();
  });
});
