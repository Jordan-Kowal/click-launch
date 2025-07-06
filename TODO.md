# TODO

## Feature: Find a .yml file in a folder to load project

- On start, remove invalid previous projects/paths
  - Show toaster
- Open:
  - On select, redirect to homepage
- On dashboard:
  - Ensure yaml is valid. If error:
    - Show error messages
    - Reload button / back button
    - Add tests
  - On valid, save it in previous projects locally

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

## Improvements

- Test electron?
- Better split electron code

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
