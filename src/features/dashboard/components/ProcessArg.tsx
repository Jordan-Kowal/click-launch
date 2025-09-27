import { createEffect, createSignal, For, Match, Switch } from "solid-js";
import { ArgType } from "@/electron/enums";
import type { ArgConfig } from "@/electron/types";
import { useProcessContext } from "../contexts/";
import { ProcessStatus } from "../enums";

type ProcessArgProps = {
  argConfig: ArgConfig;
};

export const ProcessArg = (props: ProcessArgProps) => {
  const {
    name,
    type,
    default: defaultValue,
    values,
    output_prefix,
  } = props.argConfig;

  const [value, setValue] = createSignal(defaultValue);
  const { updateCommand, status } = useProcessContext();

  const canEdit = () =>
    status() === ProcessStatus.STOPPED || status() === ProcessStatus.CRASHED;

  const onSelectChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    setValue(target.value);
  };

  const onInputChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    setValue(target.value);
  };

  const onToggleChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    setValue(target.checked);
  };

  // Watch value changes and update command
  createEffect(() => {
    let output: string;
    switch (type) {
      case ArgType.TOGGLE:
        output = values?.find((v) => v.value === value())?.output ?? "";
        break;
      case ArgType.SELECT:
        output = values?.find((v) => v.value === value())?.output ?? "";
        break;
      case ArgType.INPUT:
        output = value() as string;
        if (output_prefix && output !== "") {
          output = `${output_prefix} ${output}`;
        }
        break;
      default:
        output = "";
    }
    updateCommand(name, output);
  });

  return (
    <Switch>
      <Match when={type === ArgType.TOGGLE}>
        <div class="flex flex-row items-center gap-2">
          <span class="text-xs font-bold w-40">{name}:</span>
          <input
            type="checkbox"
            checked={value() as boolean}
            class="toggle toggle-primary justify-self-start"
            onChange={onToggleChange}
            disabled={!canEdit()}
          />
        </div>
      </Match>

      <Match when={type === ArgType.SELECT}>
        <div class="flex flex-row items-center gap-2">
          <span class="text-xs font-bold w-40">{name}:</span>
          <select
            class="select select-sm select-primary max-w-50"
            onChange={onSelectChange}
            disabled={!canEdit()}
          >
            <For each={values}>
              {(valueOption) => (
                <option value={valueOption.value}>{valueOption.value}</option>
              )}
            </For>
          </select>
        </div>
      </Match>

      <Match when={type === ArgType.INPUT}>
        <div class="flex flex-row items-center gap-2">
          <span class="text-xs font-bold w-40">{name}:</span>
          <input
            type="text"
            class="input input-sm input-primary max-w-50"
            value={value() as string}
            onInput={onInputChange}
            disabled={!canEdit()}
          />
        </div>
      </Match>
    </Switch>
  );
};
