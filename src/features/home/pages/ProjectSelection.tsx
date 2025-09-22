import { Download, FolderOpen, History } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { HeroLayout } from "@/components/layout";
import { Logo } from "@/components/ui";
import { useAppStorage } from "@/contexts";
import { useSelectFile } from "@/hooks";
import { getLatestVersion } from "@/utils/versionCheck";
import { ProjectItem } from "../components";

const SHOWN_PROJECTS_MAX = 5;

const ProjectSelection: React.FC = memo(() => {
  const handleOpenProject = useSelectFile();
  const { projects, removeProjects } = useAppStorage();
  const [latestVersion, setLatestVersion] = useState<string | null>(null);

  const shownProjects = useMemo(
    () => projects.slice(0, SHOWN_PROJECTS_MAX),
    [projects],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: Triggered on mount only
  const cleanInvalidPaths = useCallback(async () => {
    if (projects.length === 0) return;
    try {
      const [, invalidPaths] = await window.electronAPI.validatePaths(projects);
      if (invalidPaths.length === 0) return;
      removeProjects(invalidPaths);
      toast.error(
        `Removed ${invalidPaths.length} invalid project(s) from recent list`,
      );
    } catch (_) {}
  }, []);

  // Check for updates on boot
  useEffect(() => {
    const checkUpdates = async () => {
      const latest = await getLatestVersion();
      setLatestVersion(latest);
    };
    checkUpdates();
  }, []);

  useEffect(() => {
    cleanInvalidPaths();
  }, [cleanInvalidPaths]);

  return (
    <HeroLayout dataTestId="project-selection">
      <div className="text-center flex flex-col gap-10">
        <div className="flex flex-col gap-2">
          <div className="max-w-50 mx-auto">
            <Logo />
          </div>
          <h1>Click Launch</h1>
          {latestVersion && (
            <div className="alert alert-soft max-w-150 mx-auto mb-6">
              <Download size={32} />
              <div className="text-left">
                <div className="font-semibold">Update Available!</div>
                <div className="text-sm">
                  Version {latestVersion} is now available
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() =>
                    window.open(
                      "https://github.com/Jordan-Kowal/click-launch/releases/latest",
                      "_blank",
                    )
                  }
                >
                  Download
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => setLatestVersion(null)}
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="flex w-full flex-col md:flex-row">
          <div className="card rounded-box p-6 flex-1 flex items-center justify-center">
            <button
              type="button"
              className="btn btn-primary btn-xl"
              onClick={handleOpenProject}
              data-testid="open-project-button"
            >
              <FolderOpen />
              Open new project
            </button>
          </div>
          <div className="divider md:divider-horizontal" />
          <div className="card rounded-box p-6 flex-1 flex flex-col">
            <h2 className="card-title mb-4 justify-center !mt-1">
              <History className="w-5 h-5" />
              Recent Projects
            </h2>
            <div className="flex-1 flex items-center justify-center">
              {shownProjects.length === 0 ? (
                <p className="text-gray-500">No recent projects</p>
              ) : (
                <div className="space-y-0 w-full flex flex-col gap-4">
                  {shownProjects.map((project, index) => (
                    <ProjectItem
                      key={project}
                      project={project}
                      index={index}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </HeroLayout>
  );
});

export default ProjectSelection;
