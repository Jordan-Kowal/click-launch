#!/bin/sh
# Bumps the app version across all config files, commits, tags, and pushes.
set -eu

BUMP_TYPE="${1:-}"
if [ "$BUMP_TYPE" != "patch" ] && [ "$BUMP_TYPE" != "minor" ] && [ "$BUMP_TYPE" != "major" ]; then
  echo "Usage: $0 <patch|minor|major>" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Read current version from package.json
OLD_VERSION=$(grep '"version"' "$ROOT/package.json" | head -1 | sed 's/.*"\([0-9]*\.[0-9]*\.[0-9]*\)".*/\1/')
MAJOR=$(echo "$OLD_VERSION" | cut -d. -f1)
MINOR=$(echo "$OLD_VERSION" | cut -d. -f2)
PATCH=$(echo "$OLD_VERSION" | cut -d. -f3)

# Compute new version
case "$BUMP_TYPE" in
  major) MAJOR=$((MAJOR + 1)); MINOR=0; PATCH=0 ;;
  minor) MINOR=$((MINOR + 1)); PATCH=0 ;;
  patch) PATCH=$((PATCH + 1)) ;;
esac
NEW_VERSION="${MAJOR}.${MINOR}.${PATCH}"

echo "Bumping version: ${OLD_VERSION} → ${NEW_VERSION}"
echo ""

# Update files
sed -i '' "s/\"version\": \"${OLD_VERSION}\"/\"version\": \"${NEW_VERSION}\"/" "$ROOT/package.json"
echo "  ✓ package.json"

sed -i '' "s/${OLD_VERSION}/${NEW_VERSION}/g" "$ROOT/README.md"
echo "  ✓ README.md"

sed -i '' "s/version: \"${OLD_VERSION}\"/version: \"${NEW_VERSION}\"/" "$ROOT/build/config.yml"
echo "  ✓ build/config.yml"

sed -i '' "s/appVersion = \"${OLD_VERSION}\"/appVersion = \"${NEW_VERSION}\"/" "$ROOT/main.go"
echo "  ✓ main.go"

if grep -q "## TBD" "$ROOT/CHANGELOG.md"; then
  TODAY=$(date +%Y-%m-%d)
  sed -i '' "s/## TBD/## ${NEW_VERSION} - ${TODAY}/" "$ROOT/CHANGELOG.md"
  echo "  ✓ CHANGELOG.md"
else
  echo "  ⚠ CHANGELOG.md — no '## TBD' section found, skipping"
fi

# Git commit + tag + push
echo ""
cd "$ROOT"
git add package.json README.md CHANGELOG.md build/config.yml main.go
git commit -m "chore: bump version to ${NEW_VERSION}"
git tag "$NEW_VERSION"
git push
git push origin "$NEW_VERSION"

echo ""
echo "Done! Version bumped to ${NEW_VERSION}, tagged, and pushed."
