#!/bin/bash
# Demonstrates env_file + env precedence:
# - VAR1 comes from .env file only
# - VAR2 is in .env file but overridden by explicit env
# - VAR3 comes from explicit env only

echo "VAR1=$VAR1 (expected: from_env_file)"
echo "VAR2=$VAR2 (expected: overridden)"
echo "VAR3=$VAR3 (expected: from_explicit_env)"
echo "VAR4=$VAR4 (expected: prefix_\$VAR1 — no expansion)"
echo "VAR5=$VAR5 (expected: prefix_\$VAR3 — no expansion)"
sleep 1
