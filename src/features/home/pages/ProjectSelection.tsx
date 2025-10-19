import { onMount } from "solid-js";
import { HeroLayout } from "@/components/layout";
import { useAppStorageContext } from "@/contexts";
import { ProjectActions, RippledLogo, VersionStatus } from "../components";

const ProjectSelection = () => {
  const { projects, removeProjects } = useAppStorageContext();

  const cleanInvalidPaths = async () => {
    const projectList = projects();
    if (projectList.length === 0) return;
    try {
      const [, invalidPaths] =
        await window.electronAPI.validatePaths(projectList);
      if (invalidPaths.length === 0) return;
      removeProjects(invalidPaths);
    } catch (_) {}
  };

  onMount(() => {
    cleanInvalidPaths();
  });

  return (
    <HeroLayout>
      <div class="text-center flex flex-col gap-10 relative">
        <RippledLogo />
        <VersionStatus />
        <ProjectActions />
      </div>
    </HeroLayout>
  );
};

export default ProjectSelection;
