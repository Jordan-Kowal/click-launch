package backend

// ValidationError represents a single validation error with an optional path.
type ValidationError struct {
	Message string `json:"message"`
	Path    string `json:"path,omitempty"`
}

// ValidationResult represents the result of YAML config validation.
type ValidationResult struct {
	IsValid       bool              `json:"isValid"`
	Config        *YamlConfig       `json:"config"`
	Errors        []ValidationError `json:"errors"`
	RootDirectory string            `json:"rootDirectory,omitempty"`
}

// YamlConfig represents the parsed YAML configuration.
type YamlConfig struct {
	ProjectName string          `json:"project_name" yaml:"project_name"`
	Processes   []ProcessConfig `json:"processes" yaml:"processes"`
}

// ProcessConfig represents a single process definition.
type ProcessConfig struct {
	Name        string            `json:"name" yaml:"name"`
	BaseCommand string            `json:"base_command" yaml:"base_command"`
	Group       *string           `json:"group,omitempty" yaml:"group,omitempty"`
	Cwd         *string           `json:"cwd,omitempty" yaml:"cwd,omitempty"`
	Env         map[string]string `json:"env,omitempty" yaml:"env,omitempty"`
	Restart     *RestartConfig    `json:"restart,omitempty" yaml:"restart,omitempty"`
	Args        []ArgConfig       `json:"args,omitempty" yaml:"args,omitempty"`
}

// RestartConfig defines auto-restart behavior.
type RestartConfig struct {
	Enabled      bool `json:"enabled" yaml:"enabled"`
	MaxRetries   *int `json:"max_retries,omitempty" yaml:"max_retries,omitempty"`
	DelayMs      *int `json:"delay_ms,omitempty" yaml:"delay_ms,omitempty"`
	ResetAfterMs *int `json:"reset_after_ms,omitempty" yaml:"reset_after_ms,omitempty"`
}

// ArgConfig represents a configurable argument.
type ArgConfig struct {
	Type         string     `json:"type" yaml:"type"`
	Name         string     `json:"name" yaml:"name"`
	Default      any        `json:"default" yaml:"default"`
	OutputPrefix *string    `json:"output_prefix,omitempty" yaml:"output_prefix,omitempty"`
	Values       []ArgValue `json:"values,omitempty" yaml:"values,omitempty"`
}

// ArgValue represents a possible value for toggle/select arguments.
type ArgValue struct {
	Value  any    `json:"value" yaml:"value"`
	Output string `json:"output" yaml:"output"`
}

// ProcessStartResult is returned when starting a process.
type ProcessStartResult struct {
	Success   bool   `json:"success"`
	ProcessID string `json:"processId,omitempty"`
	Error     string `json:"error,omitempty"`
}

// ProcessStopResult is returned when stopping a process.
type ProcessStopResult struct {
	Success bool   `json:"success"`
	Error   string `json:"error,omitempty"`
}

// ProcessResourceData holds CPU and memory data for a process.
type ProcessResourceData struct {
	CPU         float64 `json:"cpu"`
	MemoryBytes int64   `json:"memoryBytes"`
}

// ProcessLogData represents a log entry from a process.
type ProcessLogData struct {
	ProcessID string  `json:"processId"`
	Timestamp string  `json:"timestamp"`
	Type      string  `json:"type"`
	Output    string  `json:"output,omitempty"`
	Code      *int    `json:"code,omitempty"`
	Signal    *string `json:"signal,omitempty"`
}

// ProcessRestartData is emitted when a process auto-restarts.
type ProcessRestartData struct {
	ProcessID  string `json:"processId"`
	RetryCount int    `json:"retryCount"`
	MaxRetries int    `json:"maxRetries"`
	Timestamp  string `json:"timestamp"`
}

// ProcessCrashData is emitted when a process crashes.
type ProcessCrashData struct {
	ProcessID   string  `json:"processId"`
	ExitCode    *int    `json:"exitCode"`
	Signal      *string `json:"signal"`
	WillRestart bool    `json:"willRestart"`
	Timestamp   string  `json:"timestamp"`
}
