import { memo } from "react";
import { BaseLayout, HeroLayout } from "@/components/layout";
import { ScreenTitle } from "@/components/ui";
import { LoadingRing } from "@/components/ui/LoadingRing";
import { ErrorList } from "../components";
import { useDashboardContext } from "../contexts/";

const Dashboard: React.FC = memo(() => {
  const { isLoading, errors } = useDashboardContext();

  if (isLoading) {
    return (
      <HeroLayout className="text-center">
        <LoadingRing />
      </HeroLayout>
    );
  }

  if (errors.length > 0) {
    return (
      <BaseLayout>
        <ScreenTitle title="Dashboard" />
        <ErrorList />
      </BaseLayout>
    );
  }

  return (
    <BaseLayout>
      <ScreenTitle title="Dashboard" />
    </BaseLayout>
  );
});

export default Dashboard;
