package backend

import (
	"path/filepath"
	"testing"
)

func TestParseEnvFile(t *testing.T) {
	t.Parallel()

	t.Run("parses valid env file", func(t *testing.T) {
		t.Parallel()
		envMap, err := parseEnvFile(filepath.Join("testdata", "sample.env"))
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		expected := map[string]string{
			"DB_HOST":      "localhost",
			"DB_PORT":      "5432",
			"APP_ENV":      "development",
			"EMPTY_VALUE":  "",
			"QUOTED_VALUE": "hello world",
			"EXPORTED_VAR": "exported_value",
		}
		if len(envMap) != len(expected) {
			t.Fatalf("got %d entries, want %d\ngot: %v", len(envMap), len(expected), envMap)
		}
		for k, want := range expected {
			got, ok := envMap[k]
			if !ok {
				t.Errorf("missing key %q", k)
			} else if got != want {
				t.Errorf("key %q = %q, want %q", k, got, want)
			}
		}
	})

	t.Run("returns error for non-existent file", func(t *testing.T) {
		t.Parallel()
		_, err := parseEnvFile("/non/existent/.env")
		if err == nil {
			t.Error("expected error for non-existent file, got nil")
		}
	})
}

func TestResolveEnvFilePath(t *testing.T) {
	t.Parallel()

	t.Run("absolute path returned as-is", func(t *testing.T) {
		t.Parallel()
		got := resolveEnvFilePath("/absolute/.env", "/some/cwd")
		if got != "/absolute/.env" {
			t.Errorf("got %q, want %q", got, "/absolute/.env")
		}
	})

	t.Run("relative path joined with cwd", func(t *testing.T) {
		t.Parallel()
		got := resolveEnvFilePath(".env", "/project/dir")
		if got != "/project/dir/.env" {
			t.Errorf("got %q, want %q", got, "/project/dir/.env")
		}
	})

	t.Run("dot-slash relative path joined with cwd", func(t *testing.T) {
		t.Parallel()
		got := resolveEnvFilePath("./config/.env", "/project/dir")
		if got != "/project/dir/config/.env" {
			t.Errorf("got %q, want %q", got, "/project/dir/config/.env")
		}
	})
}
