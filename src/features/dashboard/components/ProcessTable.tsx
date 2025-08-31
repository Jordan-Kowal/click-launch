import { memo } from "react";
import { useDashboardContext } from "../contexts";
import { ProcessRowWrapper } from "./ProcessRow";

export const ProcessTable: React.FC = memo(() => {
  const { yamlConfig } = useDashboardContext();

  const processes = yamlConfig?.processes || [];

  return (
    <div className="overflow-x-auto">
      <table className="table table-fixed w-full" data-testid="process-table">
        <thead>
          <tr>
            <th className="w-auto min-w-0">Processes</th>
            <th className="w-32 flex-shrink-0">Status</th>
            <th className="w-32 flex-shrink-0">Actions</th>
          </tr>
        </thead>
        <tbody>
          {processes.map((process, index) => (
            <ProcessRowWrapper
              key={process.name}
              process={process}
              index={index}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
});
