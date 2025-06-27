import { memo, Suspense, useMemo } from "react";
import { Redirect, Route, Switch } from "wouter";
import { LoadingRing } from "@/components/ui";
import { routeConfigMap } from "./routeConfig";

export const Routes = memo(() => {
  const routes = useMemo(
    () =>
      Object.values(routeConfigMap).map((route) => (
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
      <Redirect to={routeConfigMap.homepage.path} replace />
    </Switch>
  );
});
