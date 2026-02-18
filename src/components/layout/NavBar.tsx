import { ProcessService } from "@backend";
import { useLocation, useNavigate } from "@solidjs/router";
import { House, Settings } from "lucide-solid";
import { createSignal } from "solid-js";
import { SettingsModal } from "@/features/settings/components";
import { routePaths } from "@/routes";
import { Logo } from "../ui/Logo";
import { Modal } from "../ui/Modal";

export const NavBar = () => {
  let modalRef!: HTMLDialogElement;
  const location = useLocation();
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = createSignal(false);

  const handleConfirm = async () => {
    await ProcessService.StopAll();
    navigate(routePaths.projectSelection);
  };

  const onHomeButtonClick = () => {
    if (location.pathname !== routePaths.projectSelection) {
      modalRef?.showModal();
    }
  };

  return (
    <>
      <div class="fixed top-0 left-0 shadow-xs not-prose z-999 bg-base-300 w-full drag-region">
        <div class="flex flex-row items-center gap-2 mx-auto w-35 text-center py-2">
          <div class="max-w-4">
            <Logo />
          </div>
          <span class="font-bold text-sm">Click Launch</span>
        </div>
        <div class="flex items-center gap-0 absolute top-0.5 right-1">
          <div class="tooltip tooltip-left" data-tip="Settings">
            <button
              type="button"
              class="btn btn-ghost btn-circle btn-sm no-drag"
              onClick={() => setShowSettings(true)}
            >
              <Settings size={18} />
            </button>
          </div>
          <div class="tooltip tooltip-left" data-tip="Homepage">
            <button
              type="button"
              class="btn btn-ghost btn-circle btn-sm no-drag"
              onClick={onHomeButtonClick}
            >
              <House size={20} />
            </button>
          </div>
        </div>
      </div>
      <Modal ref={modalRef!} onConfirm={handleConfirm} closable={true}>
        <h1 class="text-xl font-bold">Return to project selection?</h1>
        <p>Any ongoing processes will be shut down.</p>
      </Modal>
      <SettingsModal
        isOpen={showSettings()}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
};
