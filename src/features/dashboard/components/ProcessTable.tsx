import { createSignal, For, Show } from "solid-js";
import { useDashboardContext } from "../contexts";
import { ProcessGroupHeader } from "./ProcessGroupHeader";
import { ProcessLogDrawer } from "./ProcessLogDrawer";
import { ProcessRow } from "./ProcessRow";

export const ProcessTable = () => {
  const { rootDirectory, getGroupedProcesses, hasGroups, isGroupCollapsed } =
    useDashboardContext();
  const [selectedProcessName, setSelectedProcessName] = createSignal<
    string | null
  >(null);

  let drawerCheckboxRef!: HTMLInputElement;

  const openModal = (processName: string) => {
    setSelectedProcessName(processName);
    drawerCheckboxRef.checked = true;
  };

  const closeModal = () => {
    setSelectedProcessName(null);
    drawerCheckboxRef.checked = false;
  };

  return (
    <div class="drawer drawer-end">
      <input
        ref={drawerCheckboxRef!}
        id="log-drawer"
        type="checkbox"
        class="drawer-toggle"
      />
      <div class="drawer-content">
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
              <For each={getGroupedProcesses()}>
                {(group) => (
                  <>
                    <Show when={hasGroups()}>
                      <ProcessGroupHeader
                        groupName={group.name}
                        totalCount={group.processes.length}
                      />
                    </Show>
                    <Show when={!hasGroups() || !isGroupCollapsed(group.name)}>
                      <For each={group.processes}>
                        {(process, index) => (
                          <ProcessRow
                            process={process}
                            index={index()}
                            rootDirectory={rootDirectory()!}
                            onOpenModal={openModal}
                          />
                        )}
                      </For>
                    </Show>
                  </>
                )}
              </For>
            </tbody>
          </table>
        </div>
      </div>
      <ProcessLogDrawer
        processName={selectedProcessName() || ""}
        isOpen={selectedProcessName() !== null}
        onClose={closeModal}
      />
    </div>
  );
};
