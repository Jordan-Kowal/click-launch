import { Info } from "lucide-solid";
import type { JSX } from "solid-js";

type SettingsRowProps = {
  label: string;
  tooltip: string;
  children: JSX.Element;
};

export const SettingsRow = (props: SettingsRowProps) => {
  return (
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <span class="text-sm">{props.label}</span>
        <div class="tooltip tooltip-right" data-tip={props.tooltip}>
          <Info size={14} class="text-base-content/40 cursor-help" />
        </div>
      </div>
      <div>{props.children}</div>
    </div>
  );
};
