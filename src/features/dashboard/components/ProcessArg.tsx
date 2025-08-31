import {
  type ChangeEvent,
  memo,
  useCallback,
  useEffect,
  useState,
} from "react";
import { ArgType } from "@/electron/enums";
import type { ArgConfig } from "@/electron/types";
import { useProcessContext } from "../contexts/ProcessContext";

type ProcessArgProps = {
  argConfig: ArgConfig;
};

export const ProcessArg = memo(({ argConfig }: ProcessArgProps) => {
  const {
    name,
    type,
    default: defaultValue,
    values,
    output_prefix,
  } = argConfig;
  const { updateCommand } = useProcessContext();

  const [value, setValue] = useState(defaultValue);

  const onSelectChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    setValue(e.target.value);
  }, []);

  const onInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  }, []);

  const onToggleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.checked);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: used as a watch function for value
  useEffect(() => {
    let output: string;
    switch (type) {
      case ArgType.TOGGLE:
        output = values?.find((v) => v.value === value)?.output ?? "";
        break;
      case ArgType.SELECT:
        output = values?.find((v) => v.value === value)?.output ?? "";
        break;
      case ArgType.INPUT:
        output = value;
        if (output_prefix && output !== "") {
          output = `${output_prefix} ${output}`;
        }
        break;
    }
    updateCommand(name, output);
  }, [value]);

  if (type === ArgType.TOGGLE) {
    return (
      <div className="grid grid-cols-[2fr_3fr] gap-2 items-center px-2">
        <span className="text-xs font-medium">{name}:</span>
        <input
          type="checkbox"
          checked={value}
          className="toggle toggle-primary toggle-xs justify-self-start"
          onChange={onToggleChange}
          data-testid={`${name}-toggle`}
        />
      </div>
    );
  }

  if (type === ArgType.SELECT) {
    return (
      <div className="grid grid-cols-[2fr_3fr] gap-2 items-center px-2">
        <span className="text-xs font-medium">{name}:</span>
        <select
          className="select select-sm select-primary w-full"
          data-testid={`${name}-select`}
          onChange={onSelectChange}
        >
          {values?.map((value) => (
            <option key={value.value} value={value.value}>
              {value.value}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (type === ArgType.INPUT) {
    return (
      <div className="grid grid-cols-[2fr_3fr] gap-2 items-center px-2">
        <span className="text-xs font-medium">{name}:</span>
        <input
          type="text"
          className="input input-sm input-primary w-full"
          data-testid={`${name}-input`}
          value={value}
          onInput={onInputChange}
        />
      </div>
    );
  }

  return null;
});
