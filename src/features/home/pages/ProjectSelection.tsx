import { FolderOpen, History } from "lucide-react";
import { memo, useCallback, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { HeroLayout } from "@/components/layout";
import { Logo } from "@/components/ui";
import { useRecentProjects, useSelectFile } from "@/hooks";
import { ProjectItem } from "../components";

const SHOWN_PROJECTS_MAX = 5;

const ProjectSelection: React.FC = memo(() => {
  const handleOpenProject = useSelectFile();
  const { projects, removeProjects } = useRecentProjects();

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

  useEffect(() => {
    cleanInvalidPaths();
  }, [cleanInvalidPaths]);

  return (
    <HeroLayout dataTestId="project-selection">
      <div className="text-center">
        <div className="max-w-50 mx-auto mb-6">
          <Logo />
        </div>
        <h1>Click Launch</h1>
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
