import type { JSX } from "solid-js";

type SettingsSectionProps = {
  title: string;
  children: JSX.Element;
};

export const SettingsSection = (props: SettingsSectionProps) => {
  return (
    <div>
      <h4 class="text-sm font-semibold text-base-content/60 uppercase tracking-wide mb-2 mt-0!">
        {props.title}
      </h4>
      <div class="space-y-3">{props.children}</div>
    </div>
  );
};
