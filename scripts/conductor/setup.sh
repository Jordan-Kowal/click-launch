#!/bin/sh
set -e

echo "Installing frontend dependencies..."
bun install

echo "Tidying Go modules..."
go mod tidy

echo "Generating Wails bindings..."
wails3 generate bindings

echo "Setup complete."
