import type { RouteDefinition } from "@solidjs/router";
import { type ProjectRouteKey, projectRoutes } from "@/features/home/routes";

export type RouteKey = ProjectRouteKey;

export type RouteConfigMap = Record<RouteKey, RouteDefinition>;

export const routeConfigMap: RouteConfigMap = {
  ...projectRoutes,
};

export const routes: RouteDefinition[] = Object.values(routeConfigMap);

export const routePaths: Record<RouteKey, string> = Object.entries(
  routeConfigMap,
).reduce(
  (acc, [key, route]) => {
    acc[key as RouteKey] = route.path;
    return acc;
  },
  {} as Record<RouteKey, string>,
);
