import yaml from "js-yaml";
import type { RestartConfig } from "@/electron/types";

export enum ArgType {
  TOGGLE = "toggle",
  SELECT = "select",
  INPUT = "input",
}

const SUPPORTED_ARG_TYPES = [ArgType.TOGGLE, ArgType.SELECT, ArgType.INPUT];

export type ValidationResult = {
  isValid: boolean;
  config: YamlConfig | null;
  errors: {
    message: string;
    path?: string;
  }[];
};

export type ValidationError = ValidationResult["errors"][0];

export type YamlConfig = {
  project_name: string;
  processes: {
    name: string;
    base_command: string;
    cwd?: string;
    env?: Record<string, string>;
    restart?: RestartConfig;
    args?: {
      type: ArgType;
      name: string;
      default: any;
      output_prefix?: string; // Only for input args
      values?: {
        value: any;
        output: string;
      }[];
    }[];
  }[];
};

export type ProcessConfig = YamlConfig["processes"][0];
export type ArgConfig = NonNullable<ProcessConfig["args"]>[0];
export type ArgValue = NonNullable<ArgConfig["values"]>[0];

export const extractYamlConfig = (yamlContent: string): ValidationResult => {
  const config = parseYamlFile(yamlContent);

  // Early return if the file is not a valid YAML object
  if (!config || typeof config !== "object") {
    return {
      isValid: false,
      config: null,
      errors: [{ message: "Invalid YAML file" }],
    };
  }

  // Validate content
  const errors: ValidationError[] = [];
  validateRootStructure(config, errors);
  if (config.processes && Array.isArray(config.processes)) {
    config.processes.forEach((process: any, index: number) => {
      validateProcess(process, `processes[${index}]`, errors);
    });
  }

  return {
    isValid: errors.length === 0,
    config: errors.length === 0 ? config : null,
    errors,
  };
};

const parseYamlFile = (filePath: string): any | null => {
  try {
    return yaml.load(filePath);
  } catch (_error) {
    return null;
  }
};

const validateRootStructure = (
  config: any,
  errors: ValidationError[],
): void => {
  validateString({
    fieldName: "project_name",
    value: config.project_name,
    path: "",
    errors,
  });
  validateArray({
    fieldName: "processes",
    value: config.processes,
    minLength: 1,
    maxLength: undefined,
    path: "",
    errors,
  });
};

const validateProcess = (
  process: any,
  basePath: string,
  errors: ValidationError[],
): void => {
  validateString({
    fieldName: "name",
    value: process.name,
    path: basePath,
    errors,
  });
  validateString({
    fieldName: "base_command",
    value: process.base_command,
    path: basePath,
    errors,
  });
  if (process.cwd !== undefined) {
    validateString({
      fieldName: "cwd",
      value: process.cwd,
      path: basePath,
      errors,
    });
  }
  if (process.env !== undefined) {
    validateEnvConfig(process.env, `${basePath}.env`, errors);
  }
  if (process.restart) {
    validateRestartConfig(process.restart, `${basePath}.restart`, errors);
  }
  if (process.args) {
    validateArray({
      fieldName: "args",
      value: process.args,
      minLength: 0,
      maxLength: undefined,
      path: basePath,
      errors,
    });
    process.args.forEach((arg: any, argIndex: number) => {
      validateArg(arg, `${basePath}.args[${argIndex}]`, errors);
    });
  }
};

const validateEnvConfig = (
  env: any,
  path: string,
  errors: ValidationError[],
): void => {
  if (typeof env !== "object" || env === null || Array.isArray(env)) {
    errors.push({ message: "env must be an object", path });
    return;
  }
  for (const [key, value] of Object.entries(env)) {
    if (typeof key !== "string" || key === "") {
      errors.push({ message: "env key must be a non-empty string", path });
    }
    if (typeof value !== "string") {
      errors.push({
        message: `env.${key} must be a string`,
        path,
      });
    }
  }
};

const validateRestartConfig = (
  restart: any,
  path: string,
  errors: ValidationError[],
): void => {
  if (typeof restart !== "object" || restart === null) {
    errors.push({ message: "restart must be an object", path });
    return;
  }
  // enabled is required and must be a boolean
  if (typeof restart.enabled !== "boolean") {
    errors.push({ message: "restart.enabled must be a boolean", path });
  }
  // Optional fields validation
  if (
    restart.max_retries !== undefined &&
    (typeof restart.max_retries !== "number" || restart.max_retries < 1)
  ) {
    errors.push({
      message: "restart.max_retries must be a positive number",
      path,
    });
  }
  if (
    restart.delay_ms !== undefined &&
    (typeof restart.delay_ms !== "number" || restart.delay_ms < 0)
  ) {
    errors.push({
      message: "restart.delay_ms must be a non-negative number",
      path,
    });
  }
  if (
    restart.reset_after_ms !== undefined &&
    (typeof restart.reset_after_ms !== "number" || restart.reset_after_ms < 0)
  ) {
    errors.push({
      message: "restart.reset_after_ms must be a non-negative number",
      path,
    });
  }
};

const validateArg = (
  arg: any,
  basePath: string,
  errors: ValidationError[],
): void => {
  validateArgGeneric(arg, basePath, errors);
  switch (arg.type) {
    case ArgType.TOGGLE:
      validateToggleArg(arg, basePath, errors);
      break;
    case ArgType.SELECT:
      validateSelectArg(arg, basePath, errors);
      break;
    case ArgType.INPUT:
      validateInputArg(arg, basePath, errors);
      break;
    default:
      break;
  }
};

const validateArgGeneric = (
  arg: any,
  path: string,
  errors: ValidationError[],
): void => {
  validateString({ fieldName: "name", value: arg.name, path, errors });
  validateValueIn({
    fieldName: "type",
    value: arg.type,
    values: SUPPORTED_ARG_TYPES,
    path,
    errors,
  });
  if (arg.default === undefined) {
    errors.push({ message: "Missing required field: default", path });
  }
};

const validateToggleArg = (
  arg: any,
  path: string,
  errors: ValidationError[],
): void => {
  // Ensure it has exactly two values
  validateArray({
    fieldName: "values",
    value: arg.values,
    minLength: 2,
    maxLength: 2,
    path,
    errors,
  });
  // Ensure those values are true and false
  const hasTrue = arg.values.some((v: any) => v.value === true);
  const hasFalse = arg.values.some((v: any) => v.value === false);
  if (!hasTrue || !hasFalse) {
    errors.push({
      message: "toggle must have exactly two values: true and false",
      path,
    });
  }
  // Ensures each value has a valid output
  arg.values.forEach((value: ArgValue, index: number) => {
    validateString({
      fieldName: "output",
      value: value.output,
      required: false,
      path: `${path}[${index}].output`,
      errors,
    });
  });
  // Ensures the default value is one of the two values
  validateValueIn({
    fieldName: "default",
    value: arg.default,
    values: [true, false],
    path,
    errors,
  });
};

const validateSelectArg = (
  arg: any,
  path: string,
  errors: ValidationError[],
): void => {
  // Ensure it has at least two values
  validateArray({
    fieldName: "values",
    value: arg.values,
    minLength: 2,
    maxLength: undefined,
    path,
    errors,
  });
  // Ensures each value has a valid output and value
  arg.values.forEach((value: ArgValue, index: number) => {
    validateString({
      fieldName: "output",
      value: value.output,
      required: false,
      path: `${path}[${index}].output`,
      errors,
    });
    validateString({
      fieldName: "value",
      value: value.value,
      path: `${path}[${index}].value`,
      errors,
    });
  });
  // Ensures the default value is one of the values
  const values = arg.values.map((v: any) => v.value);
  validateValueIn({
    fieldName: "default",
    value: arg.default,
    values,
    path,
    errors,
  });
};

const validateInputArg = (
  arg: any,
  path: string,
  errors: ValidationError[],
): void => {
  // Ensures the output is a string
  validateString({
    fieldName: "output_prefix",
    required: false,
    value: arg.output_prefix,
    path,
    errors,
  });
};

const validateString = ({
  fieldName,
  value,
  required = true,
  path,
  errors,
}: {
  fieldName: string;
  value: any;
  required?: boolean;
  path: string;
  errors: ValidationError[];
}): void => {
  if ((required && !value) || typeof value !== "string") {
    errors.push({
      message: `${fieldName} must be a non-empty string`,
      path,
    });
  }
};

const validateArray = ({
  fieldName,
  value,
  minLength,
  maxLength,
  path,
  errors,
}: {
  fieldName: string;
  value: any;
  minLength?: number;
  maxLength?: number;
  path: string;
  errors: ValidationError[];
}): void => {
  if (
    !value ||
    !Array.isArray(value) ||
    (minLength !== undefined && value.length < minLength) ||
    (maxLength !== undefined && value.length > maxLength)
  ) {
    let message = `${fieldName} must be an array`;
    if (minLength !== undefined) {
      message += ` - min length: ${minLength}`;
    }
    if (maxLength !== undefined) {
      message += ` - max length: ${maxLength}`;
    }
    errors.push({ message, path });
  }
};

const validateValueIn = ({
  fieldName,
  value,
  values,
  path,
  errors,
}: {
  fieldName: string;
  value: any;
  values: any[];
  path: string;
  errors: ValidationError[];
}): void => {
  if (
    value === undefined ||
    value === null ||
    value === "" ||
    !values.includes(value)
  ) {
    errors.push({
      message: `${fieldName} must be one of the following values: ${values.join(", ")}`,
      path,
    });
  }
};
