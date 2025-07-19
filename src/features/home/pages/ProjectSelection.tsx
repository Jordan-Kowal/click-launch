import { FolderOpen, History, X } from "lucide-react";
import { memo, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { HeroLayout } from "@/components/layout";
import { Logo } from "@/components/ui";
import { useRecentProjects, useSelectFile } from "@/hooks";
import { navigationPaths } from "@/router";

const SHOWN_PROJECTS_MAX = 5;

const ProjectSelection: React.FC = memo(() => {
  const handleOpenProject = useSelectFile();
  const { projects, removeProject } = useRecentProjects();

  const shownProjects = useMemo(
    () => projects.slice(0, SHOWN_PROJECTS_MAX),
    [projects],
  );

  const [, navigate] = useLocation();

  const handleRecentProject = useCallback(
    (filePath: string) => {
      navigate(
        `${navigationPaths.dashboard}?file=${encodeURIComponent(filePath)}`,
      );
    },
    [navigate],
  );

  return (
    <HeroLayout dataTestId="project-selection">
      <div className="text-center">
        <div className="max-w-50 mx-auto mb-6">
          <Logo />
        </div>
        <h1>Devbox Services GUI</h1>
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
                    <div key={project} className="flex items-center w-full">
                      <button
                        type="button"
                        className="btn btn-link flex-1 justify-start text-sm "
                        onClick={() => handleRecentProject(project)}
                        data-testid={`project-link-${index}`}
                      >
                        {project}
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm ml-2"
                        onClick={() => removeProject(project)}
                        title="Remove from recent projects"
                        data-testid={`remove-project-${index}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
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
