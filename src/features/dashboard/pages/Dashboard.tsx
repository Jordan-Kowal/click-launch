import { BaseLayout, HeroLayout } from "@/components/layout";
import { LoadingRing, ScreenTitle } from "@/components/ui";
import { ErrorList, ProcessTable } from "../components";
import { useDashboardContext } from "../contexts/";

const Dashboard = () => {
  const { isLoading, errors, yamlConfig } = useDashboardContext();

  if (isLoading()) {
    return (
      <HeroLayout class="text-center">
        <LoadingRing />
      </HeroLayout>
    );
  }

  if (errors().length > 0) {
    return (
      <BaseLayout>
        <ScreenTitle title="Dashboard" />
        <ErrorList />
      </BaseLayout>
    );
  }

  return (
    <BaseLayout>
      <ScreenTitle title={`Dashboard for ${yamlConfig()!.project_name}`} />
      <ProcessTable />
    </BaseLayout>
  );
};

export default Dashboard;
