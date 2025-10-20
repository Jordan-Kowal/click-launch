# Changelog

## Legend

- 🚀 Features
- ✨ Improvements
- 🐞 Bugfixes
- 🔧 Others
- 💥 Breaking

## TBD

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
