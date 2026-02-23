package backend

import (
	"os"
	"strings"
	"testing"
)

func TestFixPath_RestoresFullPath(t *testing.T) {
	origPath := os.Getenv("PATH")
	defer func() { _ = os.Setenv("PATH", origPath) }()

	// Simulate a minimal macOS GUI app PATH
	_ = os.Setenv("PATH", "/usr/bin:/bin")

	FixPath()

	newPath := os.Getenv("PATH")
	if newPath == "/usr/bin:/bin" {
		t.Error("PATH was not updated — FixPath had no effect")
	}
	if newPath == "" {
		t.Error("PATH was set to empty string")
	}
	if strings.Contains(newPath, " ") {
		t.Error("PATH contains spaces — likely fish-style output instead of colon-separated")
	}
}
