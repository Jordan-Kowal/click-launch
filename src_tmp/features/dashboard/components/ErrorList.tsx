import { CircleAlert, FolderOpen, RotateCcw } from "lucide-react";
import { memo } from "react";
import { useSelectFile } from "@/hooks";
import { useDashboardContext } from "../contexts";

export const ErrorList = memo(() => {
  const { errors, parseFile } = useDashboardContext();
  const handleOpenProject = useSelectFile();

  if (errors.length === 0) {
    return null;
  }

  return (
    <div className="mt-4" data-testid="error-list">
      <div
        role="alert"
        className="alert alert-error alert-soft alert-vertical sm:alert-horizontal"
      >
        <CircleAlert className="size-6 text-error" />
        <span>
          <span className="font-bold">{errors.length} error(s) found</span>.
          Failed to parse the file. Please fix them before continuing.
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn btn-error btn-sm btn-outline"
            data-testid="retry-button"
            onClick={parseFile}
          >
            <RotateCcw className="size-4" />
            Retry
          </button>
          <button
            type="button"
            className="btn btn-error btn-sm btn-outline"
            data-testid="select-new-file-button"
            onClick={handleOpenProject}
          >
            <FolderOpen className="size-4" />
            Select a new file
          </button>
        </div>
      </div>
      <ul className="list pl-0!">
        {errors.map((error, index) => (
          <li className="list-row items-center p-2" key={error.message}>
            <CircleAlert className="size-8 text-error" />
            <div className="text-2xl font-thin opacity-30">
              {index <= 8 ? `0${index + 1}` : index + 1}
            </div>
            <div className="list-col-grow">
              <div>{error.message}</div>
              {error.path && (
                <div className="text-xs uppercase font-semibold opacity-60">
                  {error.path}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
});
