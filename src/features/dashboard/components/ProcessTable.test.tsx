import { getAllByTestId, getByTestId } from "@testing-library/react";
import { beforeEach, describe, test, vi } from "vitest";
import { render } from "@/tests/utils";
import type { ProcessConfig } from "@/types/electron";
import * as dashboardContext from "../contexts/DashboardContext";
import { ProcessTable } from "./ProcessTable";

const mockProcesses: ProcessConfig[] = [
  {
    name: "web-server",
    base_command: "npm run dev",
    allows_free_text: false,
    args: [],
  },
  {
    name: "api-server",
    base_command: "python manage.py runserver",
    allows_free_text: false,
    args: [],
  },
];

describe.concurrent("ProcessTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("should render the component", async ({ expect }) => {
    vi.spyOn(dashboardContext, "useDashboardContext").mockReturnValue({
      isLoading: false,
      yamlConfig: {
        project_name: "MyProject",
        processes: mockProcesses,
      },
      errors: [],
      parseFile: vi.fn(),
    });

    const { container } = render(<ProcessTable />);
    const processTable = getByTestId(container, "process-table");
    expect(processTable).toBeVisible();
    expect(processTable).toHaveTextContent("Processes");
    const processRows = getAllByTestId(container, "process-row");
    expect(processRows).toHaveLength(2);
  });
});
