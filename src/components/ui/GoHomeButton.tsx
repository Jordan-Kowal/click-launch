import { ProcessService } from "@backend";
import { useNavigate } from "@solidjs/router";
import type { LucideIcon } from "lucide-solid";
import { useContext } from "solid-js";
import { DashboardContext } from "@/features/dashboard/contexts/DashboardContext";
import { routePaths } from "@/routes";
import { Modal } from "./Modal";

type GoHomeButtonProps = {
  icon: LucideIcon;
  size: number;
  class?: string;
};

export const GoHomeButton = (props: GoHomeButtonProps) => {
  let modalRef!: HTMLDialogElement;
  const navigate = useNavigate();
  const dashboard = useContext(DashboardContext);

  const goHome = async () => {
    await ProcessService.StopAll();
    navigate(routePaths.projectSelection);
  };

  const handleClick = () => {
    if (dashboard?.hasRunningProcesses()) {
      modalRef?.showModal();
    } else {
      goHome();
    }
  };

  return (
    <>
      <button
        type="button"
        class={`btn btn-ghost btn-sm btn-circle ${props.class ?? ""}`}
        onClick={handleClick}
      >
        <props.icon size={props.size} />
      </button>
      <Modal ref={modalRef!} onConfirm={goHome} closable={true}>
        <h1 class="text-xl font-bold">Return to project selection?</h1>
        <p>Any ongoing processes will be shut down.</p>
      </Modal>
    </>
  );
};
