import { createEffect, createSignal, onCleanup } from "solid-js";

type UseDrawerKeyboardParams = {
  isOpen: () => boolean;
  onClose: () => void;
  searchInputRef: () => HTMLInputElement | undefined;
};

export const useDrawerKeyboard = ({
  isOpen,
  onClose,
  searchInputRef,
}: UseDrawerKeyboardParams) => {
  const [showShortcuts, setShowShortcuts] = createSignal(false);

  const handleEscape = (e: KeyboardEvent) => {
    if (e.key !== "Escape" || !isOpen()) return;
    if (showShortcuts()) {
      setShowShortcuts(false);
      return;
    }
    const activeElement = document.activeElement;
    if (activeElement === searchInputRef()) return;
    onClose();
  };

  const handleCmdF = (e: KeyboardEvent) => {
    if (e.key !== "f" || !e.metaKey || !isOpen()) return;
    const activeElement = document.activeElement;
    if (activeElement === searchInputRef()) return;
    e.preventDefault();
    searchInputRef()?.focus();
  };

  const handleShortcutsToggle = (e: KeyboardEvent) => {
    if (e.key !== "/" || !(e.metaKey || e.ctrlKey) || !isOpen()) return;
    e.preventDefault();
    setShowShortcuts((prev) => !prev);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    handleEscape(e);
    handleCmdF(e);
    handleShortcutsToggle(e);
  };

  // Register the keydown event listener
  createEffect(() => {
    if (!isOpen()) return;
    window.addEventListener("keydown", handleKeyDown);
    onCleanup(() => {
      window.removeEventListener("keydown", handleKeyDown);
    });
  });

  return {
    showShortcuts,
    setShowShortcuts,
  };
};
