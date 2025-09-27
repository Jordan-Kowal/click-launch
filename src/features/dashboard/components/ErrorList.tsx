import { CircleAlert, FolderOpen, RotateCcw } from "lucide-solid";
import { For, Show } from "solid-js";
import { useSelectFile } from "@/hooks";
import { useDashboardContext } from "../contexts";

export const ErrorList = () => {
  const { errors, parseFile } = useDashboardContext();
  const handleOpenProject = useSelectFile();

  if (errors().length === 0) {
    return null;
  }

  return (
    <div class="mt-4">
      <div
        role="alert"
        class="alert alert-error alert-soft alert-vertical sm:alert-horizontal"
      >
        <CircleAlert class="size-6 text-error" />
        <span>
          <span class="font-bold">{errors().length} error(s) found</span>.
          Failed to parse the file. Please fix them before continuing.
        </span>
        <div class="flex gap-2">
          <button
            type="button"
            class="btn btn-error btn-sm btn-outline"
            onClick={parseFile}
          >
            <RotateCcw class="size-4" />
            Retry
          </button>
          <button
            type="button"
            class="btn btn-error btn-sm btn-outline"
            onClick={handleOpenProject}
          >
            <FolderOpen class="size-4" />
            Select a new file
          </button>
        </div>
      </div>
      <ul class="list pl-0!">
        <For each={errors()}>
          {(error, index) => (
            <li class="list-row items-center p-2">
              <CircleAlert class="size-8 text-error" />
              <div class="text-2xl font-thin opacity-30">
                {index() <= 8 ? `0${index() + 1}` : index() + 1}
              </div>
              <div class="list-col-grow">
                <div>{error.message}</div>
                <Show when={error.path}>
                  <div class="text-xs uppercase font-semibold opacity-60">
                    {error.path}
                  </div>
                </Show>
              </div>
            </li>
          )}
        </For>
      </ul>
    </div>
  );
};
