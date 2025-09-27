import type { RouteDefinition } from "@solidjs/router";
import { useNavigate, useSearchParams } from "@solidjs/router";
import { createEffect } from "solid-js";
import { routePaths } from "@/routes";
import { DashboardProvider } from "./contexts";
import Dashboard from "./pages/Dashboard";

export type DashboardRouteKey = "dashboard";

const DashboardWrapper = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedFile = Array.isArray(searchParams.file) ? searchParams.file[0] : searchParams.file;

  createEffect(() => {
    if (!selectedFile) {
      // TODO: Add toast notification
      console.log("No project file selected.");
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

export const dashboardRoutes: Record<DashboardRouteKey, RouteDefinition> = {
  dashboard: {
    path: "/dashboard",
    component: DashboardWrapper,
  },
};