import type { RouteDefinition } from "@solidjs/router";
import { lazy } from "solid-js";

export type DashboardRouteKey = "dashboard";

export const dashboardRoutes: Record<DashboardRouteKey, RouteDefinition> = {
  dashboard: {
    path: "/dashboard",
    component: lazy(() => import("./pages/Dashboard")),
  },
};
