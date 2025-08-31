import { fireEvent, getByTestId, render } from "@testing-library/react";
import { beforeEach, describe, test, vi } from "vitest";
import * as hooks from "@/hooks";
import * as dashboardContext from "../contexts/DashboardContext";
import { ErrorList } from "./ErrorList";

const mockParseFile = vi.fn();
const mockSelectFile = vi.fn();

describe.concurrent("ErrorList", () => {
  beforeEach(() => {
    vi.spyOn(hooks, "useSelectFile").mockReturnValue(mockSelectFile);
    mockParseFile.mockClear();
    mockSelectFile.mockClear();
  });

  test("returns null when no errors", ({ expect }) => {
    vi.spyOn(dashboardContext, "useDashboardContext").mockReturnValue({
      isLoading: false,
      yamlConfig: null,
      rootDirectory: null,
      errors: [],
      parseFile: mockParseFile,
    });

    const { container } = render(<ErrorList />);
    expect(container.firstChild).toBeNull();
  });

  test("renders error content when errors exist", ({ expect }) => {
    const mockErrors = [
      { message: "Invalid syntax", path: "line 5" },
      { message: "Missing field", path: "line 10" },
      { message: "Type error" },
    ];

    vi.spyOn(dashboardContext, "useDashboardContext").mockReturnValue({
      isLoading: false,
      yamlConfig: null,
      rootDirectory: null,
      errors: mockErrors,
      parseFile: mockParseFile,
    });

    const { getByText } = render(<ErrorList />);

    expect(getByText("3 error(s) found")).toBeInTheDocument();
    expect(getByText("Invalid syntax")).toBeInTheDocument();
    expect(getByText("line 5")).toBeInTheDocument();
    expect(getByText("Missing field")).toBeInTheDocument();
    expect(getByText("line 10")).toBeInTheDocument();

    expect(getByText("01")).toBeInTheDocument();
    expect(getByText("02")).toBeInTheDocument();
    expect(getByText("03")).toBeInTheDocument();
  });

  test("retry button calls parseFile", ({ expect }) => {
    vi.spyOn(dashboardContext, "useDashboardContext").mockReturnValue({
      isLoading: false,
      yamlConfig: null,
      rootDirectory: null,
      errors: [{ message: "Test error" }],
      parseFile: mockParseFile,
    });

    const { container } = render(<ErrorList />);
    const retryButton = getByTestId(container, "retry-button");

    fireEvent.click(retryButton);

    expect(mockParseFile).toHaveBeenCalledOnce();
  });

  test("select new file button calls useSelectFile", ({ expect }) => {
    vi.spyOn(dashboardContext, "useDashboardContext").mockReturnValue({
      isLoading: false,
      yamlConfig: null,
      rootDirectory: null,
      errors: [{ message: "Test error" }],
      parseFile: mockParseFile,
    });

    const { container } = render(<ErrorList />);
    const selectFileButton = getByTestId(container, "select-new-file-button");

    fireEvent.click(selectFileButton);

    expect(mockSelectFile).toHaveBeenCalledOnce();
  });

  test("displays error numbers correctly for double digits", ({ expect }) => {
    const mockErrors = Array.from({ length: 12 }, (_, i) => ({
      message: `Error ${i + 1}`,
    }));

    vi.spyOn(dashboardContext, "useDashboardContext").mockReturnValue({
      isLoading: false,
      yamlConfig: null,
      rootDirectory: null,
      errors: mockErrors,
      parseFile: mockParseFile,
    });

    const { getByText } = render(<ErrorList />);

    expect(getByText("09")).toBeInTheDocument();
    expect(getByText("10")).toBeInTheDocument();
    expect(getByText("11")).toBeInTheDocument();
    expect(getByText("12")).toBeInTheDocument();
  });
});
