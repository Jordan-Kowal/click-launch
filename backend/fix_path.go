package backend

import (
	"os"
	"os/exec"
	"strings"
)

// FixPath resolves the user's full shell PATH and sets it on the current process.
// macOS GUI apps launched from Finder inherit a minimal PATH (/usr/bin:/bin:/usr/sbin:/sbin),
// missing Homebrew and other tools. This mirrors the "fix-path" npm package used in Electron.
func FixPath() {
	// Use /bin/sh (not $SHELL) because fish outputs PATH as space-separated,
	// which would corrupt the colon-separated format the OS expects.
	// A login sh sources /etc/profile → runs path_helper → picks up Homebrew etc.
	out, err := exec.Command("/bin/sh", "-lc", "echo $PATH").Output()
	if err != nil {
		return
	}

	resolvedPath := strings.TrimSpace(string(out))
	if resolvedPath != "" {
		_ = os.Setenv("PATH", resolvedPath)
	}
}
