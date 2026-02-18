#!/bin/bash

# Simulates a database service with configurable compression and verbosity level

# Default values
compression="gzip"
verbosity="info"
port="5432"

# Parse named arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --compression)
      compression="$2"
      shift 2
      ;;
    --verbosity)
      verbosity="$2"
      shift 2
      ;;
    --port)
      port="$2"
      shift 2
      ;;
    *)
      shift
      ;;
  esac
done

echo "Database Service Starting"
echo "Compression: $compression"
echo "Verbosity: $verbosity"
echo "Port: $port"
echo "---"

counter=0
while true; do
  counter=$((counter + 1))
  timestamp=$(date "+%H:%M:%S")

  # Vary output based on verbosity
  if [ "$verbosity" = "debug" ]; then
    echo "[$timestamp] DEBUG: Query executed, index scan used"
  elif [ "$verbosity" = "info" ]; then
    if [ $((counter % 3)) -eq 0 ]; then
      echo "[$timestamp] INFO: Database connection pool stable (4/10 active)"
    else
      echo "[$timestamp] Processing query #$counter"
    fi
  else
    if [ $((counter % 5)) -eq 0 ]; then
      echo "[$timestamp] Database healthy"
    fi
  fi

  sleep 1
done
