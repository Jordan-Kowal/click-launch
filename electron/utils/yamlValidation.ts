import yaml from 'js-yaml';

export type ValidationError = {
  message: string;
  path?: string;
};

export type ValidationResult = {
  isValid: boolean;
  errors: ValidationError[];
};

export type YamlConfig = {
  project_name: string;
  processes: ProcessConfig[];
};

export type ProcessConfig = {
  name: string;
  base_command: string;
  allows_free_text: boolean;
  args?: ArgConfig[];
};

export type ArgConfig = {
  type: 'toggle' | 'select' | 'multiselect' | 'input';
  name: string;
  default: any;
  values?: ArgValue[];
};

export type ArgValue = {
  value: any;
  output: string;
};

export const validateYamlConfig = (yamlContent: string): ValidationResult => {
  const errors: ValidationError[] = [];
  
  // Parse YAML
  let config: any;
  try {
    config = yaml.load(yamlContent);
  } catch (error) {
    return {
      isValid: false,
      errors: [{ message: `Invalid YAML format: ${error instanceof Error ? error.message : 'Unknown error'}` }]
    };
  }

  if (!config || typeof config !== 'object') {
    return {
      isValid: false,
      errors: [{ message: 'YAML content is not a valid object' }]
    };
  }

  // Validate root structure
  validateRootStructure(config, errors);
  
  // Validate processes if they exist
  if (config.processes && Array.isArray(config.processes)) {
    config.processes.forEach((process: any, index: number) => {
      validateProcess(process, index, errors);
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateRootStructure = (config: any, errors: ValidationError[]): void => {
  if (!config.project_name) {
    errors.push({ message: 'Missing required field: project_name' });
  } else if (typeof config.project_name !== 'string') {
    errors.push({ message: 'project_name must be a string' });
  }

  if (!config.processes) {
    errors.push({ message: 'Missing required field: processes' });
  } else if (!Array.isArray(config.processes)) {
    errors.push({ message: 'processes must be an array' });
  } else if (config.processes.length === 0) {
    errors.push({ message: 'processes array cannot be empty' });
  }
};

const validateProcess = (process: any, index: number, errors: ValidationError[]): void => {
  const basePath = `processes[${index}]`;

  if (!process.name) {
    errors.push({ message: 'Missing required field: name', path: basePath });
  } else if (typeof process.name !== 'string') {
    errors.push({ message: 'name must be a string', path: basePath });
  }

  if (!process.base_command) {
    errors.push({ message: 'Missing required field: base_command', path: basePath });
  } else if (typeof process.base_command !== 'string') {
    errors.push({ message: 'base_command must be a string', path: basePath });
  }

  if (process.allows_free_text === undefined) {
    errors.push({ message: 'Missing required field: allows_free_text', path: basePath });
  } else if (typeof process.allows_free_text !== 'boolean') {
    errors.push({ message: 'allows_free_text must be a boolean', path: basePath });
  }

  if (process.args) {
    if (!Array.isArray(process.args)) {
      errors.push({ message: 'args must be an array', path: basePath });
    } else {
      process.args.forEach((arg: any, argIndex: number) => {
        validateArg(arg, argIndex, `${basePath}.args`, errors);
      });
    }
  }
};

const validateArg = (arg: any, index: number, basePath: string, errors: ValidationError[]): void => {
  const argPath = `${basePath}[${index}]`;
  
  // Generic validation
  validateArgGeneric(arg, argPath, errors);
  
  // Type-specific validation
  switch (arg.type) {
    case 'toggle':
      validateToggleArg(arg, argPath, errors);
      break;
    case 'select':
      validateSelectArg(arg, argPath, errors);
      break;
    case 'multiselect':
      validateMultiselectArg(arg, argPath, errors);
      break;
    case 'input':
      validateInputArg(arg, argPath, errors);
      break;
    default:
      // Error already handled in validateArgGeneric
      break;
  }
};

const validateArgGeneric = (arg: any, path: string, errors: ValidationError[]): void => {
  const supportedTypes = ['toggle', 'select', 'multiselect', 'input'];
  
  if (!arg.type) {
    errors.push({ message: 'Missing required field: type', path });
  } else if (!supportedTypes.includes(arg.type)) {
    errors.push({ message: `Unsupported type: ${arg.type}. Supported types: ${supportedTypes.join(', ')}`, path });
  }

  if (!arg.name) {
    errors.push({ message: 'Missing required field: name', path });
  } else if (typeof arg.name !== 'string') {
    errors.push({ message: 'name must be a string', path });
  }

  if (arg.default === undefined) {
    errors.push({ message: 'Missing required field: default', path });
  }
};

const validateToggleArg = (arg: any, path: string, errors: ValidationError[]): void => {
  if (!arg.values || !Array.isArray(arg.values)) {
    errors.push({ message: 'toggle type must have values array', path });
    return;
  }

  if (arg.values.length !== 2) {
    errors.push({ message: 'toggle type must have exactly 2 values', path });
    return;
  }

  const hasTrue = arg.values.some((v: any) => v.value === true);
  const hasFalse = arg.values.some((v: any) => v.value === false);

  if (!hasTrue || !hasFalse) {
    errors.push({ message: 'toggle type must have values for true and false', path });
  }

  arg.values.forEach((value: any, index: number) => {
    if (!value.hasOwnProperty('output')) {
      errors.push({ message: `Missing output field in value[${index}]`, path });
    } else if (typeof value.output !== 'string') {
      errors.push({ message: `output must be a string in value[${index}]`, path });
    }
  });

  if (arg.default !== true && arg.default !== false) {
    errors.push({ message: 'toggle type default must be true or false', path });
  }
};

const validateSelectArg = (arg: any, path: string, errors: ValidationError[]): void => {
  if (!arg.values || !Array.isArray(arg.values)) {
    errors.push({ message: 'select type must have values array', path });
    return;
  }

  if (arg.values.length < 2) {
    errors.push({ message: 'select type must have at least 2 values', path });
    return;
  }

  // Check for duplicates
  const valueSet = new Set();
  const duplicates: any[] = [];
  
  arg.values.forEach((value: any, index: number) => {
    if (!value.hasOwnProperty('value')) {
      errors.push({ message: `Missing value field in values[${index}]`, path });
      return;
    }
    
    if (!value.hasOwnProperty('output')) {
      errors.push({ message: `Missing output field in values[${index}]`, path });
    } else if (typeof value.output !== 'string') {
      errors.push({ message: `output must be a string in values[${index}]`, path });
    }

    if (valueSet.has(value.value)) {
      duplicates.push(value.value);
    } else {
      valueSet.add(value.value);
    }
  });

  if (duplicates.length > 0) {
    errors.push({ message: `Duplicate values found: ${duplicates.join(', ')}`, path });
  }

  // Check if default matches one of the values
  const validValues = arg.values.map((v: any) => v.value);
  if (!validValues.includes(arg.default)) {
    errors.push({ message: `default value "${arg.default}" does not match any of the available values`, path });
  }
};

const validateMultiselectArg = (arg: any, path: string, errors: ValidationError[]): void => {
  if (!arg.values || !Array.isArray(arg.values)) {
    errors.push({ message: 'multiselect type must have values array', path });
    return;
  }

  if (arg.values.length < 2) {
    errors.push({ message: 'multiselect type must have at least 2 values', path });
    return;
  }

  // Check for duplicates
  const valueSet = new Set();
  const duplicates: any[] = [];
  
  arg.values.forEach((value: any, index: number) => {
    if (!value.hasOwnProperty('value')) {
      errors.push({ message: `Missing value field in values[${index}]`, path });
      return;
    }
    
    if (!value.hasOwnProperty('output')) {
      errors.push({ message: `Missing output field in values[${index}]`, path });
    } else if (typeof value.output !== 'string') {
      errors.push({ message: `output must be a string in values[${index}]`, path });
    }

    if (valueSet.has(value.value)) {
      duplicates.push(value.value);
    } else {
      valueSet.add(value.value);
    }
  });

  if (duplicates.length > 0) {
    errors.push({ message: `Duplicate values found: ${duplicates.join(', ')}`, path });
  }

  // Check if default is an array and all values exist
  if (!Array.isArray(arg.default)) {
    errors.push({ message: 'multiselect type default must be an array', path });
  } else {
    const validValues = arg.values.map((v: any) => v.value);
    const invalidDefaults = arg.default.filter((defaultValue: any) => !validValues.includes(defaultValue));
    
    if (invalidDefaults.length > 0) {
      errors.push({ message: `default values not found in available values: ${invalidDefaults.join(', ')}`, path });
    }
  }
};

const validateInputArg = (arg: any, path: string, errors: ValidationError[]): void => {
  // Input type only needs generic validation
  // Default should be a string for input type
  if (typeof arg.default !== 'string') {
    errors.push({ message: 'input type default must be a string', path });
  }
};