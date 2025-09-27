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
    <div class="navbar fixed top-0 left-0 shadow-xs not-prose z-999 bg-base-100 drag-region pl-24">
      <div class="navbar-start" />
      <div class="navbar-center relative -left-8">
        <div class="flex flex-row items-center gap-2">
          <div class="max-w-8">
            <Logo />
          </div>
          <span class="text-xl font-bold">Click Launch</span>
        </div>
      </div>
      <div class="navbar-end">
        <div class="tooltip tooltip-left" data-tip="Homepage">
          <button
            type="button"
            class="btn btn-ghost btn-circle no-drag"
            onClick={onHomeButtonClick}
          >
            <House />
          </button>
        </div>
      </div>
      <Modal ref={modalRef!} onConfirm={handleConfirm} closable={true}>
        <h1 class="text-xl font-bold">Return to project selection?</h1>
        <p>Any ongoing processes will be shut down.</p>
      </Modal>
    </div>
  );
};
