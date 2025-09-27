import { memo } from "react";
import { BaseLayout, HeroLayout } from "@/components/layout";
import { ScreenTitle } from "@/components/ui";
import { LoadingRing } from "@/components/ui/LoadingRing";
import { ErrorList, ProcessTable } from "../components";
import { useDashboardContext } from "../contexts/";

const Dashboard: React.FC = memo(() => {
  const { isLoading, errors, yamlConfig } = useDashboardContext();

  if (isLoading) {
    return (
      <HeroLayout className="text-center" dataTestId="loading-dashboard">
        <LoadingRing />
      </HeroLayout>
    );
  }

  if (errors.length > 0) {
    return (
      <BaseLayout dataTestId="error-dashboard">
        <ScreenTitle title="Dashboard" />
        <ErrorList />
      </BaseLayout>
    );
  }

  return (
    <BaseLayout dataTestId="dashboard">
      <ScreenTitle title={`Dashboard for ${yamlConfig!.project_name}`} />
      <ProcessTable />
    </BaseLayout>
  );
});

export default Dashboard;
