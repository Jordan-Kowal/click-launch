import { Download, FolderOpen, History } from "lucide-solid";
import { createMemo, createSignal, For, onMount, Show } from "solid-js";
import { HeroLayout } from "@/components/layout";
import { Logo } from "@/components/ui";
import { useAppStorageContext } from "@/contexts";
import { useSelectFile } from "@/hooks";
import { getLatestVersion } from "@/utils/versionCheck";
import { ProjectItem } from "../components";

const SHOWN_PROJECTS_MAX = 5;

const ProjectSelection = () => {
  const handleOpenProject = useSelectFile();
  const { projects, removeProjects } = useAppStorageContext();
  const [latestVersion, setLatestVersion] = createSignal<string | null>(null);

  const shownProjects = createMemo(() =>
    projects().slice(0, SHOWN_PROJECTS_MAX),
  );

  const cleanInvalidPaths = async () => {
    const projectList = projects();
    if (projectList.length === 0) return;
    try {
      const [, invalidPaths] =
        await window.electronAPI.validatePaths(projectList);
      if (invalidPaths.length === 0) return;
      removeProjects(invalidPaths);
      console.log(
        `Removed ${invalidPaths.length} invalid project(s) from recent list`,
      );
    } catch (_) {}
  };

  // Check for updates on boot
  onMount(() => {
    const checkUpdates = async () => {
      const latest = await getLatestVersion();
      setLatestVersion(latest);
    };
    checkUpdates();
    cleanInvalidPaths();
  });

  return (
    <HeroLayout>
      <div class="text-center flex flex-col gap-10">
        <div class="flex flex-col gap-2">
          <div class="max-w-50 mx-auto">
            <Logo />
          </div>
          <h1>Click Launch</h1>
          <Show when={latestVersion()}>
            <div class="alert alert-soft max-w-150 mx-auto mb-6">
              <Download size={32} />
              <div class="text-left">
                <div class="font-semibold">Update Available!</div>
                <div class="text-sm">
                  Version {latestVersion()} is now available
                </div>
              </div>
              <div class="flex gap-2">
                <button
                  type="button"
                  class="btn btn-sm btn-primary"
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
                  class="btn btn-sm btn-ghost"
                  onClick={() => setLatestVersion(null)}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </Show>
        </div>
        <div class="flex w-full flex-col md:flex-row">
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
                <div class="space-y-0 w-full flex flex-col gap-4">
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
      </div>
    </HeroLayout>
  );
};

export default ProjectSelection;
