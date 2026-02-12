import { createEffect, createSignal } from "solid-js";
import { useDashboardContext } from "../contexts/";
import { isProcessActive } from "../enums";

type ProcessEnvVarProps = {
  processName: string;
  envKey: string;
  defaultValue: string;
};

export const ProcessEnvVar = (props: ProcessEnvVarProps) => {
  const [value, setValue] = createSignal(props.defaultValue);
  const { setEnvValue, getProcessStatus } = useDashboardContext();
  const status = () => getProcessStatus(props.processName);

  const canEdit = () => !isProcessActive(status());

  const onInputChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    setValue(target.value);
  };

  createEffect(() => {
    setEnvValue(props.processName, props.envKey, value());
  });

  return (
    <div class="flex flex-row items-center gap-2">
      <span class="text-xs font-bold w-40 font-mono">{props.envKey}:</span>
      <input
        type="text"
        class="input input-sm input-primary max-w-50"
        value={value()}
        onInput={onInputChange}
        disabled={!canEdit()}
      />
    </div>
  );
};
