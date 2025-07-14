import { memo, useCallback, useEffect } from "react";
import { toast } from "react-toastify";
import { Route, Switch, useLocation, useSearch } from "wouter";
import { navigationPaths } from "@/router";
import { DashboardProvider } from "../contexts/DashboardContext";
import Dashboard from "../pages/Dashboard";

export const DashboardRouter = memo(() => {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const selectedFile = params.get("file");
  const [, navigate] = useLocation();

  const goBack = useCallback(() => {
    navigate(navigationPaths.homepage);
  }, [navigate]);

  useEffect(() => {
    if (!selectedFile) {
      toast.error("No project file selected.");
      goBack();
    }
  }, [selectedFile, goBack]);

  if (!selectedFile) {
    return null;
  }

  return (
    <DashboardProvider selectedFile={selectedFile}>
      <Switch>
        <Route path={navigationPaths.dashboard} component={Dashboard} />
      </Switch>
    </DashboardProvider>
  );
});
