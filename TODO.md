# TODO

## Technical spec

- Understand how electron works

## Feature: Find a .yml file in a folder to load project

- Split screen: Show "New project" or "Open previous projects"
- On start, remove invalid previous projects/paths
  - Show toaster
- New:
  - File manager to find a .yml file
  - On select, save it in previous projects locally
  - Then redirect to homepage
- Open:
  - On select, redirect to homepage
- On homepage:
  - Ensure yaml is valid otherwise show error screen

## Feature: SHow available processes

- Handle row to display process
- Handle options:
  - Boolean
  - Text
  - Radio
  - Select
  - Free input
- Show final output based on selected options
- Make them readonly when running

## Feature: Handle actions

- Handle actions:
  - Start
  - Stop
  - Restart
  - View logs
- Handle status:
  - Running
  - Stopped
  - Crashed
- Handle logs:
  - Show logs
  - Search logs
- Ensure process is stopped when closing app

## Feature: Settings

- Settings (theme)

## Doc

- Change name
- Provide logo
- Changelog
- Readme
- Contributing

## CI/CD

- Quality + tests + release build

## Build

- For mac only
- Build icons

## Later

- Auto update?
- How to report a bug
- i18n
- Sidebar with 2 new features: packages (read only) and shell
