import { createSignal } from "solid-js";
import { useSettingsContext } from "@/contexts";
import type { Settings } from "@/contexts/SettingsContext";

type NumericSettingKey = {
  [K in keyof Settings]: Settings[K] extends number ? K : never;
}[keyof Settings];

type NumberSettingInputProps = {
  settingKey: NumericSettingKey;
  min: number;
  max: number;
};

export const NumberSettingInput = (props: NumberSettingInputProps) => {
  const { settings, updateSetting } = useSettingsContext();

  const currentValue = () => settings()[props.settingKey] as number;
  const [draft, setDraft] = createSignal(String(currentValue()));

  const commit = () => {
    const parsed = Number.parseInt(draft(), 10);
    if (Number.isNaN(parsed)) {
      setDraft(String(currentValue()));
      return;
    }
    const clamped = Math.max(props.min, Math.min(props.max, parsed));
    updateSetting(props.settingKey, clamped);
    setDraft(String(clamped));
  };

  return (
    <input
      type="number"
      class="input input-sm input-bordered w-28 text-right"
      value={draft()}
      min={props.min}
      max={props.max}
      onInput={(e) => setDraft((e.target as HTMLInputElement).value)}
      onFocus={() => setDraft(String(currentValue()))}
      onBlur={commit}
      onKeyDown={(e) =>
        e.key === "Enter" && (e.target as HTMLInputElement).blur()
      }
    />
  );
};
