import type { RouteDefinition } from "@solidjs/router";
import ProjectSelection from "./pages/ProjecSelection";

export type ProjectRouteKey = "projectSelection";

export const projectRoutes: Record<ProjectRouteKey, RouteDefinition> = {
  projectSelection: {
    path: "/",
    component: ProjectSelection,
  },
};
