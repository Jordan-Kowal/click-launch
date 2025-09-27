import { createSignal } from "solid-js";

export const useLocalStorage = <T extends string>(
  key: string,
  defaultValue?: T,
): [() => T | undefined, (newValue: T) => void] => {
  const [value, setValue] = createSignal<T | undefined>(
    (localStorage.getItem(key) as T) || defaultValue,
  );

  const updateValue = (newValue: T) => {
    localStorage.setItem(key, newValue);
    setValue(() => newValue);
  };

  return [value, updateValue];
};
