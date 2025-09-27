import { createSignal, type JSX } from "solid-js";

type ModalProps = {
  ref: HTMLDialogElement | ((el: HTMLDialogElement) => void);
  onConfirm: () => Promise<void> | void;
  children: JSX.Element;
  closable?: boolean;
};

export const Modal = (props: ModalProps) => {
  const [isLoading, setIsLoading] = createSignal(false);

  const closeModal = () => {
    setIsLoading(false);
    if (typeof props.ref === "function") {
      return;
    }
    props.ref?.close();
  };

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      await props.onConfirm();
      closeModal();
    } catch (_e) {
      setIsLoading(false);
    }
  };

  return (
    <dialog ref={props.ref} class="modal">
      <div class="modal-box">
        {props.children}
        {props.closable && (
          <button
            class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            type="button"
            onClick={closeModal}
          >
            X
          </button>
        )}
        <div class="modal-action flex gap-2">
          <button type="button" class="btn btn-outline" onClick={closeModal}>
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-primary"
            onClick={handleConfirm}
            disabled={isLoading()}
          >
            {isLoading() && <span class="loading loading-spinner" />}
            Confirm
          </button>
        </div>
      </div>
    </dialog>
  );
};
