import {
  type DashboardNavigationKey,
  type DashboardRouteKey,
  dashboardNavigationPaths,
  dashboardRoutes,
} from "@/features/dashboard/routes";
import {
  type HomeNavigationKey,
  type HomeRouteKey,
  homeNavigationPaths,
  homeRoutes,
} from "@/features/home/routes";

export type RouteKey = HomeRouteKey | DashboardRouteKey;
export type NavigationKey = HomeNavigationKey | DashboardNavigationKey;

export type RouteConfigItem = {
  path: string;
  component: React.ComponentType<any>;
  key: RouteKey;
};

export type RouteConfig = Record<RouteKey, RouteConfigItem>;

export const routeConfig: RouteConfig = {
  ...homeRoutes,
  ...dashboardRoutes,
};

export const navigationPaths: Record<NavigationKey, string> = {
  ...homeNavigationPaths,
  ...dashboardNavigationPaths,
};
