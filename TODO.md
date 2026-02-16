# TODO - Future Improvements

This document outlines planned improvements for Click-Launch, ordered by impact/effort ratio (best bang for buck first).

---

## Features

Feature ideas worth implementing:

1. Allow filtering logs by level (info/warn/error)
2. Add a search to the main dashboard to filter processes by name: A simply search bar that will filter (show/hide) based on the process display name. Use /frontend-design skill to make sure it's well implemented. It should only impact the display in the UI, processes should still be running.
3. Allow displaying multiple logs simultaneously
4. Migrate from Electron to Wails (Go): Replace Electron with Wails v3 to drastically reduce bundle size (~8 MB vs ~104 MB), lower memory usage, and improve startup time. The SolidJS frontend stays as-is (Vite + Tailwind + DaisyUI). The backend (electron/ directory) gets rewritten in Go: YAML config parsing, process spawning/killing via os/exec, stdout/stderr streaming, resource monitoring (CPU/memory), file dialogs, and IPC. This is the big migration — do it before any tooling changes.
5. Migrate from pnpm to Bun: After the Wails migration is stable, swap pnpm for Bun as the package manager. Delete node_modules and pnpm-lock.yaml, run bun install, replace pnpm with bun in scripts. Vite stays as the bundler (Bun's bundler doesn't support SolidJS JSX transform). This is a small, isolated change.

---

## Post-Implementation Checklist

After completing an item from this list, you **must** update the following files:

1. **This TODO.md file**
   - Remove the completed section entirely
   - Renumber remaining sections if necessary

2. **README.md** (Documentation)
   - Document the new feature in the appropriate section
   - Add configuration examples if the feature affects it

3. **CHANGELOG.md**
   - Add an entry under the appropriate version section
   - Follow the existing format
