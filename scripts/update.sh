#!/bin/bash
# ClickLaunch update script — downloads a version-pinned .dmg, verifies its
# Apple Developer ID signature, installs to /Applications, and relaunches.
#
# Invoked by the app with the target version as $1 (e.g. `update.sh 2.2.0`).
# If $1 is omitted, falls back to `releases/latest` — kept for manual runs and
# older ClickLaunch versions that pass no arg. The signed caller (app_service.go)
# always passes a validated version.

set -euo pipefail

LOG_DIR="${HOME}/.click-launch"
LOG_FILE="${LOG_DIR}/update.log"
mkdir -p "${LOG_DIR}"

# Tee all output (stdout + stderr) to ~/.click-launch/update.log so failures are
# diagnosable after the fact. exec replaces FD 1/2 for the rest of the script.
exec > >(tee -a "${LOG_FILE}") 2>&1

echo "--- click-launch update $(date -u +%Y-%m-%dT%H:%M:%SZ) ---"

TEAM_ID="DZZL8SY62B"
BUNDLE_ID="app.jkdev.click-launch"
REQUIREMENT="identifier \"${BUNDLE_ID}\" and anchor apple generic and certificate leaf[subject.OU] = \"${TEAM_ID}\""

VERSION="${1:-}"

cleanup() {
  if [ -n "${MOUNT_POINT:-}" ] && [ -d "${MOUNT_POINT}" ]; then
    hdiutil detach -quiet "${MOUNT_POINT}" || true
  fi
  rm -rf /tmp/click-launch-install
}
trap cleanup EXIT

echo "Updating ClickLaunch..."
mkdir -p /tmp/click-launch-install

if [ -n "${VERSION}" ]; then
  # Version-pinned path: fetch the specific tag's release assets. Rejects
  # attacker-substituted "latest" tags once the caller has committed to a
  # version string.
  echo "Fetching release metadata for ${VERSION}..."
  API_URL="https://api.github.com/repos/Jordan-Kowal/click-launch/releases/tags/${VERSION}"
else
  echo "No version pinned; falling back to releases/latest."
  API_URL="https://api.github.com/repos/Jordan-Kowal/click-launch/releases/latest"
fi

DMG_URL=$(curl -fsSL "${API_URL}" \
  | grep '"browser_download_url".*\.dmg"' \
  | head -1 \
  | cut -d '"' -f 4)

if [ -z "${DMG_URL}" ]; then
  echo "ERROR: could not resolve DMG URL from ${API_URL}" >&2
  exit 1
fi

echo "Downloading ${DMG_URL}..."
curl -fsSL -o /tmp/click-launch-install/click-launch.dmg "${DMG_URL}"

echo "Mounting disk image..."
# -mountrandom /tmp keeps our ephemeral mount out of /Volumes so we don't
# collide with any user-mounted ClickLaunch DMG. Don't pass -quiet: we need
# stdout to parse out the mount point.
ATTACH_OUTPUT=$(hdiutil attach -nobrowse -mountrandom /tmp /tmp/click-launch-install/click-launch.dmg)
MOUNT_POINT=$(echo "${ATTACH_OUTPUT}" | awk -F'\t' '$NF ~ /^\// { mp=$NF } END { print mp }')

if [ -z "${MOUNT_POINT}" ]; then
  echo "ERROR: hdiutil attach produced no mount point" >&2
  echo "hdiutil output was:" >&2
  echo "${ATTACH_OUTPUT}" >&2
  exit 1
fi
if [ ! -d "${MOUNT_POINT}/ClickLaunch.app" ]; then
  echo "ERROR: ClickLaunch.app not found at ${MOUNT_POINT}" >&2
  ls -la "${MOUNT_POINT}" >&2 || true
  exit 1
fi

echo "Verifying Apple Developer ID signature..."
# --deep: walk nested bundles; --strict: reject any signature anomaly;
# --requirement: pin to our specific Team ID + bundle identifier. This is
# the gate that prevents a compromised GitHub release from installing a
# trojaned app under the ClickLaunch name.
if ! codesign --verify --deep --strict --verbose=2 \
     --requirement "${REQUIREMENT}" \
     "${MOUNT_POINT}/ClickLaunch.app"; then
  echo "ERROR: codesign verification failed; aborting install" >&2
  exit 1
fi

# Gatekeeper cross-check: matches what macOS itself enforces at first launch.
# Belt-and-suspenders for the codesign --requirement check above.
if ! spctl --assess --type execute --verbose=2 "${MOUNT_POINT}/ClickLaunch.app"; then
  echo "ERROR: Gatekeeper rejected the signed bundle; aborting install" >&2
  exit 1
fi

echo "Installing to Applications folder..."
if [ -d "/Applications/ClickLaunch.app" ]; then
  rm -rf "/Applications/ClickLaunch.app"
fi
cp -R "${MOUNT_POINT}/ClickLaunch.app" /Applications/

echo "ClickLaunch has been successfully updated!"
