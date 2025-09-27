import { X } from "lucide-react";
import { memo, useCallback } from "react";
import { useLocation } from "wouter";
import { useAppStorage } from "@/contexts";
import { navigationPaths } from "@/router";

type ProjectItemProps = {
  project: string;
  index: number;
};

export const ProjectItem: React.FC<ProjectItemProps> = memo(
  ({ project, index }) => {
    const [, navigate] = useLocation();
    const { removeProject } = useAppStorage();

    const handleRecentProject = useCallback(
      (filePath: string) => {
        navigate(
          `${navigationPaths.dashboard}?file=${encodeURIComponent(filePath)}`,
        );
      },
      [navigate],
    );

    return (
      <div className="flex items-center w-full">
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
    );
  },
);
