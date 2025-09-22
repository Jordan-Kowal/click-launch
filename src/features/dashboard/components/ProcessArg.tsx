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
import { ProcessStatus } from "../enums";

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

  const [value, setValue] = useState(defaultValue);
  const { updateCommand, status } = useProcessContext();

  const canEdit =
    status === ProcessStatus.STOPPED || status === ProcessStatus.CRASHED;

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
      <div className="flex flex-row items-center gap-2">
        <span className="text-xs font-bold w-40">{name}:</span>
        <input
          type="checkbox"
          checked={value}
          className="toggle toggle-primary justify-self-start"
          onChange={onToggleChange}
          data-testid={`${name}-toggle`}
          disabled={!canEdit}
        />
      </div>
    );
  }

  if (type === ArgType.SELECT) {
    return (
      <div className="flex flex-row items-center gap-2">
        <span className="text-xs font-bold w-40">{name}:</span>
        <select
          className="select select-sm select-primary max-w-50"
          data-testid={`${name}-select`}
          onChange={onSelectChange}
          disabled={!canEdit}
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
      <div className="flex flex-row items-center gap-2">
        <span className="text-xs font-bold w-40">{name}:</span>
        <input
          type="text"
          className="input input-sm input-primary max-w-50"
          data-testid={`${name}-input`}
          value={value}
          onInput={onInputChange}
          disabled={!canEdit}
        />
      </div>
    );
  }

  return null;
});
