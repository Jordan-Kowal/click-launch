#!/bin/bash

# Used for testing that the app correctly stops all processes when reloading the dashboard page

lockfile="$(dirname "$0")/infinite_process.lock"

if [ -f "$lockfile" ]; then
  echo "ERROR: Process already running!"
  exit 1
fi

touch "$lockfile"
trap "rm -f $lockfile" EXIT

echo "Process started with PID: $$"
sleep 999999999
