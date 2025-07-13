import { ArrowLeft } from "lucide-react";
import { memo, useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useLocation, useSearch } from "wouter";
import { HeroLayout } from "@/components/layout";
import { LoadingRing } from "@/components/ui/LoadingRing";
import { routeConfigMap } from "@/router";
import type { ValidationResult } from "@/types/electron";

type DashboardParams = {
  file?: string;
};

const Dashboard: React.FC = memo(() => {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const selectedFile = params.get("file") as DashboardParams["file"];
  const [, navigate] = useLocation();

  const [isLoading, setIsLoading] = useState(true);
  const [{ errors }, setYamlInfo] = useState<ValidationResult>({
    isValid: false,
    config: null,
    errors: [],
  });

  const parseFile = useCallback(async (filePath: string) => {
    setIsLoading(true);
    const result = await window.electronAPI.validateYaml(filePath);
    setYamlInfo(result);
    setIsLoading(false);
  }, []);

  /* Redirects if no file, otherwise parses file */
  useEffect(() => {
    if (!selectedFile) {
      toast.error("No project file selected.");
      navigate(routeConfigMap.homepage.path);
    } else {
      parseFile(selectedFile);
    }
  }, [selectedFile, parseFile, navigate]);

  // Can return `null` as we redirect if no file
  if (!selectedFile) {
    return null;
  }

  if (isLoading) {
    return (
      <HeroLayout className="text-center">
        <LoadingRing />
      </HeroLayout>
    );
  }

  if (errors.length > 0) {
    return null;
  }

  return (
    <HeroLayout dataTestId="dashboard">
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
    </HeroLayout>
  );
});

export default Dashboard;
