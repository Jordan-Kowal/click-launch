import { Keyboard } from "lucide-solid";
import { For, Show } from "solid-js";

type Shortcut = {
  keys: string[];
  description: string;
};

const SHORTCUTS: Shortcut[] = [
  { keys: ["⌘", "/"], description: "Show shortcuts" },
  { keys: ["⌘", "F"], description: "Focus search" },
  { keys: ["Enter"], description: "Next search result" },
  { keys: ["Shift", "Enter"], description: "Previous search result" },
  { keys: ["Escape"], description: "Close drawer/shortcuts" },
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
      class={`modal modal-middle ${props.isOpen ? "modal-open" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      onClick={handleBackdropClick}
    >
      <div class="modal-box max-w-sm">
        <button
          type="button"
          class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={props.onClose}
        >
          ✕
        </button>
        <h3 class="font-bold text-lg flex items-center gap-2 mt-0!">
          <Keyboard size={20} />
          Shortcuts
        </h3>
        <div class="pt-4 space-y-2">
          <For each={SHORTCUTS}>
            {(shortcut) => (
              <div class="flex items-center justify-between">
                <span class="text-sm">{shortcut.description}</span>
                <span class="flex items-center gap-1">
                  <For each={shortcut.keys}>
                    {(key, index) => (
                      <>
                        <kbd class="kbd kbd-sm">{key}</kbd>
                        <Show when={index() < shortcut.keys.length - 1}>
                          <span class="text-base-content/40 text-xs">+</span>
                        </Show>
                      </>
                    )}
                  </For>
                </span>
              </div>
            )}
          </For>
        </div>
      </div>
      <button
        type="button"
        class="modal-backdrop"
        onClick={props.onClose}
        aria-label="Close modal"
      />
    </div>
  );
};
