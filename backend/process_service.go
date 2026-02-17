package backend

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"os"
	"os/exec"
	"sync"
	"syscall"
	"time"

	"github.com/google/uuid"
	"github.com/wailsapp/wails/v3/pkg/application"
)

const (
	processKillTimeoutMs = 10_000
	defaultMaxRetries    = 3
	defaultDelayMs       = 1000
	defaultResetAfterMs  = 30000
	logBatchIntervalMs   = 100
)

// eventEmitter abstracts Wails event emission for testing.
type eventEmitter interface {
	Emit(name string, data ...any)
}

// wailsEmitter is the production eventEmitter using Wails events.
type wailsEmitter struct{}

func (w *wailsEmitter) Emit(name string, data ...any) {
	application.Get().Event.Emit(name, data...)
}

// processState holds the runtime state of a managed process.
type processState struct {
	cmd           *exec.Cmd
	pid           int
	cwd           string
	command       string
	customEnv     map[string]string
	restartCfg    *RestartConfig
	retryCount    int
	lastStartTime time.Time
	manualStop    bool
	exited        bool
	restartTimer  *time.Timer
	cancel        context.CancelFunc
}

// ProcessService manages child processes: spawning, stopping, restarting, and log streaming.
type ProcessService struct {
	mu        sync.RWMutex
	processes map[string]*processState

	logMu       sync.Mutex
	pendingLogs []ProcessLogData
	batchTicker *time.Ticker
	batchDone   chan struct{}

	emitter eventEmitter
}

// NewProcessService creates a ProcessService with production defaults.
func NewProcessService() *ProcessService {
	return &ProcessService{
		processes: make(map[string]*processState),
		emitter:   &wailsEmitter{},
	}
}

// --- Log batching ---

// startBatchTicker starts the log batching goroutine if not already running.
func (s *ProcessService) startBatchTicker() {
	s.logMu.Lock()
	if s.batchTicker != nil {
		s.logMu.Unlock()
		return
	}
	ticker := time.NewTicker(logBatchIntervalMs * time.Millisecond)
	s.batchTicker = ticker
	s.batchDone = make(chan struct{})
	done := s.batchDone
	s.logMu.Unlock()

	go func() {
		for {
			select {
			case <-ticker.C:
				s.flushLogs()
			case <-done:
				return
			}
		}
	}()
}

// stopBatchTicker stops the log batching goroutine and flushes remaining logs.
func (s *ProcessService) stopBatchTicker() {
	s.flushLogs()
	s.logMu.Lock()
	defer s.logMu.Unlock()
	if s.batchTicker == nil {
		return
	}
	s.batchTicker.Stop()
	close(s.batchDone)
	s.batchTicker = nil
	s.batchDone = nil
}

// flushLogs emits all pending logs as a single batch event.
func (s *ProcessService) flushLogs() {
	s.logMu.Lock()
	if len(s.pendingLogs) == 0 {
		s.logMu.Unlock()
		return
	}
	batch := s.pendingLogs
	s.pendingLogs = nil
	s.logMu.Unlock()

	s.emitter.Emit("process-log:batch", batch)
}

// queueLog adds a log entry to the pending batch.
func (s *ProcessService) queueLog(log ProcessLogData) {
	s.logMu.Lock()
	s.pendingLogs = append(s.pendingLogs, log)
	s.logMu.Unlock()
}

// --- Process spawning ---

// spawnProcess creates and starts a child process, wiring up stdout/stderr capture and exit handling.
func (s *ProcessService) spawnProcess(
	processID string,
	cwd string,
	command string,
	restartCfg *RestartConfig,
	retryCount int,
	customEnv map[string]string,
) error {
	cmd := exec.Command("sh", "-c", command) //nolint:gosec // user-configured command
	cmd.Dir = cwd

	// Build environment: system env + color vars + custom env
	env := os.Environ()
	env = append(env, "FORCE_COLOR=1", "TERM=xterm-256color", "COLORTERM=truecolor")
	for k, v := range customEnv {
		env = append(env, fmt.Sprintf("%s=%s", k, v))
	}
	cmd.Env = env

	// Create new process group for clean shutdown
	cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return fmt.Errorf("creating stdout pipe: %w", err)
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		return fmt.Errorf("creating stderr pipe: %w", err)
	}

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("starting command: %w", err)
	}

	ctx, cancel := context.WithCancel(context.Background())

	state := &processState{
		cmd:           cmd,
		pid:           cmd.Process.Pid,
		cwd:           cwd,
		command:       command,
		customEnv:     customEnv,
		restartCfg:    restartCfg,
		retryCount:    retryCount,
		lastStartTime: time.Now(),
		manualStop:    false,
		cancel:        cancel,
	}

	s.mu.Lock()
	s.processes[processID] = state
	s.mu.Unlock()

	s.startBatchTicker()

	go s.streamOutput(ctx, processID, stdout, "stdout")
	go s.streamOutput(ctx, processID, stderr, "stderr")
	go s.waitForExit(processID, cmd)

	return nil
}

// streamOutput reads lines from a pipe and queues them as log entries.
func (s *ProcessService) streamOutput(ctx context.Context, processID string, pipe io.Reader, logType string) {
	scanner := bufio.NewScanner(pipe)
	scanner.Buffer(make([]byte, 0, 1024*1024), 1024*1024) // 1MB buffer for long lines
	for scanner.Scan() {
		select {
		case <-ctx.Done():
			return
		default:
			s.queueLog(ProcessLogData{
				ProcessID: processID,
				Type:      logType,
				Output:    scanner.Text() + "\n",
				Timestamp: time.Now().UTC().Format(time.RFC3339Nano),
			})
		}
	}
}

// --- Exit handling and restart ---

// waitForExit waits for the process to exit and handles restart logic.
func (s *ProcessService) waitForExit(processID string, cmd *exec.Cmd) {
	_ = cmd.Wait()

	// Extract exit info immediately after Wait (only this goroutine touches cmd now)
	exitCode, signal := extractExitInfo(cmd)

	s.flushLogs()

	s.mu.Lock()
	state, exists := s.processes[processID]
	if !exists {
		s.mu.Unlock()
		return
	}

	state.exited = true

	manualStop := state.manualStop
	restartCfg := state.restartCfg
	lastStartTime := state.lastStartTime
	retryCount := state.retryCount
	cwd := state.cwd
	command := state.command
	customEnv := state.customEnv

	state.cancel()
	delete(s.processes, processID)
	s.mu.Unlock()

	s.queueLog(ProcessLogData{
		ProcessID: processID,
		Type:      "exit",
		Timestamp: time.Now().UTC().Format(time.RFC3339Nano),
		Code:      exitCode,
		Signal:    signal,
	})
	s.flushLogs()

	isCleanExit := exitCode != nil && *exitCode == 0
	if manualStop || isCleanExit || restartCfg == nil || !restartCfg.Enabled {
		if !manualStop && !isCleanExit {
			s.emitter.Emit("process-crash", ProcessCrashData{
				ProcessID:   processID,
				ExitCode:    exitCode,
				Signal:      signal,
				WillRestart: false,
				Timestamp:   time.Now().UTC().Format(time.RFC3339Nano),
			})
		}
		return
	}

	maxRetries := defaultMaxRetries
	if restartCfg.MaxRetries != nil {
		maxRetries = *restartCfg.MaxRetries
	}
	delayMs := defaultDelayMs
	if restartCfg.DelayMs != nil {
		delayMs = *restartCfg.DelayMs
	}
	resetAfterMs := defaultResetAfterMs
	if restartCfg.ResetAfterMs != nil {
		resetAfterMs = *restartCfg.ResetAfterMs
	}

	runDuration := time.Since(lastStartTime)
	effectiveRetryCount := retryCount
	if runDuration >= time.Duration(resetAfterMs)*time.Millisecond {
		effectiveRetryCount = 0
	}

	if effectiveRetryCount >= maxRetries {
		s.emitter.Emit("process-crash", ProcessCrashData{
			ProcessID:   processID,
			ExitCode:    exitCode,
			Signal:      signal,
			WillRestart: false,
			Timestamp:   time.Now().UTC().Format(time.RFC3339Nano),
		})
		return
	}

	s.emitter.Emit("process-crash", ProcessCrashData{
		ProcessID:   processID,
		ExitCode:    exitCode,
		Signal:      signal,
		WillRestart: true,
		Timestamp:   time.Now().UTC().Format(time.RFC3339Nano),
	})

	newRetryCount := effectiveRetryCount + 1
	restartTimer := time.AfterFunc(time.Duration(delayMs)*time.Millisecond, func() {
		s.emitter.Emit("process-restart", ProcessRestartData{
			ProcessID:  processID,
			RetryCount: newRetryCount,
			MaxRetries: maxRetries,
			Timestamp:  time.Now().UTC().Format(time.RFC3339Nano),
		})
		if err := s.spawnProcess(processID, cwd, command, restartCfg, newRetryCount, customEnv); err != nil {
			s.emitter.Emit("process-crash", ProcessCrashData{
				ProcessID:   processID,
				WillRestart: false,
				Timestamp:   time.Now().UTC().Format(time.RFC3339Nano),
			})
		}
	})

	// Store placeholder state for the pending restart timer
	s.mu.Lock()
	s.processes[processID] = &processState{
		cwd:          cwd,
		command:      command,
		customEnv:    customEnv,
		restartCfg:   restartCfg,
		retryCount:   newRetryCount,
		manualStop:   false,
		restartTimer: restartTimer,
		cancel:       func() {},
	}
	s.mu.Unlock()
}

// extractExitInfo extracts exit code and signal from a completed command.
func extractExitInfo(cmd *exec.Cmd) (*int, *string) {
	if cmd.ProcessState == nil {
		return nil, nil
	}
	status, ok := cmd.ProcessState.Sys().(syscall.WaitStatus)
	if !ok {
		return nil, nil
	}
	if status.Signaled() {
		sig := status.Signal().String()
		return nil, &sig
	}
	code := status.ExitStatus()
	return &code, nil
}

// --- Exported methods (Wails bindings) ---

// Start spawns a new process and returns its ID.
func (s *ProcessService) Start(cwd string, command string, restartConfig *RestartConfig, env map[string]string) ProcessStartResult {
	if _, err := os.Stat(cwd); os.IsNotExist(err) {
		return ProcessStartResult{
			Success: false,
			Error:   fmt.Sprintf("Working directory not found: %s", cwd),
		}
	}

	processID := uuid.New().String()
	if err := s.spawnProcess(processID, cwd, command, restartConfig, 0, env); err != nil {
		return ProcessStartResult{
			Success: false,
			Error:   err.Error(),
		}
	}
	return ProcessStartResult{
		Success:   true,
		ProcessID: processID,
	}
}

// Stop terminates a process by ID. Idempotent — returns success for unknown IDs.
func (s *ProcessService) Stop(id string) ProcessStopResult {
	s.mu.Lock()
	state, exists := s.processes[id]
	if !exists {
		s.mu.Unlock()
		return ProcessStopResult{Success: true}
	}

	state.manualStop = true

	if state.restartTimer != nil {
		state.restartTimer.Stop()
		state.restartTimer = nil
	}

	// Restart-pending placeholder (cmd is nil)
	if state.cmd == nil {
		delete(s.processes, id)
		s.mu.Unlock()
		return ProcessStopResult{Success: true}
	}

	pid := state.pid
	s.mu.Unlock()

	// Send SIGTERM to process group
	_ = syscall.Kill(-pid, syscall.SIGTERM)

	// Schedule force kill after timeout (capture pid to avoid re-reading from map)
	time.AfterFunc(processKillTimeoutMs*time.Millisecond, func() {
		s.mu.RLock()
		currentState, stillExists := s.processes[id]
		s.mu.RUnlock()
		if stillExists && !currentState.exited {
			_ = syscall.Kill(-pid, syscall.SIGKILL)
		}
	})

	return ProcessStopResult{Success: true}
}

// IsRunning returns whether a process is currently active.
func (s *ProcessService) IsRunning(id string) bool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	state, exists := s.processes[id]
	if !exists {
		return false
	}
	// Restart-pending placeholder or already exited
	if state.cmd == nil || state.exited {
		return false
	}
	return true
}

// BulkStatus returns running status for multiple process IDs.
func (s *ProcessService) BulkStatus(ids []string) map[string]bool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	result := make(map[string]bool, len(ids))
	for _, id := range ids {
		state, exists := s.processes[id]
		result[id] = exists && state.cmd != nil && !state.exited
	}
	return result
}

// GetRunningProcessPids returns the OS PID for each running process. Used by ResourceService.
func (s *ProcessService) GetRunningProcessPids(ids []string) map[string]int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	result := make(map[string]int, len(ids))
	for _, id := range ids {
		state, exists := s.processes[id]
		if !exists || state.cmd == nil || state.exited {
			continue
		}
		result[id] = state.pid
	}
	return result
}

// StopAll terminates all managed processes. Called on app shutdown.
func (s *ProcessService) StopAll() {
	s.flushLogs()

	s.mu.RLock()
	ids := make([]string, 0, len(s.processes))
	for id := range s.processes {
		ids = append(ids, id)
	}
	s.mu.RUnlock()

	for _, id := range ids {
		s.Stop(id)
	}

	s.stopBatchTicker()
}

// ServiceShutdown is called by Wails when the application is shutting down.
func (s *ProcessService) ServiceShutdown() error {
	s.StopAll()
	return nil
}
