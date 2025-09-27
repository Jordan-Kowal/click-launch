import { memo, Suspense, useMemo } from "react";
import { Redirect, Route, Switch } from "wouter";
import { LoadingRing } from "@/components/ui";
import { navigationPaths, routeConfig } from "./routeConfig";

export const Routes = memo(() => {
  const routes = useMemo(
    () =>
      Object.values(routeConfig).map((route) => (
        <Route key={route.key} path={route.path}>
          <Suspense fallback={<LoadingRing />}>
            <route.component />
          </Suspense>
        </Route>
      )),
    [],
  );

  return (
    <Switch>
      {routes}
      <Redirect to={navigationPaths.homepage} replace />
    </Switch>
  );
});
