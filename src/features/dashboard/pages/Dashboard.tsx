import { useNavigate, useSearchParams } from "@solidjs/router";
import { createEffect, Match, onCleanup, onMount, Switch } from "solid-js";
import toast from "solid-toast";
import { BaseLayout, HeroLayout } from "@/components/layout";
import { LoadingRing, Modal, ScreenTitle } from "@/components/ui";
import { routePaths } from "@/routes";
import { ErrorList, ProcessTable } from "../components";
import { DashboardProvider } from "../contexts";
import { useDashboardContext } from "../contexts/";

export type DashboardRouteKey = "dashboard";

const DashboardPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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
  const { isLoading, errors, yamlConfig } = useDashboardContext();
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
            <ScreenTitle
              title={`Dashboard for ${yamlConfig()!.project_name}`}
            />
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
