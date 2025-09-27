import { Match, Switch } from "solid-js";
import { BaseLayout, HeroLayout } from "@/components/layout";
import { LoadingRing, ScreenTitle } from "@/components/ui";
import { ErrorList, ProcessTable } from "../components";
import { useDashboardContext } from "../contexts/";

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

export default Dashboard;
