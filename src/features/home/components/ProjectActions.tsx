import { FolderOpen, History } from "lucide-solid";
import { For, Show } from "solid-js";
import { useAppStorageContext } from "@/contexts";
import { useSelectFile } from "@/hooks";
import { ProjectItem } from "./ProjectItem";

const SHOWN_PROJECTS_MAX = 5;

export const ProjectActions = () => {
  const handleOpenProject = useSelectFile();
  const { projects } = useAppStorageContext();

  const shownProjects = () => projects().slice(0, SHOWN_PROJECTS_MAX);

  return (
    <div class="flex w-full flex-col md:flex-row bg-base-200 rounded-box">
      <div class="card rounded-box p-6 flex-1 flex items-center justify-center">
        <button
          type="button"
          class="btn btn-primary btn-xl"
          onClick={handleOpenProject}
        >
          <FolderOpen />
          Open new project
        </button>
      </div>
      <div class="divider md:divider-horizontal" />
      <div class="card rounded-box p-6 flex-1 flex flex-col">
        <h2 class="card-title mb-4 justify-center !mt-1">
          <History class="w-5 h-5" />
          Recent Projects
        </h2>
        <div class="flex-1 flex items-center justify-center">
          <Show
            when={shownProjects().length > 0}
            fallback={<p class="text-gray-500">No recent projects</p>}
          >
            <div class="space-y-0 w-full flex flex-col gap-0">
              <For each={shownProjects()}>
                {(project, index) => (
                  <ProjectItem project={project} index={index()} />
                )}
              </For>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
};
