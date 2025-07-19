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
  const allowsFreeText = process.allows_free_text;
  if (
    allowsFreeText !== true &&
    allowsFreeText !== false &&
    allowsFreeText !== undefined
  ) {
    errors.push({
      message: "allows_free_text must be a boolean",
      path: basePath,
    });
  }
  // args
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
    // biome-ignore lint/complexity/noUselessSwitchCase: Doc
    case "input":
    default:
      break;
  }
};

const validateArgGeneric = (
  arg: any,
  path: string,
  errors: ValidationError[],
): void => {
  const supportedTypes = ["toggle", "select", "multiselect", "input"];
  validateString({ fieldName: "name", value: arg.name, path, errors });
  validateValueIn({
    fieldName: "type",
    value: arg.type,
    values: supportedTypes,
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
  validateArray({
    fieldName: "values",
    value: arg.values,
    minLength: 2,
    maxLength: 2,
    path,
    errors,
  });

  const hasTrue = arg.values.some((v: any) => v.value === "true");
  const hasFalse = arg.values.some((v: any) => v.value === "false");

  if (!hasTrue || !hasFalse) {
    errors.push({
      message: "toggle values must be 'true' and 'false' (as strings)",
      path,
    });
  }

  validateArgValues(arg.values, `${path}.values`, errors);
  validateValueIn({
    fieldName: "default",
    value: arg.default,
    values: ["true", "false"],
    path,
    errors,
  });
};

const validateSelectArg = (
  arg: any,
  path: string,
  errors: ValidationError[],
): void => {
  validateArray({
    fieldName: "values",
    value: arg.values,
    minLength: 2,
    maxLength: undefined,
    path,
    errors,
  });
  validateArgValues(arg.values, `${path}.values`, errors);
  const values = arg.values.map((v: any) => v.value);
  validateValueIn({
    fieldName: "default",
    value: arg.default,
    values,
    path,
    errors,
  });
};

const validateMultiselectArg = (
  arg: any,
  path: string,
  errors: ValidationError[],
): void => {
  validateArray({
    fieldName: "values",
    value: arg.values,
    minLength: 2,
    maxLength: undefined,
    path,
    errors,
  });
  validateArgValues(arg.values, `${path}.values`, errors);
  const values = arg.values.map((v: any) => v.value);
  validateArray({
    fieldName: "default",
    value: arg.default,
    minLength: 0,
    maxLength: undefined,
    path,
    errors,
  });
  (arg.default || []).forEach((value: any) => {
    validateValueIn({ fieldName: "default", value, values, path, errors });
  });
};

const validateArgValues = (
  arg: ArgConfig["values"],
  path: string,
  errors: ValidationError[],
): void => {
  (arg || []).forEach((value: ArgValue, index: number) => {
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
  if (!value || !values.includes(value)) {
    errors.push({
      message: `${fieldName} must be one of the following values: ${values.join(", ")}`,
      path,
    });
  }
};
