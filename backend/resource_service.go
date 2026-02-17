package backend

import (
	"math"
	"os/exec"
	"regexp"
	"strconv"
	"strings"
	"sync"
)

// commandRunner abstracts exec.Command for testing.
type commandRunner interface {
	Run(pid int) (string, error)
}

// psRunner is the production commandRunner using ps.
type psRunner struct{}

func (p *psRunner) Run(pid int) (string, error) {
	// ps -g selects by process group ID. This works because ProcessService spawns
	// commands with Setpgid: true, making the shell PID equal to its PGID.
	// This captures the shell and all its child processes (e.g. node, docker).
	out, err := exec.Command("ps", "-g", strconv.Itoa(pid), "-o", "%cpu=,rss=").Output() //nolint:gosec // pid is an integer, not user-controlled string
	return string(out), err
}

// ResourceService monitors CPU and memory usage for spawned processes.
type ResourceService struct {
	runner commandRunner
}

// NewResourceService creates a ResourceService with production defaults.
func NewResourceService() *ResourceService {
	return &ResourceService{runner: &psRunner{}}
}

var whitespaceRe = regexp.MustCompile(`\s+`)

// getProcessStats collects CPU and memory data for a single process group.
func (s *ResourceService) getProcessStats(pid int) ProcessResourceData {
	stdout, err := s.runner.Run(pid)
	if err != nil || strings.TrimSpace(stdout) == "" {
		return ProcessResourceData{}
	}

	var totalCPU float64
	var totalRSSKb int64

	lines := strings.Split(strings.TrimSpace(stdout), "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		parts := whitespaceRe.Split(line, -1)
		if len(parts) < 2 {
			continue
		}
		cpu, err := strconv.ParseFloat(parts[0], 64)
		if err == nil {
			totalCPU += cpu
		}
		rss, err := strconv.ParseInt(parts[1], 10, 64)
		if err == nil {
			totalRSSKb += rss
		}
	}

	return ProcessResourceData{
		CPU:         math.Round(totalCPU*10) / 10,
		MemoryBytes: totalRSSKb * 1024,
	}
}

// Get returns CPU and memory data for each process in the pid map.
func (s *ResourceService) Get(pidMap map[string]int) map[string]ProcessResourceData {
	if len(pidMap) == 0 {
		return map[string]ProcessResourceData{}
	}

	var mu sync.Mutex
	var wg sync.WaitGroup
	result := make(map[string]ProcessResourceData, len(pidMap))

	for id, pid := range pidMap {
		wg.Add(1)
		go func() {
			defer wg.Done()
			data := s.getProcessStats(pid)
			mu.Lock()
			result[id] = data
			mu.Unlock()
		}()
	}

	wg.Wait()
	return result
}
