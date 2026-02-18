package backend

import (
	"fmt"
	"math"
	"runtime"
	"sync/atomic"
	"testing"
)

// --- Test helpers ---

type mockResult struct {
	stdout string
	err    error
}

type mockRunner struct {
	results map[int]mockResult
	calls   atomic.Int32
}

func (m *mockRunner) Run(pid int) (string, error) {
	m.calls.Add(1)
	r, ok := m.results[pid]
	if !ok {
		return "", fmt.Errorf("no mock for pid %d", pid)
	}
	return r.stdout, r.err
}

func newTestResourceService(results map[int]mockResult) (*ResourceService, *mockRunner) {
	runner := &mockRunner{results: results}
	svc := &ResourceService{runner: runner}
	return svc, runner
}

// normalizedCPU mirrors the normalization in getProcessStats.
func normalizedCPU(raw float64) float64 {
	return math.Round(raw/float64(runtime.NumCPU())*10) / 10
}

// --- Tests ---

func TestGet_AggregatesMultipleRows(t *testing.T) {
	t.Parallel()
	svc, _ := newTestResourceService(map[int]mockResult{
		100: {stdout: "  5.2  65536\n  2.1  32768\n"},
	})

	result := svc.Get(map[string]int{"proc-1": 100})

	data, ok := result["proc-1"]
	if !ok {
		t.Fatal("expected proc-1 in result")
	}
	expectedCPU := normalizedCPU(5.2 + 2.1)
	if data.CPU != expectedCPU {
		t.Errorf("expected CPU %f, got %f", expectedCPU, data.CPU)
	}
	expectedMemory := int64((65536 + 32768) * 1024)
	if data.MemoryBytes != expectedMemory {
		t.Errorf("expected MemoryBytes %d, got %d", expectedMemory, data.MemoryBytes)
	}
}

func TestGet_ErrorReturnsZeros(t *testing.T) {
	t.Parallel()
	svc, _ := newTestResourceService(map[int]mockResult{
		100: {stdout: "", err: fmt.Errorf("no such process")},
	})

	result := svc.Get(map[string]int{"proc-1": 100})

	data := result["proc-1"]
	if data.CPU != 0 {
		t.Errorf("expected CPU 0, got %f", data.CPU)
	}
	if data.MemoryBytes != 0 {
		t.Errorf("expected MemoryBytes 0, got %d", data.MemoryBytes)
	}
}

func TestGet_EmptyOutputReturnsZeros(t *testing.T) {
	t.Parallel()
	svc, _ := newTestResourceService(map[int]mockResult{
		100: {stdout: ""},
	})

	result := svc.Get(map[string]int{"proc-1": 100})

	data := result["proc-1"]
	if data.CPU != 0 {
		t.Errorf("expected CPU 0, got %f", data.CPU)
	}
	if data.MemoryBytes != 0 {
		t.Errorf("expected MemoryBytes 0, got %d", data.MemoryBytes)
	}
}

func TestGet_MultipleProcessesParallel(t *testing.T) {
	t.Parallel()
	svc, runner := newTestResourceService(map[int]mockResult{
		100: {stdout: "  10.0  102400\n"},
		200: {stdout: "  3.5  51200\n"},
	})

	result := svc.Get(map[string]int{"proc-1": 100, "proc-2": 200})

	data1, ok := result["proc-1"]
	if !ok {
		t.Fatal("expected proc-1 in result")
	}
	expectedCPU1 := normalizedCPU(10.0)
	if data1.CPU != expectedCPU1 || data1.MemoryBytes != 102400*1024 {
		t.Errorf("proc-1: expected CPU=%f mem=%d, got CPU=%f mem=%d", expectedCPU1, 102400*1024, data1.CPU, data1.MemoryBytes)
	}
	data2, ok := result["proc-2"]
	if !ok {
		t.Fatal("expected proc-2 in result")
	}
	expectedCPU2 := normalizedCPU(3.5)
	if data2.CPU != expectedCPU2 || data2.MemoryBytes != 51200*1024 {
		t.Errorf("proc-2: expected CPU=%f mem=%d, got CPU=%f mem=%d", expectedCPU2, 51200*1024, data2.CPU, data2.MemoryBytes)
	}
	if int(runner.calls.Load()) != 2 {
		t.Errorf("expected 2 runner calls, got %d", int(runner.calls.Load()))
	}
}

func TestGet_EmptyPidMap(t *testing.T) {
	t.Parallel()
	svc, runner := newTestResourceService(nil)

	result := svc.Get(map[string]int{})

	if len(result) != 0 {
		t.Errorf("expected empty result, got %d entries", len(result))
	}
	if int(runner.calls.Load()) != 0 {
		t.Errorf("expected 0 runner calls, got %d", int(runner.calls.Load()))
	}
}
