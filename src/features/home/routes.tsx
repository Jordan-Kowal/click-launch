import type { RouteDefinition } from "@solidjs/router";
import { ErrorBoundary, lazy } from "solid-js";
import { ErrorFallback } from "@/components/ui";

const ProjectSelection = lazy(() => import("./pages/ProjectSelection"));

export type ProjectRouteKey = "projectSelection";

export const projectRoutes: Record<ProjectRouteKey, RouteDefinition> = {
  projectSelection: {
    path: "/",
    component: () => (
      <ErrorBoundary
        fallback={(error, reset) => (
          <ErrorFallback error={error} reset={reset} />
        )}
      >
        <ProjectSelection />
      </ErrorBoundary>
    ),
  },
};
