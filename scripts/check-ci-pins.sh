#!/bin/sh
# Verifies that tool versions pinned in GitHub Actions workflows match the
# versions declared in go.mod. Prevents CI drift where `@latest` silently
# breaks releases.
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORKFLOW="$ROOT/.github/workflows/build-and-release.yml"
QUALITY_WORKFLOW="$ROOT/.github/workflows/code-quality.yml"

fail() {
  echo "✗ $1" >&2
  exit 1
}

# Wails — pinned in CI must match go.mod
GOMOD_WAILS=$(grep -E '^	github.com/wailsapp/wails/v3 v' "$ROOT/go.mod" | awk '{print $2}')
if [ -z "$GOMOD_WAILS" ]; then
  GOMOD_WAILS=$(grep -E 'github.com/wailsapp/wails/v3 v' "$ROOT/go.mod" | awk '{print $2}' | head -1)
fi
CI_WAILS=$(grep -oE 'wails3@v[0-9][^ "]*' "$WORKFLOW" | head -1 | sed 's/^wails3@//')

if [ -z "$GOMOD_WAILS" ]; then
  fail "Could not find Wails version in go.mod"
fi
if [ -z "$CI_WAILS" ]; then
  fail "Could not find pinned Wails version in $WORKFLOW (expected wails3@v<version>)"
fi
if [ "$GOMOD_WAILS" != "$CI_WAILS" ]; then
  fail "Wails version mismatch: go.mod=$GOMOD_WAILS CI=$CI_WAILS"
fi
echo "✓ Wails: $GOMOD_WAILS"

# Task — CI must pin an explicit version (no @latest)
CI_TASK=$(grep -oE 'task/v3/cmd/task@v?[0-9][^ "]*' "$WORKFLOW" | head -1 | sed 's/^.*@//')
if [ -z "$CI_TASK" ]; then
  fail "Could not find pinned Task version in $WORKFLOW (expected task@v<version>)"
fi
if echo "$CI_TASK" | grep -q "latest"; then
  fail "Task is pinned to 'latest' in $WORKFLOW — pin an explicit version"
fi
echo "✓ Task: $CI_TASK"

# govulncheck — must be declared as a tool in go.mod AND invoked via
# `go tool govulncheck` in CI. Using `@latest` in CI would silently drift
# from local dev.
if ! grep -qE '^tool golang\.org/x/vuln/cmd/govulncheck$' "$ROOT/go.mod"; then
  fail "govulncheck not declared as a tool in go.mod (expected 'tool golang.org/x/vuln/cmd/govulncheck')"
fi
if ! grep -q 'go tool govulncheck' "$QUALITY_WORKFLOW"; then
  fail "code-quality.yml should run 'go tool govulncheck' (pinned via go.mod), not 'go install @latest'"
fi
if grep -q 'govulncheck@latest' "$QUALITY_WORKFLOW"; then
  fail "govulncheck@latest detected in $QUALITY_WORKFLOW — use 'go tool govulncheck' instead"
fi
GOMOD_VULN=$(grep -E '^\s*golang\.org/x/vuln v' "$ROOT/go.mod" | awk '{print $2}' | head -1)
if [ -z "$GOMOD_VULN" ]; then
  fail "Could not resolve golang.org/x/vuln version in go.mod"
fi
echo "✓ govulncheck: $GOMOD_VULN (via go tool)"

echo ""
echo "All CI tool versions correctly pinned."
