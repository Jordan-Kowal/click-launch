import { memo } from "react";
import { useDashboardContext } from "../contexts";
import { ProcessRow } from "./ProcessRow";

const ProcessTable: React.FC = memo(() => {
  const { yamlConfig } = useDashboardContext();

  const processes = yamlConfig?.processes || [];

  return (
    <table className="table" data-testid="process-table">
      <thead>
        <tr>
          <th>Processes</th>
          <th className="w-30">Status</th>
          <th className="w-30">Actions</th>
        </tr>
      </thead>
      <tbody>
        {processes.map((process) => (
          <ProcessRow key={process.name} process={process} />
        ))}
      </tbody>
    </table>
  );
});

export { ProcessTable };
