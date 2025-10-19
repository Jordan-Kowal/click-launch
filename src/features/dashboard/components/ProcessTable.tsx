import { createSignal, For } from "solid-js";
import { useDashboardContext } from "../contexts";
import { ProcessLogModal } from "./ProcessLogModal";
import { ProcessRow } from "./ProcessRow";

export const ProcessTable = () => {
  const { yamlConfig, rootDirectory } = useDashboardContext();
  const [selectedProcessName, setSelectedProcessName] = createSignal<
    string | null
  >(null);

  const processes = () => yamlConfig()?.processes || [];

  const openModal = (processName: string) =>
    setSelectedProcessName(processName);
  const closeModal = () => setSelectedProcessName(null);

  return (
    <>
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
                <ProcessRow
                  process={process}
                  index={index()}
                  rootDirectory={rootDirectory()!}
                  onOpenModal={openModal}
                />
              )}
            </For>
          </tbody>
        </table>
      </div>
      <ProcessLogModal
        processName={selectedProcessName() || ""}
        isOpen={selectedProcessName() !== null}
        onClose={closeModal}
      />
    </>
  );
};
