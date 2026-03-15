#!/bin/sh
set -e

# Use Conductor's assigned port to avoid conflicts between workspaces
export WAILS_VITE_PORT="${CONDUCTOR_PORT:-9245}"

echo "Starting dev server on port $WAILS_VITE_PORT..."
task dev
