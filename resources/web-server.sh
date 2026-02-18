#!/bin/bash

# Simulates a web server with configurable watch mode, environment, and port

# Default values
watch_mode="false"
environment="development"
port="3000"

# Parse named arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --watch-mode)
      watch_mode="$2"
      shift 2
      ;;
    --environment)
      environment="$2"
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

echo "Starting Web Server on port $port (environment: $environment)"
if [ "$watch_mode" = "true" ]; then
  echo "Watch mode enabled - files will be reloaded on changes"
fi
echo "---"

# Display custom environment variables if set
if [ -n "$NODE_ENV" ] || [ -n "$DEBUG" ] || [ -n "$API_URL" ]; then
  echo "Custom environment variables:"
  [ -n "$NODE_ENV" ] && echo "  NODE_ENV=$NODE_ENV"
  [ -n "$DEBUG" ] && echo "  DEBUG=$DEBUG"
  [ -n "$API_URL" ] && echo "  API_URL=$API_URL"
  echo "---"
fi

counter=0
while true; do
  counter=$((counter + 1))
  timestamp=$(date "+%H:%M:%S")

  if [ $((counter % 5)) -eq 0 ]; then
    echo "[$timestamp] ✓ Server running on http://localhost:$port"
  else
    echo "[$timestamp] Processing request #$counter"
  fi

  sleep 1
done
