#!/bin/bash

# Used for testing the live update functionality

echo First
echo Second

for i in {1..20}; do
  if [ $((i % 4)) -eq 0 ]; then
    echo "New line $i"
  else
    echo -ne "\r\033[2KUpdate $i"
  fi
  sleep 0.5
done
