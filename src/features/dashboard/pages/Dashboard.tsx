import { useNavigate, useSearchParams } from "@solidjs/router";
import { Square } from "lucide-solid";
import {
  createEffect,
  Match,
  onCleanup,
  onMount,
  Show,
  Switch,
} from "solid-js";
import { BaseLayout, HeroLayout } from "@/components/layout";
import { LoadingRing, Modal, ScreenTitle } from "@/components/ui";
import { useToast } from "@/hooks";
import { routePaths } from "@/routes";
import { ErrorList, ProcessTable } from "../components";
import { DashboardProvider, useDashboardContext } from "../contexts";

export type DashboardRouteKey = "dashboard";

const DashboardPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const selectedFile = Array.isArray(searchParams.file)
    ? searchParams.file[0]
    : searchParams.file;

  createEffect(() => {
    if (!selectedFile) {
      toast.error("No project file selected");
      navigate(routePaths.projectSelection);
    }
  });

  if (!selectedFile) {
    return null;
  }

  return (
    <DashboardProvider selectedFile={selectedFile}>
      <Dashboard />
    </DashboardProvider>
  );
};

const Dashboard = () => {
  const { isLoading, errors, yamlConfig, hasRunningProcesses } =
    useDashboardContext();
  let modalRef!: HTMLDialogElement;

  const handleReloadConfirm = async () => {
    await window.electronAPI.stopAllProcesses();
    window.location.reload();
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const isRefresh =
      event.key === "F5" ||
      (event.key === "r" && (event.metaKey || event.ctrlKey));

    if (isRefresh) {
      event.preventDefault();
      modalRef?.showModal();
    }
  };

  const handleStopAll = async () => {
    await window.electronAPI.stopAllProcesses();
  };

  onMount(() => {
    document.addEventListener("keydown", handleKeyDown);
  });

  onCleanup(() => {
    document.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <>
      <Switch>
        <Match when={isLoading()}>
          <HeroLayout class="text-center">
            <LoadingRing />
          </HeroLayout>
        </Match>
        <Match when={errors().length > 0}>
          <BaseLayout>
            <ScreenTitle title="Dashboard" />
            <ErrorList />
          </BaseLayout>
        </Match>
        <Match when={!isLoading() && errors().length === 0}>
          <BaseLayout>
            <div class="flex flex-row gap-2 items-center">
              <ScreenTitle
                title={`Dashboard for ${yamlConfig()!.project_name}`}
              />
              <Show
                when={hasRunningProcesses()}
                fallback={<div class="badge badge-neutral">Idle</div>}
              >
                <div class="badge badge-primary">Running</div>
                <button
                  type="button"
                  class="btn btn-error btn-circle btn-sm"
                  onClick={() => handleStopAll()}
                >
                  <Square size={16} />
                </button>
              </Show>
            </div>
            <ProcessTable />
          </BaseLayout>
        </Match>
      </Switch>
      <Modal ref={modalRef!} onConfirm={handleReloadConfirm} closable={true}>
        <h1 class="text-xl font-bold">Reload application?</h1>
        <p>Any ongoing processes will be shut down before reloading.</p>
      </Modal>
    </>
  );
};

export default DashboardPage;
