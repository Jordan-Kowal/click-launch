import type { RouteDefinition } from "@solidjs/router";
import ProjectSelection from "./pages/ProjectSelection";

export type ProjectRouteKey = "projectSelection";

export const projectRoutes: Record<ProjectRouteKey, RouteDefinition> = {
  projectSelection: {
    path: "/",
    component: ProjectSelection,
  },
};
