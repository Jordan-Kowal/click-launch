# TODO

## UX

- Intercept refreshes from menu (not just shortcuts)
- Handle cases where the incoming log is an update and should replace the current one
  - `const _isLiveUpdate = /\x1b\[[0-9]*[ABCD]/.test(text) || /\x1b\[2K/.test(text);`

## DX

- Add screenshot to README
- Show current version somewhere
