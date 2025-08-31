import {
  createContext,
  memo,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ArgConfig, ProcessConfig } from "@/electron/types";

type ProcessContextType = {
  name: string;
  command: string;
  args: ArgConfig[] | undefined;
  updateCommand: (argName: string, value: string) => void;
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
    const [argValues, setArgValues] = useState<Record<string, string>>({});

    const command = useMemo(() => {
      const outputArgs = Object.values(argValues);
      let output = process.base_command;
      if (outputArgs.length > 0) {
        output = `${output} ${outputArgs.join(" ")}`;
      }
      return output;
    }, [process.base_command, argValues]);

    const updateCommand = useCallback((argName: string, value: string) => {
      setArgValues((prev) => ({ ...prev, [argName]: value }));
    }, []);

    const context: ProcessContextType = useMemo(
      () => ({
        name: process.name,
        command,
        args: process.args,
        updateCommand,
      }),
      [process.name, command, process.args, updateCommand],
    );

    return (
      <ProcessContext.Provider value={context}>
        {children}
      </ProcessContext.Provider>
    );
  },
);
