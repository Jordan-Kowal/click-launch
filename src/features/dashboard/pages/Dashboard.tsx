import { ArrowLeft } from "lucide-react";
import { memo, useEffect } from "react";
import { toast } from "react-toastify";
import { useLocation, useSearch } from "wouter";
import { Main } from "@/components/layout";
import { routeConfigMap } from "@/router";

type DashboardParams = {
  file?: string;
};

const Dashboard: React.FC = memo(() => {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const selectedFile = params.get("file") as DashboardParams["file"];
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!selectedFile) {
      toast.error("No project file selected. Please select a file first.");
      navigate(routeConfigMap.homepage.path);
    }
  }, [selectedFile, navigate]);

  if (!selectedFile) {
    return null;
  }

  return (
    <Main dataTestId="dashboard">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => navigate(routeConfigMap.homepage.path)}
            data-testid="back-button"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1>Dashboard</h1>
        </div>
        <div className="card bg-base-200 rounded-box p-4">
          <h2 className="card-title text-lg">Selected Project File</h2>
          <p className="text-sm text-base-content/70 break-all">
            {decodeURIComponent(selectedFile)}
          </p>
        </div>
      </div>
    </Main>
  );
});

export default Dashboard;
