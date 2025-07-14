import type { RouteConfigItem } from "@/router";
import { DashboardRouter } from "./DashboardRouter";

export type DashboardRouteKey = "dashboard";
export type DashboardNavigationKey = "dashboard";

export const dashboardRoutes: Record<DashboardRouteKey, RouteConfigItem> = {
  dashboard: {
    path: "/dashboard*",
    component: DashboardRouter,
    key: "dashboard",
  },
};

export const dashboardNavigationPaths: Record<DashboardNavigationKey, string> =
  {
    dashboard: "/dashboard",
  };
