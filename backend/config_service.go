package backend

import (
	"fmt"
	"os"
	"path/filepath"

	"gopkg.in/yaml.v3"
)

// ConfigService handles YAML config parsing and validation.
type ConfigService struct{}

// NewConfigService creates a new ConfigService.
func NewConfigService() *ConfigService {
	return &ConfigService{}
}

// Validate reads a YAML file, parses it, and validates all fields.
// Returns a ValidationResult with the parsed config or accumulated errors.
func (s *ConfigService) Validate(filePath string) ValidationResult {
	rootDirectory := filepath.Dir(filePath)

	content, err := os.ReadFile(filePath) //nolint:gosec // user-specified config path
	if err != nil {
		return ValidationResult{
			IsValid:       false,
			Config:        nil,
			RootDirectory: rootDirectory,
			Errors: []ValidationError{
				{Message: fmt.Sprintf("Failed to read file: %s", err.Error())},
			},
		}
	}

	result := ExtractYamlConfig(string(content))
	result.RootDirectory = rootDirectory
	return result
}

// ExtractYamlConfig parses YAML content and validates it against the config schema.
func ExtractYamlConfig(yamlContent string) ValidationResult {
	var raw any
	if err := yaml.Unmarshal([]byte(yamlContent), &raw); err != nil {
		return ValidationResult{
			IsValid: false,
			Config:  nil,
			Errors:  []ValidationError{{Message: "Invalid YAML file"}},
		}
	}

	config, ok := raw.(map[string]any)
	if !ok || config == nil {
		return ValidationResult{
			IsValid: false,
			Config:  nil,
			Errors:  []ValidationError{{Message: "Invalid YAML file"}},
		}
	}

	var errors []ValidationError
	validateRootStructure(config, &errors)

	if processes, ok := config["processes"].([]any); ok {
		for i, p := range processes {
			validateProcess(p, fmt.Sprintf("processes[%d]", i), &errors)
		}
	}

	if len(errors) > 0 {
		return ValidationResult{
			IsValid: false,
			Config:  nil,
			Errors:  errors,
		}
	}

	var typedConfig YamlConfig
	if err := yaml.Unmarshal([]byte(yamlContent), &typedConfig); err != nil {
		return ValidationResult{
			IsValid: false,
			Config:  nil,
			Errors:  []ValidationError{{Message: "Invalid YAML file"}},
		}
	}

	return ValidationResult{
		IsValid: true,
		Config:  &typedConfig,
		Errors:  []ValidationError{},
	}
}

func validateRootStructure(config map[string]any, errors *[]ValidationError) {
	validateString("project_name", config["project_name"], true, "", errors)
	validateArray("processes", config["processes"], intPtr(1), nil, "", errors)
}

func validateProcess(raw any, basePath string, errors *[]ValidationError) {
	process, ok := raw.(map[string]any)
	if !ok {
		*errors = append(*errors, ValidationError{
			Message: "process must be an object",
			Path:    basePath,
		})
		return
	}

	validateString("name", process["name"], true, basePath, errors)
	validateString("base_command", process["base_command"], true, basePath, errors)

	if _, exists := process["group"]; exists {
		validateString("group", process["group"], true, basePath, errors)
	}
	if _, exists := process["cwd"]; exists {
		validateString("cwd", process["cwd"], true, basePath, errors)
	}
	if _, exists := process["env"]; exists {
		validateEnvConfig(process["env"], basePath+".env", errors)
	}
	if restart, exists := process["restart"]; exists && restart != nil {
		validateRestartConfig(restart, basePath+".restart", errors)
	}
	if args, exists := process["args"]; exists {
		validateArray("args", args, intPtr(0), nil, basePath, errors)
		if argList, ok := args.([]any); ok {
			for i, arg := range argList {
				validateArg(arg, fmt.Sprintf("%s.args[%d]", basePath, i), errors)
			}
		}
	}
}

func validateEnvConfig(raw any, path string, errors *[]ValidationError) {
	env, ok := raw.(map[string]any)
	if !ok {
		*errors = append(*errors, ValidationError{
			Message: "env must be an object",
			Path:    path,
		})
		return
	}

	for key, value := range env {
		if key == "" {
			*errors = append(*errors, ValidationError{
				Message: "env key must be a non-empty string",
				Path:    path,
			})
		}
		if _, ok := value.(string); !ok {
			*errors = append(*errors, ValidationError{
				Message: fmt.Sprintf("env.%s must be a string", key),
				Path:    path,
			})
		}
	}
}

func validateRestartConfig(raw any, path string, errors *[]ValidationError) {
	restart, ok := raw.(map[string]any)
	if !ok {
		*errors = append(*errors, ValidationError{
			Message: "restart must be an object",
			Path:    path,
		})
		return
	}

	if enabled, exists := restart["enabled"]; !exists || !isBool(enabled) {
		*errors = append(*errors, ValidationError{
			Message: "restart.enabled must be a boolean",
			Path:    path,
		})
	}

	if v, exists := restart["max_retries"]; exists {
		if n, ok := toInt(v); !ok || n < 1 {
			*errors = append(*errors, ValidationError{
				Message: "restart.max_retries must be a positive number",
				Path:    path,
			})
		}
	}

	if v, exists := restart["delay_ms"]; exists {
		if n, ok := toInt(v); !ok || n < 0 {
			*errors = append(*errors, ValidationError{
				Message: "restart.delay_ms must be a non-negative number",
				Path:    path,
			})
		}
	}

	if v, exists := restart["reset_after_ms"]; exists {
		if n, ok := toInt(v); !ok || n < 0 {
			*errors = append(*errors, ValidationError{
				Message: "restart.reset_after_ms must be a non-negative number",
				Path:    path,
			})
		}
	}
}

func validateArg(raw any, basePath string, errors *[]ValidationError) {
	arg, ok := raw.(map[string]any)
	if !ok {
		*errors = append(*errors, ValidationError{
			Message: "arg must be an object",
			Path:    basePath,
		})
		return
	}

	validateArgGeneric(arg, basePath, errors)

	argType, _ := arg["type"].(string)
	switch argType {
	case "toggle":
		validateToggleArg(arg, basePath, errors)
	case "select":
		validateSelectArg(arg, basePath, errors)
	case "input":
		validateInputArg(arg, basePath, errors)
	}
}

func validateArgGeneric(arg map[string]any, path string, errors *[]ValidationError) {
	validateString("name", arg["name"], true, path, errors)
	validateValueIn("type", arg["type"], []any{"toggle", "select", "input"}, path, errors)
	if _, exists := arg["default"]; !exists {
		*errors = append(*errors, ValidationError{
			Message: "Missing required field: default",
			Path:    path,
		})
	}
}

func validateToggleArg(arg map[string]any, path string, errors *[]ValidationError) {
	validateArray("values", arg["values"], intPtr(2), intPtr(2), path, errors)

	values, ok := arg["values"].([]any)
	if !ok {
		return
	}

	hasTrue := false
	hasFalse := false
	for _, v := range values {
		vm, ok := v.(map[string]any)
		if !ok {
			continue
		}
		if vm["value"] == true {
			hasTrue = true
		}
		if vm["value"] == false {
			hasFalse = true
		}
	}
	if !hasTrue || !hasFalse {
		*errors = append(*errors, ValidationError{
			Message: "toggle must have exactly two values: true and false",
			Path:    path,
		})
	}

	for i, v := range values {
		vm, ok := v.(map[string]any)
		if !ok {
			continue
		}
		validateString("output", vm["output"], false, fmt.Sprintf("%s[%d].output", path, i), errors)
	}

	validateValueIn("default", arg["default"], []any{true, false}, path, errors)
}

func validateSelectArg(arg map[string]any, path string, errors *[]ValidationError) {
	validateArray("values", arg["values"], intPtr(2), nil, path, errors)

	values, ok := arg["values"].([]any)
	if !ok {
		return
	}

	var allowedValues []any
	for i, v := range values {
		vm, ok := v.(map[string]any)
		if !ok {
			continue
		}
		validateString("output", vm["output"], false, fmt.Sprintf("%s[%d].output", path, i), errors)
		validateString("value", vm["value"], true, fmt.Sprintf("%s[%d].value", path, i), errors)
		if val, ok := vm["value"].(string); ok {
			allowedValues = append(allowedValues, val)
		}
	}

	validateValueIn("default", arg["default"], allowedValues, path, errors)
}

func validateInputArg(arg map[string]any, path string, errors *[]ValidationError) {
	validateString("output_prefix", arg["output_prefix"], false, path, errors)
}

// validateString checks that a value is a non-empty string.
// If required is false, the value can be an empty string but must still be a string type.
func validateString(fieldName string, value any, required bool, path string, errors *[]ValidationError) {
	str, ok := value.(string)
	if required {
		if !ok || str == "" {
			*errors = append(*errors, ValidationError{
				Message: fmt.Sprintf("%s must be a non-empty string", fieldName),
				Path:    path,
			})
		}
	} else {
		if !ok {
			*errors = append(*errors, ValidationError{
				Message: fmt.Sprintf("%s must be a non-empty string", fieldName),
				Path:    path,
			})
		}
	}
}

// validateArray checks that a value is an array with optional length constraints.
func validateArray(fieldName string, value any, minLength *int, maxLength *int, path string, errors *[]ValidationError) {
	arr, ok := value.([]any)
	if !ok || arr == nil {
		msg := fmt.Sprintf("%s must be an array", fieldName)
		if minLength != nil {
			msg += fmt.Sprintf(" - min length: %d", *minLength)
		}
		if maxLength != nil {
			msg += fmt.Sprintf(" - max length: %d", *maxLength)
		}
		*errors = append(*errors, ValidationError{Message: msg, Path: path})
		return
	}

	if (minLength != nil && len(arr) < *minLength) || (maxLength != nil && len(arr) > *maxLength) {
		msg := fmt.Sprintf("%s must be an array", fieldName)
		if minLength != nil {
			msg += fmt.Sprintf(" - min length: %d", *minLength)
		}
		if maxLength != nil {
			msg += fmt.Sprintf(" - max length: %d", *maxLength)
		}
		*errors = append(*errors, ValidationError{Message: msg, Path: path})
	}
}

// validateValueIn checks that a value is one of the allowed values.
func validateValueIn(fieldName string, value any, allowed []any, path string, errors *[]ValidationError) {
	if value == nil || value == "" {
		*errors = append(*errors, ValidationError{
			Message: fmt.Sprintf("%s must be one of the following values: %s", fieldName, formatValues(allowed)),
			Path:    path,
		})
		return
	}

	for _, a := range allowed {
		if value == a {
			return
		}
	}

	*errors = append(*errors, ValidationError{
		Message: fmt.Sprintf("%s must be one of the following values: %s", fieldName, formatValues(allowed)),
		Path:    path,
	})
}

func formatValues(values []any) string {
	result := ""
	for i, v := range values {
		if i > 0 {
			result += ", "
		}
		result += fmt.Sprintf("%v", v)
	}
	return result
}

func intPtr(n int) *int {
	return &n
}

func isBool(v any) bool {
	_, ok := v.(bool)
	return ok
}

func toInt(v any) (int, bool) {
	switch n := v.(type) {
	case int:
		return n, true
	case float64:
		return int(n), true
	default:
		return 0, false
	}
}
