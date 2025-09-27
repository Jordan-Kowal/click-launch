import { useNavigate } from "@solidjs/router";
import { X } from "lucide-solid";
import { useAppStorage } from "@/contexts";
import { routePaths } from "@/routes";

type ProjectItemProps = {
  project: string;
  index: number;
};

export const ProjectItem = (props: ProjectItemProps) => {
  const navigate = useNavigate();
  const { removeProject } = useAppStorage();

  const handleRecentProject = (filePath: string) => {
    navigate(`${routePaths.dashboard}?file=${encodeURIComponent(filePath)}`);
  };

  return (
    <div class="flex items-center w-full">
      <button
        type="button"
        class="btn btn-link flex-1 justify-start text-sm"
        onClick={() => handleRecentProject(props.project)}
      >
        {props.project}
      </button>
      <button
        type="button"
        class="btn btn-ghost btn-sm ml-2"
        onClick={() => removeProject(props.project)}
        title="Remove from recent projects"
      >
        <X class="w-4 h-4" />
      </button>
    </div>
  );
};
