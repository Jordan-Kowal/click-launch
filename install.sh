#!/bin/bash

# Click Launch Installation Script
# This script downloads and installs the latest version of Click Launch

set -e

# Cleanup function that runs on exit
cleanup() {
  if [ -d "/tmp/clicklaunch" ]; then
    echo "🧹 Cleaning up..."
    rm -rf /tmp/clicklaunch
  fi
}

# Ensure cleanup runs on exit (success or failure)
trap cleanup EXIT

echo "🚀 Installing Click Launch..."

# Create temporary directory
mkdir -p /tmp/clicklaunch

# Download latest release
echo "📥 Downloading latest release..."
curl -s https://api.github.com/repos/Jordan-Kowal/click-launch/releases/latest | \
  grep "browser_download_url.*zip" | \
  cut -d '"' -f 4 | \
  xargs curl -L -o /tmp/clicklaunch/clicklaunch.zip

# Extract the app
echo "📦 Extracting application..."
unzip -q /tmp/clicklaunch/clicklaunch.zip -d /tmp/clicklaunch

# Remove quarantine attributes
echo "🔓 Removing quarantine attributes..."
xattr -cr /tmp/clicklaunch/*.app

# Remove existing installation
if [ -d "/Applications/ClickLaunch.app" ]; then
  echo "🗑️ Removing existing installation..."
  rm -rf /Applications/ClickLaunch.app
fi

# Install to Applications
echo "📱 Installing to Applications folder..."
mv /tmp/clicklaunch/*.app /Applications/

echo "✅ Click Launch has been successfully installed!"
echo "💡 You can now launch it from Applications or Spotlight"
