import {
  type DashboardRouteKey,
  dashboardRoutes,
} from "@/features/dashboard/routes";
import { type HomeRouteKey, homeRoutes } from "@/features/home/routes";

export type RouteKey = HomeRouteKey | DashboardRouteKey;

export type RouteConfig = {
  path: string;
  component: React.ComponentType<any>;
  key: RouteKey;
};

export type RouteConfigMap = Record<RouteKey, RouteConfig>;

export const routeConfigMap: RouteConfigMap = {
  ...homeRoutes,
  ...dashboardRoutes,
};

export const pathToRoute: Record<string, RouteConfig> = Object.values(
  routeConfigMap,
).reduce(
  (acc, route) => {
    acc[route.path] = route;
    return acc;
  },
  {} as Record<string, RouteConfig>,
);
