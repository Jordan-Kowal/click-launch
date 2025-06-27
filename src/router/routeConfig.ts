import { type HomeRouteKey, homeRoutes } from "@/features/home/routes";

export type RouteKey = HomeRouteKey;
export type AuthAccess = "public" | "private" | "public-only";

export type RouteConfig = {
  path: string;
  component: React.ComponentType<any>;
  key: RouteKey;
  authAccess: AuthAccess;
};

export type RouteConfigMap = Record<RouteKey, RouteConfig>;

export const routeConfigMap: RouteConfigMap = {
  ...homeRoutes,
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
