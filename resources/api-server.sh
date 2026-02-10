#!/bin/bash

# Simulates an API server with configurable caching, rate limiting, and custom port

# Default values
cache_enabled="true"
rate_limit="1000"
custom_port="8000"
sleep_interval="1"

# Parse named arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --cache-enabled)
      cache_enabled="$2"
      shift 2
      ;;
    --rate-limit)
      rate_limit="$2"
      shift 2
      ;;
    --custom-port)
      custom_port="$2"
      shift 2
      ;;
    --sleep-interval)
      sleep_interval="$2"
      shift 2
      ;;
    *)
      shift
      ;;
  esac
done

echo "API Server Starting"
echo "Caching: $([ "$cache_enabled" = "true" ] && echo "enabled" || echo "disabled")"
echo "Rate limit: $rate_limit req/min"
echo "Port: $custom_port"
echo "---"

counter=0
while true; do
  counter=$((counter + 1))
  timestamp=$(date "+%H:%M:%S")

  # Show different information based on cache setting
  if [ "$cache_enabled" = "true" ]; then
    if [ $((counter % 4)) -eq 0 ]; then
      hit_rate=$((RANDOM % 100))
      echo "[$timestamp] Cache hit rate: ${hit_rate}%"
    else
      echo -ne "[$timestamp] Handling request #$counter (cached)..."
    fi
  else
    if [ $((counter % 4)) -eq 0 ]; then
      echo "[$timestamp] Request #$counter completed (no cache)"
    else
      echo -ne "[$timestamp] Handling request #$counter..."
    fi
  fi

  sleep "$sleep_interval"
done
