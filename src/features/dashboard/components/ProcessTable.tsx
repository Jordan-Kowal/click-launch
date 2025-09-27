import { For } from "solid-js";
import { useDashboardContext } from "../contexts";
import { ProcessRowWrapper } from "./ProcessRow";

export const ProcessTable = () => {
  const { yamlConfig, rootDirectory } = useDashboardContext();

  const processes = () => yamlConfig()?.processes || [];

  return (
    <div class="overflow-x-auto">
      <table class="table table-fixed w-full">
        <thead>
          <tr>
            <th class="w-auto min-w-0">Processes</th>
            <th class="w-32 flex-shrink-0">Status</th>
            <th class="w-32 flex-shrink-0">Actions</th>
          </tr>
        </thead>
        <tbody>
          <For each={processes()}>
            {(process, index) => (
              <ProcessRowWrapper
                process={process}
                index={index()}
                rootDirectory={rootDirectory()!}
              />
            )}
          </For>
        </tbody>
      </table>
    </div>
  );
};
