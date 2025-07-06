import type { RouteConfig } from "@/router";
import Dashboard from "./pages/Dashboard";

export type DashboardRouteKey = "dashboard";

export const dashboardRoutes: Record<DashboardRouteKey, RouteConfig> = {
  dashboard: {
    path: "/dashboard",
    // component: lazy(() => import("./pages/Dashboard")),
    component: Dashboard,
    key: "dashboard",
  },
};
