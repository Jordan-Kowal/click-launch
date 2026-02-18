# Changelog

## Legend

- 🚀 Features
- ✨ Improvements
- 🐞 Bugfixes
- 🔧 Others
- 💥 Breaking

## TBD

- 🔧 **Migrated from Electron to Wails v3 (Go)**: drastically reduced bundle size, lower memory usage, and faster startup.
- 🔧 **Consolidated developer commands under Taskfile**: single entry point via `task` for dev, build, lint, test, and check.
- 🚀 Added **restart button** for running processes: quickly restart a process without manually stopping and starting it.
- 🚀 Added **resource history**: per-process CPU/memory charts with peak indicators with 15-minute retention (customizable in the settings panel)

## 2.0.0 - 2026-02-14

### 🚀 Features

- Added new **configuration options** per process:
  - `env`: custom environment variables, visible and editable in the UI before launch.
  - `restart`: auto-restart with configurable retries, delay, and visual status indicators.
  - `cwd`: working directory override (relative to config file or absolute).
  - `group`: organize processes into collapsible groups with per-group start/stop.
- Added **resource monitoring**: real-time CPU and memory usage displayed per process in the dashboard.
- Added **log export**: export process logs as text files to `logs/click-launch/` in the project root directory.
- Added **copy log line** button, visible on hover.
- Added **settings panel**: global application settings accessible via the cog icon in the navigation bar.
  - **Theme switching** between Nord (light) and Forest (dark) themes.
  - **Log buffer size** control (100-50,000 lines per process).
  - **Toggle notifications** to suppress or enable toast messages.
  - **Toggle grouping** to show a flat process list or grouped view.
  - **Toggle resource monitor** to show or hide CPU/memory columns.

### ✨ Improvements

- Added toast notifications when a process crashes.
- Added **crashed status** to distinguish between manually stopped and crashed processes.
- Added **keyboard shortcuts reference** in the log drawer. Press `⌘ + /` to view them.
- Improved performances on logs with **log virtualization** and other optimizations.
- Increased **default log buffer size** from 1,500 to 10,000 lines per process (thanks to virtualization).

### 🔧 Others

- Refactored main components for better readability and maintainability.
- Added top-level **ErrorBoundary** to catch uncaught rendering errors with a fallback UI.
- Updated GitHub Actions to actions/cache@v4.
- Added `pnpm version:bump` script to automate version bumping.

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
