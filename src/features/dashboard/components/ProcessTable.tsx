import { createSignal, For, Show } from "solid-js";
import { useSettingsContext } from "@/contexts";
import { useDashboardContext } from "../contexts";
import { ProcessGroupHeader } from "./ProcessGroupHeader";
import { ProcessLogDrawer } from "./ProcessLogDrawer";
import { ProcessRow } from "./ProcessRow";
import { ResourceDrawer } from "./ResourceDrawer";

export const ProcessTable = () => {
  const { rootDirectory, getGroupedProcesses, hasGroups, isGroupCollapsed } =
    useDashboardContext();
  const { settings } = useSettingsContext();
  const [selectedProcessName, setSelectedProcessName] = createSignal<
    string | null
  >(null);
  const [selectedResourceProcessName, setSelectedResourceProcessName] =
    createSignal<string | null>(null);

  let drawerCheckboxRef!: HTMLInputElement;
  let resourceDrawerCheckboxRef!: HTMLInputElement;

  const openModal = (processName: string) => {
    closeResourceDrawer();
    setSelectedProcessName(processName);
    drawerCheckboxRef.checked = true;
  };

  const closeModal = () => {
    setSelectedProcessName(null);
    drawerCheckboxRef.checked = false;
  };

  const openResourceDrawer = (processName: string) => {
    closeModal();
    setSelectedResourceProcessName(processName);
    resourceDrawerCheckboxRef.checked = true;
  };

  const closeResourceDrawer = () => {
    setSelectedResourceProcessName(null);
    resourceDrawerCheckboxRef.checked = false;
  };

  return (
    <div class="drawer drawer-end">
      <input
        ref={resourceDrawerCheckboxRef!}
        id="resource-drawer"
        type="checkbox"
        class="drawer-toggle"
      />
      <div class="drawer-content">
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
                    <th class="w-32 shrink-0">Status</th>
                    <Show when={settings().showResourceMonitor}>
                      <th class="w-32 shrink-0">Resources</th>
                    </Show>
                    <th class="w-40 shrink-0">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <For each={getGroupedProcesses()}>
                    {(group) => (
                      <>
                        <Show when={hasGroups() && settings().showGrouping}>
                          <ProcessGroupHeader
                            groupName={group.name}
                            totalCount={group.processes.length}
                          />
                        </Show>
                        <Show
                          when={
                            !hasGroups() ||
                            !settings().showGrouping ||
                            !isGroupCollapsed(group.name)
                          }
                        >
                          <For each={group.processes}>
                            {(process, index) => (
                              <ProcessRow
                                process={process}
                                index={index()}
                                rootDirectory={rootDirectory()!}
                                onOpenLogs={openModal}
                                onOpenResourceDrawer={openResourceDrawer}
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
            onOpenResourceDrawer={() => {
              const name = selectedProcessName();
              if (name) openResourceDrawer(name);
            }}
          />
        </div>
      </div>
      <ResourceDrawer
        processName={selectedResourceProcessName() || ""}
        isOpen={selectedResourceProcessName() !== null}
        onClose={closeResourceDrawer}
      />
    </div>
  );
};
