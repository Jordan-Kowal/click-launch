import { useLocation, useNavigate } from "@solidjs/router";
import { House } from "lucide-solid";
import { routePaths } from "@/routes";
import { Logo } from "../ui/Logo";
import { Modal } from "../ui/Modal";

export const NavBar = () => {
  let modalRef!: HTMLDialogElement;
  const location = useLocation();
  const navigate = useNavigate();

  const handleConfirm = async () => {
    await window.electronAPI.stopAllProcesses();
    navigate(routePaths.projectSelection);
  };

  const onHomeButtonClick = () => {
    if (location.pathname !== routePaths.projectSelection) {
      modalRef?.showModal();
    }
  };

  return (
    <>
      <div
        class="fixed top-0 left-0 shadow-xs not-prose z-999 bg-base-300 w-full drag-region"
        data-tauri-drag-region
      >
        <div class="flex flex-row items-center gap-2 mx-auto w-35 text-center py-1">
          <div class="max-w-4">
            <Logo />
          </div>
          <span class="font-bold text-sm">Click Launch</span>
        </div>
        <div
          class="tooltip tooltip-left absolute -top-0.5 right-1"
          data-tip="Homepage"
        >
          <button
            type="button"
            class="btn btn-ghost btn-circle btn-sm no-drag"
            onClick={onHomeButtonClick}
          >
            <House size={20} />
          </button>
        </div>
      </div>
      <Modal ref={modalRef!} onConfirm={handleConfirm} closable={true}>
        <h1 class="text-xl font-bold">Return to project selection?</h1>
        <p>Any ongoing processes will be shut down.</p>
      </Modal>
    </>
  );
};
