import { ProcessService } from "@backend";
import { useNavigate } from "@solidjs/router";
import type { LucideIcon } from "lucide-solid";
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

  const handleConfirm = async () => {
    await ProcessService.StopAll();
    navigate(routePaths.projectSelection);
  };

  return (
    <>
      <button
        type="button"
        class={`btn btn-ghost btn-sm btn-circle ${props.class ?? ""}`}
        onClick={() => modalRef?.showModal()}
      >
        <props.icon size={props.size} />
      </button>
      <Modal ref={modalRef!} onConfirm={handleConfirm} closable={true}>
        <h1 class="text-xl font-bold">Return to project selection?</h1>
        <p>Any ongoing processes will be shut down.</p>
      </Modal>
    </>
  );
};
