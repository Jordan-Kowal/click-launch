import type { RouteConfig } from "@/router";
import ProjectSelection from "./pages/ProjectSelection";

export type HomeRouteKey = "homepage";

export const homeRoutes: Record<HomeRouteKey, RouteConfig> = {
  homepage: {
    path: "/",
    // component: lazy(() => import("./pages/ProjectSelection")),
    component: ProjectSelection,
    key: "homepage",
  },
};
