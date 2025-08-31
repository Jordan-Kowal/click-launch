import {
  createContext,
  memo,
  type ReactNode,
  useContext,
  useMemo,
} from "react";
import { ArgType } from "@/electron/enums";
import type { ArgConfig, ProcessConfig } from "@/electron/types";

const FREE_TEXT_ARG: ArgConfig = {
  type: ArgType.INPUT,
  name: "Additional args",
  default: "",
  output_prefix: "",
  values: [],
};

type ProcessContextType = {
  name: string;
  command: string;
  args: ArgConfig[];
};

const ProcessContext = createContext<ProcessContextType | undefined>(undefined);

export const useProcessContext = () => {
  const context = useContext(ProcessContext);
  if (!context) {
    throw new Error("useProcess must be used within a ProcessProvider");
  }
  return context;
};

type ProcessProviderProps = {
  children: ReactNode;
  process: ProcessConfig;
};

export const ProcessProvider = memo(
  ({ children, process }: ProcessProviderProps) => {
    const command = useMemo(() => {
      return process.base_command;
    }, [process.base_command]);

    const args = useMemo(
      () => [...(process.args ?? []), FREE_TEXT_ARG],
      [process.args],
    );

    const context: ProcessContextType = useMemo(
      () => ({ name: process.name, command, args: args }),
      [process.name, command, args],
    );

    return (
      <ProcessContext.Provider value={context}>
        {children}
      </ProcessContext.Provider>
    );
  },
);
