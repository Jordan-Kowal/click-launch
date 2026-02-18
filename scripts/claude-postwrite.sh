#!/bin/sh
# Claude Code PostToolUse hook: formats and lints edited files by extension.
# Called automatically after Write/Edit/NotebookEdit via .claude/settings.json.
set -eu

TS_FILES=""
GO_FILES=""

for f in "$@"; do
  case "$f" in
    *.ts|*.tsx|*.js|*.jsx|*.json) TS_FILES="$TS_FILES $f" ;;
    *.go) gofmt -w "$f"; GO_FILES="$GO_FILES $f" ;;
  esac
done

if [ -n "$TS_FILES" ]; then
  bun run biome:check:fix $TS_FILES
fi

if [ -n "$GO_FILES" ]; then
  golangci-lint run $GO_FILES
fi
