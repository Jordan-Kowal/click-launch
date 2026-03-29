# Changelog

## Legend

- 🚀 Features
- ✨ Improvements
- 🐞 Bugfixes
- 🔧 Others
- 💥 Breaking

## TBD

- ✨ Add a "Hide idle" toggle on the dashboard to filter out stopped processes.
- ✨ Add a "Go back" button on the dashboard to return to project selection.
- ✨ Skip the warning modal when navigating home with no running processes.
- 🐞 Hide the homepage button on the welcome page where it serves no purpose.
- 🐞 Keep search input value when clearing process logs.
- 🔧 Refactored DashboardProvider: replaced mutable ref callback with a reactive `createEffect` in `useResources`, making inter-hook communication fully reactive.
- 🔧 Upgraded all JS and Go dependencies to latest versions.

## 2.0.2 - 2026-02-23

- 🐞 Fixed bug where you could not upgrade to the latest version.
- 🐞 Fixed processes failing to start in production builds due to missing PATH.
- 🔧 Fixed CI Go version mismatch (1.24 → 1.25) to match `go.mod`.
- 🔧 Added `push` trigger to code-quality CI workflow for quality insurance and to seed Go cache for PR branches.
- 🔧 Switched all CI jobs to `macos-latest` to match the target platform.
- 🔧 Upgraded all GitHub Actions to latest major versions.

## 2.0.1 - 2026-02-21

- ✨ Fixed number settings (log buffer size, resource history duration) applying on every keystroke, causing data loss. Values now commit on blur or Enter.
- ✨ Hardened auto-update to fetch the install script from the specific release tag instead of the main branch.
- 🔧 Fixed non-source files triggering Vite hot-reload during development.

## 2.0.0 - 2026-02-20

On top on new major features, we also migrated the app:

- from `Electron` to `Wails v3`.
- from `node` and `pnpm` to `bun`

This led to a massive bundle size reduction (-97%, from 270mo to 9mo), lower memory usage, and faster startup.

### 🚀 Features

- Added new **configuration options** per process:
  - `env`: custom environment variables, visible and editable in the UI before launch.
  - `restart`: auto-restart with configurable retries, delay, and visual status indicators.
  - `cwd`: working directory override (relative to config file or absolute).
  - `group`: organize processes into collapsible groups with per-group start/stop.
- Added **resource monitoring**: real-time CPU and memory usage displayed per process in the dashboard, with live charts.
- Added **restart button** for running processes: quickly restart a process without manually stopping and starting it.
- Added **log export**: export process logs as text files to `logs/click-launch/` in the project root directory.
- Added **copy log line** button, visible on hover.
- Added **settings panel**: global application settings accessible via the cog icon in the navigation bar.
  - **Theme switching** between Nord (light) and Forest (dark) themes.
  - **Toggle notifications** to suppress or enable toast messages.
  - **Toggle grouping** to show a flat process list or grouped view.
  - **Toggle resource monitor** to show or hide CPU/memory columns.
  - **Resource history retention** which determines how long resource usage data is kept.
  - **Log buffer size** control (100-50,000 lines per process).
  - **Toggle timestamps** to show or hide the timestamp prefix on log lines.

### ✨ Improvements

- Added toast notifications when a process crashes.
- Added **crashed status** to distinguish between manually stopped and crashed processes.
- Added **keyboard shortcuts reference** in the log drawer. Press `⌘ + /` to view them.
- Improved performances on logs with **log virtualization** and other optimizations.
- Increased **default log buffer size** from 1,500 to 10,000 lines per process (thanks to virtualization).

### 🔧 Others

- Migrated from `Electron` to `Wails v3`.
- Migrated from `node` and `pnpm` to `bun`
- Centralized all dev commands under `go` tasks.
- Refactored main components for better readability and maintainability.
- Added top-level **ErrorBoundary** to catch uncaught rendering errors with a fallback UI.
- Added `bump-version.sh` script to automate version bumping.
- Added `claude-postwrite.sh` hook to help Claude automatically format/lint code after a change.

## 1.5.0 - 2026-01-24

- 🚀 Added **filter mode** to the search bar, to only display rows that match your search.
- 🚀 Added **regex mode** to the search bar, to search for logs using a regular expression.
- ✨ Processes can now be started/stopped from the log drawer header.
- 🔧 Added setup for ClaudeCode.
- 🔧 Minor performance improvements for the development server.
- 🔧 Upgraded dependencies.
- 🔧 Upgraded node version to 24.

## 1.4.2 - 2026-01-06

- 🔧 Upgraded dependencies.

## 1.4.1 - 2025-11-05

- 🐞 Fixed extra spaces in command output when an argument is empty.
- 🔧 Upgraded dependencies.

## 1.4.0 - 2025-11-04

- ✨ Added a "Scroll to bottom" button in the log drawer.
- ✨ Pressing `CMD+F` will now focus the search input in the log drawer.
- ✨ Pressing `Escape` will now close the log drawer.
- 🐞 Fixed log search position being reset when receiving new logs.

## 1.3.0 - 2025-10-26

- 🚀 New button to stop all processes at once in the dashboard.
- ✨ Show process status in the log drawer title.
- ✨ Improved the MacOS help menu with links to the documentation and changelog.
- 🐞 Correctly handle "live update" log instructions.
- 🐞 Correctly shutdown all processes when reloading the dashboard page manually.
- 🔧 Added screenshots to README.
- 🔧 Provided a richer `example.yml` file.
- 🔧 Upgraded dependencies.

## 1.2.1 - 2025-10-20

- 🚀 You can now upgrade the app in one-click from the home screen.
- 🐞 When upgrading the app, added a rollback mechanism to revert to the previous version if the installation fails.
- 🐞 Fixed animation when opening log drawer.

## 1.2.0 - 2025-10-19

- ✨ Reduced header size for better UX.
- ✨ Logs are now displayed in a drawer component instead of a modal.
- ✨ Added debounce to log search (when typing) to improve user experience.
- 🔧 Use a single drawer component for all logs (instead of one per process).
- 🔧 Removed `Zed` editor configuration.
- 🔧 Upgraded dependencies.

## 1.1.0 - 2025-09-30

- ✨ Changed theme to `Nord`
- ✨ Added a warning when reloading the app with ongoing processes.
- ✨ Logs: Improved log performances (batching, rolling buffer, improved search) and design.
- 🐞 Fixed white screen on manual reload.
- 🔧 Migrated from `React` to `SolidJS` to improve performance.
- 🔧 Changed from `yarn` to `pnpm` as the package manager.

## 1.0.1 - 2025-09-23

- 🐞 Fixed "Recent projects" not updating correctly when removing projects.

## 1.0.0 - 2025-09-22

Official release for the application. See the [README](README.md) for more information.
