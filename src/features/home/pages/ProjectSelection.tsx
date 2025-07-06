import { FolderOpen, History } from "lucide-react";
import { memo } from "react";
import { Main } from "@/components/layout";
import { Logo } from "@/components/ui";

const ProjectSelection: React.FC = memo(() => {
  return (
    <Main dataTestId="homepage">
      <div className="text-center">
        <div className="max-w-50 mx-auto mb-6">
          <Logo />
        </div>
        <h1>Devbox Services GUI</h1>
        <div className="flex w-full flex-col lg:flex-row">
          <div className="card rounded-box p-6 flex-1 flex items-center justify-center">
            <button type="button" className="btn btn-primary btn-xl">
              <FolderOpen />
              Open new project
            </button>
          </div>
          <div className="divider lg:divider-horizontal" />
          <div className="card rounded-box p-6 flex-1 flex flex-col">
            <h2 className="card-title mb-4 justify-center !mt-1">
              <History className="w-5 h-5" />
              Recent Projects
            </h2>
            <div className="flex-1 flex items-center justify-center">
              <div className="space-y-0 w-full">
                <button
                  type="button"
                  className="btn btn-link w-full justify-start text-sm"
                >
                  /Users/john/Documents/my-project
                </button>
                <button
                  type="button"
                  className="btn btn-link w-full justify-start text-sm"
                >
                  /Users/john/Projects/webapp
                </button>
                <button
                  type="button"
                  className="btn btn-link w-full justify-start text-sm"
                >
                  /Users/john/Code/desktop-app
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Main>
  );
});

export default ProjectSelection;
