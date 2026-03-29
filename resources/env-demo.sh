#!/bin/bash
# Demonstrates env_file + env precedence:
# - VAR1 comes from .env file only
# - VAR2 is in .env file but overridden by explicit env
# - VAR3 comes from explicit env only

echo "VAR1=$VAR1 (expected: from_env_file)"
echo "VAR2=$VAR2 (expected: overridden)"
echo "VAR3=$VAR3 (expected: from_explicit_env)"
sleep 1
