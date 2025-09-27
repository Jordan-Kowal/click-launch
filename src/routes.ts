import type { RouteDefinition } from "@solidjs/router";
import {
  type ProjectRouteKey,
  projectRoutes,
} from "@/features/home/routes";

export type RouteKey = ProjectRouteKey;

export type RouteConfigMap = Record<RouteKey, RouteDefinition>;

export const routeConfigMap: RouteConfigMap = {
  ...projectRoutes,
};

export const pathToRoute: Record<string, RouteDefinition> = Object.values(
  routeConfigMap,
).reduce(
  (acc, route) => {
    acc[route.path] = route;
    return acc;
  },
  {} as Record<string, RouteDefinition>,
);

export const routes: RouteDefinition[] = Object.values(routeConfigMap);
