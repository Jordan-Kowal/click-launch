import { ArrowLeft, X } from "lucide-solid";

type ResourceDrawerHeaderProps = {
  processName: string;
  onClose: () => void;
};

export const ResourceDrawerHeader = (props: ResourceDrawerHeaderProps) => {
  return (
    <div class="px-4 py-2 border-b border-base-300">
      <div class="flex flex-row items-center gap-2">
        <button
          type="button"
          class="btn btn-ghost btn-circle btn-sm"
          onClick={props.onClose}
        >
          <ArrowLeft size={20} />
        </button>
        <h3 class="font-bold m-0!">Resources - {props.processName}</h3>
      </div>
      <button
        type="button"
        class="btn btn-sm btn-circle absolute right-4 top-8"
        onClick={props.onClose}
      >
        <X size={16} />
      </button>
    </div>
  );
};
