package backend

import (
	"os"
	"path/filepath"
	"testing"
)

func TestValidatePaths(t *testing.T) {
	t.Parallel()

	svc := NewFileService()
	dir := t.TempDir()

	// Create some real files
	existingFile := filepath.Join(dir, "exists.yml")
	if err := os.WriteFile(existingFile, []byte("test"), 0o644); err != nil { //nolint:gosec // test fixture
		t.Fatal(err)
	}

	paths := []string{
		existingFile,
		filepath.Join(dir, "does-not-exist.yml"),
		filepath.Join(dir, "also-missing.yml"),
	}

	valid, invalid := svc.ValidatePaths(paths)

	if len(valid) != 1 || valid[0] != existingFile {
		t.Errorf("valid = %v, want [%s]", valid, existingFile)
	}
	if len(invalid) != 2 {
		t.Errorf("invalid has %d items, want 2", len(invalid))
	}
}

func TestValidatePaths_Empty(t *testing.T) {
	t.Parallel()

	svc := NewFileService()
	valid, invalid := svc.ValidatePaths([]string{})

	if len(valid) != 0 {
		t.Errorf("valid = %v, want empty", valid)
	}
	if len(invalid) != 0 {
		t.Errorf("invalid = %v, want empty", invalid)
	}
}

func TestWriteFile(t *testing.T) {
	t.Parallel()

	svc := NewFileService()
	dir := t.TempDir()
	subDir := filepath.Join(dir, "nested", "dir")

	path, err := svc.WriteFile(subDir, "test.txt", "hello world")
	if err != nil {
		t.Fatalf("WriteFile error: %v", err)
	}

	expected := filepath.Join(subDir, "test.txt")
	if path != expected {
		t.Errorf("path = %q, want %q", path, expected)
	}

	content, err := os.ReadFile(path) //nolint:gosec // reading back test output
	if err != nil {
		t.Fatalf("ReadFile error: %v", err)
	}
	if string(content) != "hello world" {
		t.Errorf("content = %q, want %q", string(content), "hello world")
	}
}
