package backend

import (
	"strings"
	"sync"
	"testing"
	"time"
)

const (
	eventProcessCrash    = "process-crash"
	eventProcessLogBatch = "process-log:batch"
)

// --- Test helpers ---

type emittedEvent struct {
	name string
	data []any
}

type mockEmitter struct {
	mu     sync.Mutex
	events []emittedEvent
}

func (m *mockEmitter) Emit(name string, data ...any) {
	m.mu.Lock()
	m.events = append(m.events, emittedEvent{name: name, data: data})
	m.mu.Unlock()
}

func (m *mockEmitter) getEvents() []emittedEvent {
	m.mu.Lock()
	defer m.mu.Unlock()
	cp := make([]emittedEvent, len(m.events))
	copy(cp, m.events)
	return cp
}

func (m *mockEmitter) waitForEvent(name string) bool {
	deadline := time.Now().Add(2 * time.Second)
	for time.Now().Before(deadline) {
		for _, e := range m.getEvents() {
			if e.name == name {
				return true
			}
		}
		time.Sleep(10 * time.Millisecond)
	}
	return false
}

func (m *mockEmitter) waitForLogContaining(logType string) bool {
	deadline := time.Now().Add(5 * time.Second)
	for time.Now().Before(deadline) {
		for _, e := range m.getEvents() {
			if e.name != eventProcessLogBatch || len(e.data) == 0 {
				continue
			}
			batch, ok := e.data[0].([]ProcessLogData)
			if !ok {
				continue
			}
			for _, log := range batch {
				if log.Type == logType {
					return true
				}
			}
		}
		time.Sleep(10 * time.Millisecond)
	}
	return false
}

func (m *mockEmitter) countEvents(name string) int {
	count := 0
	for _, e := range m.getEvents() {
		if e.name == name {
			count++
		}
	}
	return count
}

func newTestProcessService() (*ProcessService, *mockEmitter) {
	emitter := &mockEmitter{}
	svc := &ProcessService{
		processes: make(map[string]*processState),
		emitter:   emitter,
	}
	return svc, emitter
}

// --- Tests ---

func TestStart_Success(t *testing.T) {
	t.Parallel()
	svc, _ := newTestProcessService()
	t.Cleanup(svc.StopAll)

	result := svc.Start(t.TempDir(), "echo hello", nil, nil)

	if !result.Success {
		t.Fatalf("expected success, got error: %s", result.Error)
	}
	if result.ProcessID == "" {
		t.Fatal("expected non-empty process ID")
	}
	if result.Error != "" {
		t.Fatalf("expected no error, got: %s", result.Error)
	}
}

func TestStart_InvalidCwd(t *testing.T) {
	t.Parallel()
	svc, _ := newTestProcessService()
	t.Cleanup(svc.StopAll)

	result := svc.Start("/nonexistent/path/that/does/not/exist", "echo hello", nil, nil)

	if result.Success {
		t.Fatal("expected failure for non-existent cwd")
	}
	if !strings.Contains(result.Error, "not found") {
		t.Fatalf("expected error to contain 'not found', got: %s", result.Error)
	}
	if result.ProcessID != "" {
		t.Fatalf("expected empty process ID, got: %s", result.ProcessID)
	}
}

func TestStop_ExistingProcess(t *testing.T) {
	t.Parallel()
	svc, _ := newTestProcessService()
	t.Cleanup(svc.StopAll)

	start := svc.Start(t.TempDir(), "sleep 30", nil, nil)
	if !start.Success {
		t.Fatalf("start failed: %s", start.Error)
	}

	result := svc.Stop(start.ProcessID)
	if !result.Success {
		t.Fatalf("expected success, got error: %s", result.Error)
	}
}

func TestStop_NonExistent(t *testing.T) {
	t.Parallel()
	svc, _ := newTestProcessService()
	t.Cleanup(svc.StopAll)

	result := svc.Stop("non-existent-id")
	if !result.Success {
		t.Fatalf("expected success for non-existent process, got error: %s", result.Error)
	}
}

func TestIsRunning_Running(t *testing.T) {
	t.Parallel()
	svc, _ := newTestProcessService()
	t.Cleanup(svc.StopAll)

	start := svc.Start(t.TempDir(), "sleep 30", nil, nil)
	if !start.Success {
		t.Fatalf("start failed: %s", start.Error)
	}

	if !svc.IsRunning(start.ProcessID) {
		t.Fatal("expected process to be running")
	}
}

func TestIsRunning_NonExistent(t *testing.T) {
	t.Parallel()
	svc, _ := newTestProcessService()

	if svc.IsRunning("non-existent-id") {
		t.Fatal("expected non-existent process to not be running")
	}
}

func TestIsRunning_AfterStop(t *testing.T) {
	t.Parallel()
	svc, _ := newTestProcessService()
	t.Cleanup(svc.StopAll)

	start := svc.Start(t.TempDir(), "sleep 30", nil, nil)
	if !start.Success {
		t.Fatalf("start failed: %s", start.Error)
	}

	svc.Stop(start.ProcessID)
	// Wait for process to actually exit
	time.Sleep(200 * time.Millisecond)

	if svc.IsRunning(start.ProcessID) {
		t.Fatal("expected process to not be running after stop")
	}
}

func TestBulkStatus(t *testing.T) {
	t.Parallel()
	svc, _ := newTestProcessService()
	t.Cleanup(svc.StopAll)

	dir := t.TempDir()
	start1 := svc.Start(dir, "sleep 30", nil, nil)
	start2 := svc.Start(dir, "sleep 30", nil, nil)
	if !start1.Success || !start2.Success {
		t.Fatal("start failed")
	}

	status := svc.BulkStatus([]string{start1.ProcessID, start2.ProcessID, "fake-id"})

	if !status[start1.ProcessID] {
		t.Error("expected process 1 to be running")
	}
	if !status[start2.ProcessID] {
		t.Error("expected process 2 to be running")
	}
	if status["fake-id"] {
		t.Error("expected fake-id to not be running")
	}
}

func TestGetRunningProcessPids(t *testing.T) {
	t.Parallel()
	svc, _ := newTestProcessService()
	t.Cleanup(svc.StopAll)

	start := svc.Start(t.TempDir(), "sleep 30", nil, nil)
	if !start.Success {
		t.Fatalf("start failed: %s", start.Error)
	}

	pids := svc.GetRunningProcessPids([]string{start.ProcessID, "fake-id"})

	if pid, ok := pids[start.ProcessID]; !ok || pid <= 0 {
		t.Fatalf("expected positive PID for running process, got: %d", pid)
	}
	if _, ok := pids["fake-id"]; ok {
		t.Fatal("expected no PID for fake-id")
	}
}

func TestStopAll_NoPanic(t *testing.T) {
	t.Parallel()
	svc, _ := newTestProcessService()

	// Should not panic on empty service
	svc.StopAll()
}

func TestStopAll_StopsProcesses(t *testing.T) {
	t.Parallel()
	svc, _ := newTestProcessService()

	dir := t.TempDir()
	start1 := svc.Start(dir, "sleep 30", nil, nil)
	start2 := svc.Start(dir, "sleep 30", nil, nil)
	if !start1.Success || !start2.Success {
		t.Fatal("start failed")
	}

	svc.StopAll()
	time.Sleep(200 * time.Millisecond)

	if svc.IsRunning(start1.ProcessID) {
		t.Error("expected process 1 to be stopped")
	}
	if svc.IsRunning(start2.ProcessID) {
		t.Error("expected process 2 to be stopped")
	}
}

func TestLogBatching_EmitsEvents(t *testing.T) {
	t.Parallel()
	svc, emitter := newTestProcessService()
	t.Cleanup(svc.StopAll)

	svc.Start(t.TempDir(), "echo hello", nil, nil)

	if !emitter.waitForEvent(eventProcessLogBatch) {
		t.Fatal("expected process-log:batch event to be emitted")
	}
}

func TestExitLog_EmittedOnExit(t *testing.T) {
	t.Parallel()
	svc, emitter := newTestProcessService()
	t.Cleanup(svc.StopAll)

	svc.Start(t.TempDir(), "echo hello", nil, nil)

	// Wait for process to exit and logs to flush
	time.Sleep(500 * time.Millisecond)

	events := emitter.getEvents()
	foundExitLog := false
	for _, e := range events {
		if e.name != eventProcessLogBatch {
			continue
		}
		if len(e.data) == 0 {
			continue
		}
		batch, ok := e.data[0].([]ProcessLogData)
		if !ok {
			continue
		}
		for _, log := range batch {
			if log.Type == "exit" && log.Code != nil && *log.Code == 0 {
				foundExitLog = true
			}
		}
	}
	if !foundExitLog {
		t.Fatal("expected exit log with code 0")
	}

	// Clean exit should NOT emit a crash event
	if crashCount := emitter.countEvents(eventProcessCrash); crashCount > 0 {
		t.Fatalf("expected no crash events for clean exit, got %d", crashCount)
	}
}

func TestCrashEvent_NonZeroExit(t *testing.T) {
	t.Parallel()
	svc, emitter := newTestProcessService()
	t.Cleanup(svc.StopAll)

	svc.Start(t.TempDir(), "sh -c 'exit 1'", nil, nil)

	if !emitter.waitForEvent(eventProcessCrash) {
		t.Fatal("expected process-crash event")
	}

	events := emitter.getEvents()
	for _, e := range events {
		if e.name != eventProcessCrash {
			continue
		}
		if len(e.data) == 0 {
			continue
		}
		crash, ok := e.data[0].(ProcessCrashData)
		if !ok {
			continue
		}
		if crash.WillRestart {
			t.Error("expected willRestart=false without restart config")
		}
		return
	}
	t.Fatal("process-crash event data not found")
}

func TestRestart_TriggeredOnCrash(t *testing.T) {
	t.Parallel()
	svc, emitter := newTestProcessService()
	t.Cleanup(svc.StopAll)

	restartCfg := &RestartConfig{
		Enabled:    true,
		MaxRetries: intPtr(3),
		DelayMs:    intPtr(100),
	}

	svc.Start(t.TempDir(), "sh -c 'exit 1'", restartCfg, nil)

	// Wait for crash + restart cycle
	if !emitter.waitForEvent(eventProcessCrash) {
		t.Fatal("expected process-crash event")
	}
	if !emitter.waitForEvent("process-restart") {
		t.Fatal("expected process-restart event")
	}

	// Verify crash had willRestart=true
	events := emitter.getEvents()
	for _, e := range events {
		if e.name != eventProcessCrash {
			continue
		}
		if len(e.data) == 0 {
			continue
		}
		crash, ok := e.data[0].(ProcessCrashData)
		if !ok {
			continue
		}
		if crash.WillRestart {
			return // Found the expected event
		}
	}
	t.Fatal("expected process-crash with willRestart=true")
}

func TestRestart_MaxRetriesExceeded(t *testing.T) {
	t.Parallel()
	svc, emitter := newTestProcessService()
	t.Cleanup(svc.StopAll)

	restartCfg := &RestartConfig{
		Enabled:    true,
		MaxRetries: intPtr(1),
		DelayMs:    intPtr(10),
	}

	svc.Start(t.TempDir(), "sh -c 'exit 1'", restartCfg, nil)

	// Wait for all retries to exhaust (initial crash + 1 retry + final crash)
	time.Sleep(1 * time.Second)

	events := emitter.getEvents()
	crashEvents := []ProcessCrashData{}
	for _, e := range events {
		if e.name != eventProcessCrash || len(e.data) == 0 {
			continue
		}
		if crash, ok := e.data[0].(ProcessCrashData); ok {
			crashEvents = append(crashEvents, crash)
		}
	}

	if len(crashEvents) < 2 {
		t.Fatalf("expected at least 2 crash events, got %d", len(crashEvents))
	}

	// The last crash should have willRestart=false
	lastCrash := crashEvents[len(crashEvents)-1]
	if lastCrash.WillRestart {
		t.Error("expected last crash to have willRestart=false")
	}
}

func TestStart_CustomEnvPassedToProcess(t *testing.T) {
	t.Parallel()
	svc, emitter := newTestProcessService()
	t.Cleanup(svc.StopAll)

	env := map[string]string{"CLICK_LAUNCH_TEST_VAR": "hello_from_test"}
	svc.Start(t.TempDir(), "echo $CLICK_LAUNCH_TEST_VAR", nil, env)

	// Wait for process to fully exit (ensures all logs are flushed)
	if !emitter.waitForLogContaining("exit") {
		t.Fatal("timed out waiting for exit log")
	}

	found := false
	events := emitter.getEvents()
	for _, e := range events {
		if e.name != eventProcessLogBatch || len(e.data) == 0 {
			continue
		}
		batch, ok := e.data[0].([]ProcessLogData)
		if !ok {
			continue
		}
		for _, log := range batch {
			if log.Type == "stdout" && strings.Contains(log.Output, "hello_from_test") {
				found = true
			}
		}
	}
	if !found {
		t.Fatal("expected custom env var to appear in process stdout")
	}
}

func TestStop_CancelsPendingRestart(t *testing.T) {
	t.Parallel()
	svc, emitter := newTestProcessService()
	t.Cleanup(svc.StopAll)

	restartCfg := &RestartConfig{
		Enabled:    true,
		MaxRetries: intPtr(3),
		DelayMs:    intPtr(5000), // Long delay so we can cancel
	}

	start := svc.Start(t.TempDir(), "sh -c 'exit 1'", restartCfg, nil)
	if !start.Success {
		t.Fatalf("start failed: %s", start.Error)
	}

	// Wait for crash event (process exits quickly)
	if !emitter.waitForEvent(eventProcessCrash) {
		t.Fatal("expected process-crash event")
	}

	// Stop during the restart delay
	svc.Stop(start.ProcessID)

	// Wait to verify no restart happens
	time.Sleep(500 * time.Millisecond)

	restartCount := emitter.countEvents("process-restart")
	if restartCount > 0 {
		t.Fatalf("expected no restart events after stop, got %d", restartCount)
	}
}
