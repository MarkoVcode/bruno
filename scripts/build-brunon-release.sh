#!/bin/bash

set -e

# BrunoN release build script
# This script applies BrunoN branding and builds release packages
# Only run during release builds to minimize code changes

PLATFORM=$1

if [ -z "$PLATFORM" ]; then
  echo "Usage: $0 <platform>"
  echo "Platforms: linux, mac, win, deb, rpm, snap"
  exit 1
fi

echo "Building BrunoN release for platform: $PLATFORM"

# Set BrunoN release environment variables
export BRUNON_RELEASE=true

# Get version from git tag if available
if git describe --tags --exact-match >/dev/null 2>&1; then
  export BRUNON_GIT_TAG=$(git describe --tags --exact-match)
  echo "Using git tag version: $BRUNON_GIT_TAG"
else
  echo "Warning: Not on a tagged commit. Version will use package.json value only."
fi

# Step 1: Apply BrunoN branding to UI files
echo "Applying BrunoN branding..."
node scripts/apply-brunon-branding.js

# Step 2: Build web application
echo "Building web application..."
npm run build:web

# Step 3: Prepare Electron web assets
echo "Preparing Electron web assets..."

# Remove old build directories
rm -rf packages/bruno-electron/out
rm -rf packages/bruno-electron/web

# Create new web directory
mkdir -p packages/bruno-electron/web

# Copy web build
cp -r packages/bruno-app/dist/* packages/bruno-electron/web

# Update static paths for Electron
if [ "$(uname)" == "Darwin" ]; then
  # macOS sed syntax
  find packages/bruno-electron/web -name "*.html" -exec sed -i '' 's@/static/@static/@g' {} \;
  find packages/bruno-electron/web/static/css -name "*.css" -exec sed -i '' 's@/static/font@../../static/font@g' {} \;
else
  # Linux sed syntax
  find packages/bruno-electron/web -name "*.html" -exec sed -i 's@/static/@static/@g' {} \;
  find packages/bruno-electron/web/static/css -name "*.css" -exec sed -i 's@/static/font@../../static/font@g' {} \;
fi

# Remove sourcemaps
find packages/bruno-electron/web -name '*.map' -type f -delete

echo "Web assets prepared"

# Step 4: Build Electron distributables
echo "Building Electron package for $PLATFORM..."

case "$PLATFORM" in
  snap)
    npm run dist:snap --workspace=packages/bruno-electron
    ;;
  mac)
    npm run dist:mac --workspace=packages/bruno-electron
    ;;
  win)
    npm run dist:win --workspace=packages/bruno-electron
    ;;
  deb)
    npm run dist:deb --workspace=packages/bruno-electron
    ;;
  rpm)
    npm run dist:rpm --workspace=packages/bruno-electron
    ;;
  linux)
    npm run dist:linux --workspace=packages/bruno-electron
    ;;
  *)
    echo "Unknown platform: $PLATFORM"
    echo "Valid platforms: linux, mac, win, deb, rpm, snap"
    exit 1
    ;;
esac

echo ""
echo "✓ BrunoN release build complete!"
echo "  Platform: $PLATFORM"
echo "  Output: packages/bruno-electron/out/"
