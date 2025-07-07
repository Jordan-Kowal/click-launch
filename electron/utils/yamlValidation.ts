import yaml from "js-yaml";

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
    allows_free_text: boolean;
    args?: {
      type: "toggle" | "select" | "multiselect" | "input";
      name: string;
      default: any;
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

  return { isValid: errors.length === 0, config, errors };
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
  validateString("project_name", config.project_name, "", errors);
  validateArray("processes", config.processes, 1, undefined, "", errors);
};

const validateProcess = (
  process: any,
  basePath: string,
  errors: ValidationError[],
): void => {
  validateString("name", process.name, basePath, errors);
  validateString("base_command", process.base_command, basePath, errors);
  const allowsFreeText = process.allows_free_text;
  if (!allowsFreeText && allowsFreeText !== true) {
    errors.push({
      message: "allows_free_text must be a boolean",
      path: basePath,
    });
  }
  // args
  if (process.args) {
    validateArray("args", process.args, 0, undefined, basePath, errors);
    process.args.forEach((arg: any, argIndex: number) => {
      validateArg(arg, `${basePath}.args[${argIndex}]`, errors);
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
    case "toggle":
      validateToggleArg(arg, basePath, errors);
      break;
    case "select":
      validateSelectArg(arg, basePath, errors);
      break;
    case "multiselect":
      validateMultiselectArg(arg, basePath, errors);
      break;
    case "input":
      validateInputArg(arg, basePath, errors);
      break;
    default:
      // Error already handled in validateArgGeneric
      break;
  }
};

const validateArgGeneric = (
  arg: any,
  path: string,
  errors: ValidationError[],
): void => {
  const supportedTypes = ["toggle", "select", "multiselect", "input"];
  validateString("name", arg.name, path, errors);
  validateValueIn("type", arg.type, supportedTypes, path, errors);
  if (arg.default === undefined) {
    errors.push({ message: "Missing required field: default", path });
  }
};

const validateToggleArg = (
  arg: any,
  path: string,
  errors: ValidationError[],
): void => {
  validateArray("values", arg.values, 2, 2, path, errors);

  const hasTrue = arg.values.some((v: any) => v.value === true);
  const hasFalse = arg.values.some((v: any) => v.value === false);

  if (!hasTrue || !hasFalse) {
    errors.push({ message: "toggle values must be true and false", path });
  }

  // FIXME
  validateArgValues(arg.values, `${path}.values`, errors);
  validateValueIn("default", arg.default, [true, false], path, errors);
};

const validateSelectArg = (
  arg: any,
  path: string,
  errors: ValidationError[],
): void => {
  validateArray("values", arg.values, 2, undefined, path, errors);
  validateArgValues(arg.values, `${path}.values`, errors);
  const values = arg.values.map((v: any) => v.value);
  validateValueIn("default", arg.default, values, path, errors);
};

const validateMultiselectArg = (
  arg: any,
  path: string,
  errors: ValidationError[],
): void => {
  validateArray("values", arg.values, 2, undefined, path, errors);
  validateArgValues(arg.values, `${path}.values`, errors);
  const values = arg.values.map((v: any) => v.value);
  validateArray("default", arg.default, 0, undefined, path, errors);
  (arg.default || []).forEach((value: any) => {
    validateValueIn("default", value, values, path, errors);
  });
};

const validateInputArg = (
  arg: any,
  path: string,
  errors: ValidationError[],
): void => {
  validateString("default", arg.default, path, errors);
};

const validateArgValues = (
  arg: ArgConfig["values"],
  path: string,
  errors: ValidationError[],
): void => {
  (arg || []).forEach((value: ArgValue, index: number) => {
    validateString("output", value.output, `${path}[${index}].output`, errors);
    validateString("value", value.value, `${path}[${index}].value`, errors);
  });
};

const validateString = (
  fieldName: string,
  value: any,
  path: string,
  errors: ValidationError[],
): void => {
  if (!value || typeof value !== "string") {
    errors.push({
      message: `${fieldName} must be a non-empty string`,
      path,
    });
  }
};

const validateArray = (
  fieldName: string,
  value: any,
  minLength: number | undefined,
  maxLength: number | undefined,
  path: string,
  errors: ValidationError[],
): void => {
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

const validateValueIn = (
  fieldName: string,
  value: any,
  values: any[],
  path: string,
  errors: ValidationError[],
): void => {
  if (!value || !values.includes(value)) {
    errors.push({
      message: `${fieldName} must be one of the following values: ${values.join(", ")}`,
      path,
    });
  }
};
