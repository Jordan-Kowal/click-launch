package backend

import (
	"fmt"
	"os/exec"
	"regexp"

	"github.com/wailsapp/wails/v3/pkg/application"
)

var validVersionPattern = regexp.MustCompile(`^\d+\.\d+\.\d+$`)

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
	if !validVersionPattern.MatchString(version) {
		return
	}
	app := application.Get()
	dialog := app.Dialog.Question().
		SetTitle("Update Available").
		SetMessage(fmt.Sprintf(
			"A new version (%s) is available.\n\nThe app will close, update, and reopen automatically.\n\nDo you want to proceed?",
			version,
		))

	confirm := dialog.AddButton("Update")
	confirm.OnClick(func() {
		// Fetch the update.sh pinned to the target version, then invoke it
		// with the version as an argument so it fetches the matching DMG
		// (not releases/latest). stderr+stdout land in ~/.click-launch/update.log
		// via the tee exec inside the script itself — do NOT redirect here
		// or the in-script tee becomes a no-op.
		url := fmt.Sprintf("https://raw.githubusercontent.com/Jordan-Kowal/click-launch/%s/scripts/update.sh", version)
		script := fmt.Sprintf(`(
			sleep 2
			curl -fsSL %q | bash -s -- %q
			open /Applications/ClickLaunch.app
		) &`, url, version)
		cmd := exec.Command("sh", "-c", script) //nolint:gosec // version validated against semver pattern
		if err := cmd.Start(); err != nil {
			app.Dialog.Error().
				SetTitle("Update Failed").
				SetMessage(fmt.Sprintf("Could not start the update process: %v\n\nPlease try updating manually.", err)).
				Show()
			return
		}
		app.Quit()
	})

	cancel := dialog.AddButton("Cancel")
	dialog.SetDefaultButton(confirm)
	dialog.SetCancelButton(cancel)
	dialog.Show()
}
