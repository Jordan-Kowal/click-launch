package backend

import (
	"path/filepath"

	"github.com/joho/godotenv"
)

// resolveEnvFilePath resolves an env file path relative to the process cwd.
func resolveEnvFilePath(envFile string, cwd string) string {
	if filepath.IsAbs(envFile) {
		return envFile
	}
	return filepath.Join(cwd, envFile)
}

// parseEnvFile reads a .env file and returns key-value pairs.
func parseEnvFile(path string) (map[string]string, error) {
	return godotenv.Read(path)
}
