import { X } from "lucide-solid";
import { For } from "solid-js";

type Shortcut = {
  keys: string[];
  description: string;
};

type ShortcutGroup = {
  title: string;
  shortcuts: Shortcut[];
};

const isMac = navigator.userAgent.includes("Mac");
const modKey = isMac ? "⌘" : "Ctrl";

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "General",
    shortcuts: [
      { keys: [modKey, "/"], description: "Show keyboard shortcuts" },
      { keys: ["F5"], description: "Reload configuration" },
      { keys: [modKey, "R"], description: "Reload configuration" },
    ],
  },
  {
    title: "Log Drawer",
    shortcuts: [
      { keys: [modKey, "F"], description: "Focus search" },
      { keys: ["Escape"], description: "Close drawer" },
      { keys: ["Enter"], description: "Next search result" },
      { keys: ["Shift", "Enter"], description: "Previous search result" },
    ],
  },
];

type KeyboardShortcutsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const KeyboardShortcutsModal = (props: KeyboardShortcutsModalProps) => {
  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      props.onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      class={`absolute inset-0 z-50 flex items-center justify-center transition-opacity duration-200 ${
        props.isOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
      style={{ "background-color": "rgba(0, 0, 0, 0.6)" }}
      onClick={handleBackdropClick}
    >
      <div class="bg-base-100 rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold m-0!">Keyboard Shortcuts</h2>
          <button
            type="button"
            class="btn btn-ghost btn-circle btn-sm"
            onClick={props.onClose}
          >
            <X size={16} />
          </button>
        </div>
        <div class="space-y-4">
          <For each={SHORTCUT_GROUPS}>
            {(group) => (
              <div>
                <h3 class="text-sm font-semibold text-base-content/60 uppercase tracking-wider mb-2">
                  {group.title}
                </h3>
                <div class="space-y-1">
                  <For each={group.shortcuts}>
                    {(shortcut) => (
                      <div class="flex items-center justify-between py-1.5 px-2 rounded hover:bg-base-200">
                        <span class="text-sm">{shortcut.description}</span>
                        <div class="flex items-center gap-1">
                          <For each={shortcut.keys}>
                            {(key, index) => (
                              <>
                                <kbd class="kbd kbd-sm">{key}</kbd>
                                {index() < shortcut.keys.length - 1 && (
                                  <span class="text-base-content/40 text-xs">
                                    +
                                  </span>
                                )}
                              </>
                            )}
                          </For>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>
    </div>
  );
};
