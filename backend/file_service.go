package backend

import (
	"os"
	"path/filepath"

	"github.com/wailsapp/wails/v3/pkg/application"
)

// FileService handles file dialogs, path validation, and file writing.
type FileService struct{}

// NewFileService creates a new FileService.
func NewFileService() *FileService {
	return &FileService{}
}

// OpenFileDialog opens a file picker filtered to YAML files.
// Returns the selected file path or empty string if cancelled.
func (s *FileService) OpenFileDialog() (string, error) {
	return application.Get().Dialog.OpenFile().
		AddFilter("YAML files", "*.yml;*.yaml").
		AddFilter("All files", "*.*").
		PromptForSingleSelection()
}

// OpenFolderDialog opens a folder picker.
// Returns the selected directory path or empty string if cancelled.
func (s *FileService) OpenFolderDialog() (string, error) {
	return application.Get().Dialog.OpenFile().
		CanChooseFiles(false).
		CanChooseDirectories(true).
		SetTitle("Select log export directory").
		PromptForSingleSelection()
}

// ValidatePaths splits file paths into valid (existing) and invalid (non-existing) lists.
func (s *FileService) ValidatePaths(filePaths []string) ([]string, []string) {
	var valid, invalid []string
	for _, path := range filePaths {
		if _, err := os.Stat(path); err == nil {
			valid = append(valid, path)
		} else {
			invalid = append(invalid, path)
		}
	}
	return valid, invalid
}

// WriteFile creates the directory if needed and writes content to a file.
// Returns the full path of the written file.
func (s *FileService) WriteFile(dirPath string, fileName string, content string) (string, error) {
	if err := os.MkdirAll(dirPath, 0o755); err != nil { //nolint:gosec // user-selected export directory
		return "", err
	}
	fullPath := filepath.Join(dirPath, fileName)
	if err := os.WriteFile(fullPath, []byte(content), 0o644); err != nil { //nolint:gosec // log export file
		return "", err
	}
	return fullPath, nil
}
