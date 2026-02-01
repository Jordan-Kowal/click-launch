import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { extractYamlConfig } from "./extractYamlConfig";

type TestCase = {
  name: string;
  filename: string;
  expectedErrors: { message: string; path?: string }[];
  shouldBeValid: boolean;
};

const testCases: TestCase[] = [
  {
    name: "not a YAML file",
    filename: "./electron/utils/test-files/not-yaml.txt",
    expectedErrors: [{ message: "Invalid YAML file" }],
    shouldBeValid: false,
  },
  {
    name: "invalid YAML parsing error",
    filename: "./electron/utils/test-files/invalid-yaml-parsing.yml",
    expectedErrors: [{ message: "Invalid YAML file" }],
    shouldBeValid: false,
  },
  {
    name: "missing project_name and processes (root level)",
    filename: "./electron/utils/test-files/missing-root-fields.yml",
    expectedErrors: [
      { message: "project_name must be a non-empty string", path: "" },
      { message: "processes must be an array - min length: 1", path: "" },
    ],
    shouldBeValid: false,
  },
  {
    name: "missing name and base_command",
    filename: "./electron/utils/test-files/missing-process-fields.yml",
    expectedErrors: [
      { message: "name must be a non-empty string", path: "processes[0]" },
      {
        message: "base_command must be a non-empty string",
        path: "processes[0]",
      },
    ],
    shouldBeValid: false,
  },
  {
    name: "invalid arg (missing name, missing type, missing default)",
    filename: "./electron/utils/test-files/invalid-arg-generic.yml",
    expectedErrors: [
      {
        message: "name must be a non-empty string",
        path: "processes[0].args[0]",
      },
      {
        message:
          "type must be one of the following values: toggle, select, input",
        path: "processes[0].args[0]",
      },
      {
        message: "Missing required field: default",
        path: "processes[0].args[0]",
      },
    ],
    shouldBeValid: false,
  },
  {
    name: "invalid input args (invalid output)",
    filename: "./electron/utils/test-files/invalid-input-args.yml",
    expectedErrors: [
      {
        message: "output_prefix must be a non-empty string",
        path: "processes[0].args[0]",
      },
      {
        message: "output_prefix must be a non-empty string",
        path: "processes[0].args[1]",
      },
    ],
    shouldBeValid: false,
  },
  {
    name: "invalid toggle args (missing true, missing false, invalid default)",
    filename: "./electron/utils/test-files/invalid-toggle-args.yml",
    expectedErrors: [
      {
        message: "toggle must have exactly two values: true and false",
        path: "processes[0].args[0]",
      },
      {
        message: "toggle must have exactly two values: true and false",
        path: "processes[0].args[1]",
      },
      {
        message: "default must be one of the following values: true, false",
        path: "processes[0].args[2]",
      },
      {
        message: "values must be an array - min length: 2 - max length: 2",
        path: "processes[0].args[3]",
      },
    ],
    shouldBeValid: false,
  },
  {
    name: "invalid select args (1 value, invalid default)",
    filename: "./electron/utils/test-files/invalid-select-args.yml",
    expectedErrors: [
      {
        message: "values must be an array - min length: 2",
        path: "processes[0].args[0]",
      },
      {
        message:
          "default must be one of the following values: option1, option2",
        path: "processes[0].args[1]",
      },
    ],
    shouldBeValid: false,
  },
  {
    name: "valid YAML",
    filename: "./electron/utils/test-files/valid-yaml.yml",
    expectedErrors: [],
    shouldBeValid: true,
  },
  {
    name: "invalid restart config (missing enabled, invalid types)",
    filename: "./electron/utils/test-files/invalid-restart-config.yml",
    expectedErrors: [
      {
        message: "restart.enabled must be a boolean",
        path: "processes[0].restart",
      },
      {
        message: "restart.enabled must be a boolean",
        path: "processes[1].restart",
      },
      {
        message: "restart.max_retries must be a positive number",
        path: "processes[2].restart",
      },
      {
        message: "restart.delay_ms must be a non-negative number",
        path: "processes[3].restart",
      },
      {
        message: "restart.reset_after_ms must be a non-negative number",
        path: "processes[4].restart",
      },
    ],
    shouldBeValid: false,
  },
  {
    name: "valid restart config",
    filename: "./electron/utils/test-files/valid-restart-config.yml",
    expectedErrors: [],
    shouldBeValid: true,
  },
];

describe.concurrent("extractYamlConfig", async () => {
  test.each(testCases)("$name", async ({
    filename,
    expectedErrors,
    shouldBeValid,
  }) => {
    const yamlContent = readFileSync(filename, "utf8");
    const result = extractYamlConfig(yamlContent);

    expect(result.isValid).toBe(shouldBeValid);

    if (shouldBeValid) {
      expect(result.config).not.toBe(null);
      expect(result.errors).toHaveLength(0);
    } else {
      expect(result.config).toBe(null);
      expect(result.errors).toEqual(expectedErrors);
    }
  });
});
