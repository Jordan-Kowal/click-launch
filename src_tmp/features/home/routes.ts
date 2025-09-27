import type { RouteConfigItem } from "@/router";
import ProjectSelection from "./pages/ProjectSelection";

export type HomeRouteKey = "homepage";
export type HomeNavigationKey = "homepage";

export const homeRoutes: Record<HomeRouteKey, RouteConfigItem> = {
  homepage: {
    path: "/",
    component: ProjectSelection,
    key: "homepage",
  },
};

export const homeNavigationPaths: Record<HomeNavigationKey, string> = {
  homepage: "/",
};
