import { useLocation } from "@solidjs/router";
import { House, Settings } from "lucide-solid";
import { createSignal, Show } from "solid-js";
import { SettingsModal } from "@/features/settings/components";
import { routePaths } from "@/routes";
import { GoHomeButton } from "../ui/GoHomeButton";
import { Logo } from "../ui/Logo";

export const NavBar = () => {
  const location = useLocation();
  const [showSettings, setShowSettings] = createSignal(false);

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
          <Show when={location.pathname !== routePaths.projectSelection}>
            <div class="tooltip tooltip-left" data-tip="Homepage">
              <GoHomeButton icon={House} size={20} class="no-drag" />
            </div>
          </Show>
        </div>
      </div>
      <SettingsModal
        isOpen={showSettings()}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
};
