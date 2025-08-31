import { memo, useState } from "react";
import { ArgType } from "@/electron/enums";
import type { ArgConfig } from "@/electron/types";

type ProcessArgProps = {
  argConfig: ArgConfig;
};

export const ProcessArg = memo(({ argConfig }: ProcessArgProps) => {
  const { name, type, default: defaultValue, values } = argConfig;

  const [value, setValue] = useState(defaultValue);

  if (type === ArgType.TOGGLE) {
    return (
      <div className="grid grid-cols-[2fr_3fr] gap-2 items-center px-2">
        <span className="text-xs font-medium">{name}:</span>
        <input
          type="checkbox"
          checked={value}
          className="toggle toggle-primary toggle-xs justify-self-start"
          onChange={(e) => setValue(e.target.checked)}
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
        >
          {values?.map((value) => (
            <option key={value.value} value={value.output}>
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
        />
      </div>
    );
  }

  return null;
});
