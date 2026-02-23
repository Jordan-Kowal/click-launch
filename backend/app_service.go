package backend

import (
	"fmt"
	"os/exec"

	"github.com/wailsapp/wails/v3/pkg/application"
)

// AppService provides app-level operations: version info, resource paths, and updates.
type AppService struct {
	version string
}

// NewAppService creates an AppService with the given version string.
func NewAppService(version string) *AppService {
	return &AppService{version: version}
}

// GetVersion returns the application version string.
func (s *AppService) GetVersion() string {
	return s.version
}

// GetResourcePath returns the URL path for a static asset served by the Wails asset handler.
// Both dev and prod serve from the embedded dist/ FS, so all assets are at "/<filename>".
func (s *AppService) GetResourcePath(filename string) string {
	return "/" + filename
}

// InstallUpdate shows a native confirmation dialog and, if confirmed, spawns a background shell
// that downloads and runs the pinned update installer, then quits the app.
func (s *AppService) InstallUpdate(version string) {
	app := application.Get()
	dialog := app.Dialog.Question().
		SetTitle("Update Available").
		SetMessage(fmt.Sprintf(
			"A new version (%s) is available.\n\nThe app will close, update, and reopen automatically.\n\nDo you want to proceed?",
			version,
		))

	confirm := dialog.AddButton("Update")
	confirm.OnClick(func() {
		url := fmt.Sprintf("https://raw.githubusercontent.com/Jordan-Kowal/click-launch/%s/setup.sh", version)
		script := fmt.Sprintf(`(
			sleep 2
			curl -fsSL %s | bash >> /dev/null 2>&1
			open /Applications/ClickLaunch.app
		) &`, url)
		cmd := exec.Command("sh", "-c", script) //nolint:gosec // version comes from GitHub API, not user input
		if err := cmd.Start(); err != nil {
			return
		}
		app.Quit()
	})

	cancel := dialog.AddButton("Cancel")
	dialog.SetDefaultButton(confirm)
	dialog.SetCancelButton(cancel)
	dialog.Show()
}
