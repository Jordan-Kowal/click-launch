package backend

import (
	"os"
	"path/filepath"
	"testing"
)

type configTestCase struct {
	name           string
	filename       string
	expectedErrors []ValidationError
	shouldBeValid  bool
}

var configTestCases = []configTestCase{
	{
		name:     "not a YAML file",
		filename: "not-yaml.txt",
		expectedErrors: []ValidationError{
			{Message: "Invalid YAML file"},
		},
		shouldBeValid: false,
	},
	{
		name:     "invalid YAML parsing error",
		filename: "invalid-yaml-parsing.yml",
		expectedErrors: []ValidationError{
			{Message: "Invalid YAML file"},
		},
		shouldBeValid: false,
	},
	{
		name:     "missing project_name and processes (root level)",
		filename: "missing-root-fields.yml",
		expectedErrors: []ValidationError{
			{Message: "project_name must be a non-empty string", Path: ""},
			{Message: "processes must be an array - min length: 1", Path: ""},
		},
		shouldBeValid: false,
	},
	{
		name:     "missing name and base_command",
		filename: "missing-process-fields.yml",
		expectedErrors: []ValidationError{
			{Message: "name must be a non-empty string", Path: "processes[0]"},
			{Message: "base_command must be a non-empty string", Path: "processes[0]"},
		},
		shouldBeValid: false,
	},
	{
		name:     "invalid arg (missing name, missing type, missing default)",
		filename: "invalid-arg-generic.yml",
		expectedErrors: []ValidationError{
			{Message: "name must be a non-empty string", Path: "processes[0].args[0]"},
			{Message: "type must be one of the following values: toggle, select, input", Path: "processes[0].args[0]"},
			{Message: "Missing required field: default", Path: "processes[0].args[0]"},
		},
		shouldBeValid: false,
	},
	{
		name:     "invalid input args (invalid output_prefix)",
		filename: "invalid-input-args.yml",
		expectedErrors: []ValidationError{
			{Message: "output_prefix must be a non-empty string", Path: "processes[0].args[0]"},
			{Message: "output_prefix must be a non-empty string", Path: "processes[0].args[1]"},
		},
		shouldBeValid: false,
	},
	{
		name:     "invalid toggle args (missing true, missing false, invalid default)",
		filename: "invalid-toggle-args.yml",
		expectedErrors: []ValidationError{
			{Message: "toggle must have exactly two values: true and false", Path: "processes[0].args[0]"},
			{Message: "toggle must have exactly two values: true and false", Path: "processes[0].args[1]"},
			{Message: "default must be one of the following values: true, false", Path: "processes[0].args[2]"},
			{Message: "values must be an array - min length: 2 - max length: 2", Path: "processes[0].args[3]"},
		},
		shouldBeValid: false,
	},
	{
		name:     "invalid select args (1 value, invalid default)",
		filename: "invalid-select-args.yml",
		expectedErrors: []ValidationError{
			{Message: "values must be an array - min length: 2", Path: "processes[0].args[0]"},
			{Message: "default must be one of the following values: option1, option2", Path: "processes[0].args[1]"},
		},
		shouldBeValid: false,
	},
	{
		name:           "valid YAML",
		filename:       "valid-yaml.yml",
		expectedErrors: []ValidationError{},
		shouldBeValid:  true,
	},
	{
		name:     "invalid restart config (missing enabled, invalid types)",
		filename: "invalid-restart-config.yml",
		expectedErrors: []ValidationError{
			{Message: "restart.enabled must be a boolean", Path: "processes[0].restart"},
			{Message: "restart.enabled must be a boolean", Path: "processes[1].restart"},
			{Message: "restart.max_retries must be a positive number", Path: "processes[2].restart"},
			{Message: "restart.delay_ms must be a non-negative number", Path: "processes[3].restart"},
			{Message: "restart.reset_after_ms must be a non-negative number", Path: "processes[4].restart"},
		},
		shouldBeValid: false,
	},
	{
		name:           "valid restart config",
		filename:       "valid-restart-config.yml",
		expectedErrors: []ValidationError{},
		shouldBeValid:  true,
	},
	{
		name:           "valid cwd config (relative and absolute paths)",
		filename:       "valid-cwd-config.yml",
		expectedErrors: []ValidationError{},
		shouldBeValid:  true,
	},
	{
		name:     "invalid cwd config (non-string and empty)",
		filename: "invalid-cwd-config.yml",
		expectedErrors: []ValidationError{
			{Message: "cwd must be a non-empty string", Path: "processes[0]"},
			{Message: "cwd must be a non-empty string", Path: "processes[1]"},
		},
		shouldBeValid: false,
	},
	{
		name:           "valid env config (with vars, without vars, empty object)",
		filename:       "valid-env-config.yml",
		expectedErrors: []ValidationError{},
		shouldBeValid:  true,
	},
	{
		name:     "invalid env config (array, non-string values)",
		filename: "invalid-env-config.yml",
		expectedErrors: []ValidationError{
			{Message: "env must be an object", Path: "processes[0].env"},
			{Message: "env.PORT must be a string", Path: "processes[1].env"},
			{Message: "env.ENABLED must be a string", Path: "processes[2].env"},
			{Message: "env.NULL_VAR must be a string", Path: "processes[3].env"},
		},
		shouldBeValid: false,
	},
	{
		name:           "valid group config (with groups and without)",
		filename:       "valid-group-config.yml",
		expectedErrors: []ValidationError{},
		shouldBeValid:  true,
	},
	{
		name:     "invalid group config (non-string and empty)",
		filename: "invalid-group-config.yml",
		expectedErrors: []ValidationError{
			{Message: "group must be a non-empty string", Path: "processes[0]"},
			{Message: "group must be a non-empty string", Path: "processes[1]"},
		},
		shouldBeValid: false,
	},
}

func TestExtractYamlConfig(t *testing.T) {
	t.Parallel()

	for _, tc := range configTestCases {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			content, err := os.ReadFile(filepath.Join("testdata", tc.filename))
			if err != nil {
				t.Fatalf("failed to read fixture %s: %v", tc.filename, err)
			}

			result := ExtractYamlConfig(string(content))

			if result.IsValid != tc.shouldBeValid {
				t.Errorf("IsValid = %v, want %v", result.IsValid, tc.shouldBeValid)
			}

			if tc.shouldBeValid {
				if result.Config == nil {
					t.Error("Config is nil, want non-nil for valid YAML")
				}
				if len(result.Errors) != 0 {
					t.Errorf("Errors = %v, want empty", result.Errors)
				}
			} else {
				if result.Config != nil {
					t.Error("Config is non-nil, want nil for invalid YAML")
				}
				if len(result.Errors) != len(tc.expectedErrors) {
					t.Fatalf("got %d errors, want %d\ngot:  %v\nwant: %v",
						len(result.Errors), len(tc.expectedErrors), result.Errors, tc.expectedErrors)
				}
				for i, expected := range tc.expectedErrors {
					got := result.Errors[i]
					if got.Message != expected.Message {
						t.Errorf("error[%d].Message = %q, want %q", i, got.Message, expected.Message)
					}
					if got.Path != expected.Path {
						t.Errorf("error[%d].Path = %q, want %q", i, got.Path, expected.Path)
					}
				}
			}
		})
	}
}

func TestValidate(t *testing.T) {
	t.Parallel()

	svc := NewConfigService()

	t.Run("valid file sets rootDirectory", func(t *testing.T) {
		t.Parallel()

		absPath, err := filepath.Abs(filepath.Join("testdata", "valid-yaml.yml"))
		if err != nil {
			t.Fatal(err)
		}
		result := svc.Validate(absPath)

		if !result.IsValid {
			t.Errorf("IsValid = false, want true; errors: %v", result.Errors)
		}
		if result.RootDirectory != filepath.Dir(absPath) {
			t.Errorf("RootDirectory = %q, want %q", result.RootDirectory, filepath.Dir(absPath))
		}
	})

	t.Run("non-existent file returns error", func(t *testing.T) {
		t.Parallel()

		result := svc.Validate("/non/existent/file.yml")

		if result.IsValid {
			t.Error("IsValid = true, want false for non-existent file")
		}
		if len(result.Errors) != 1 {
			t.Fatalf("got %d errors, want 1", len(result.Errors))
		}
		if result.Errors[0].Message == "" {
			t.Error("expected non-empty error message")
		}
	})
}
