import { useNavigate, useSearchParams } from "@solidjs/router";
import { createEffect, Match, Switch } from "solid-js";
import toast from "solid-toast";
import { BaseLayout, HeroLayout } from "@/components/layout";
import { LoadingRing, ScreenTitle } from "@/components/ui";
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

  return (
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
          <ScreenTitle title={`Dashboard for ${yamlConfig()!.project_name}`} />
          <ProcessTable />
        </BaseLayout>
      </Match>
    </Switch>
  );
};

export default DashboardPage;
