import type { RouteDefinition } from "@solidjs/router";
import { lazy } from "solid-js";

export type ProjectRouteKey = "projectSelection";

export const projectRoutes: Record<ProjectRouteKey, RouteDefinition> = {
  projectSelection: {
    path: "/",
    component: lazy(() => import("./pages/ProjectSelection")),
  },
};
