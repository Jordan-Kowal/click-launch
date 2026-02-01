#!/bin/bash

# Simulates a process that crashes after a configurable delay
# Used for testing auto-restart functionality

# Default values
crash_delay="${1:-3}"  # Default: crash after 3 seconds
exit_code="${2:-1}"    # Default: exit with code 1

echo "Crashing Process Started (PID: $$)"
echo "Will crash in $crash_delay seconds with exit code $exit_code"
echo "---"

counter=0
while [ $counter -lt $crash_delay ]; do
  counter=$((counter + 1))
  timestamp=$(date "+%H:%M:%S")
  echo "[$timestamp] Running... ($counter/$crash_delay seconds)"
  sleep 1
done

echo "---"
echo "SIMULATING CRASH! Exiting with code $exit_code"
exit $exit_code
