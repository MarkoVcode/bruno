#!/bin/bash

set -e

# BrunoN release build script
# Simplified version that uses .env for configuration

PLATFORM=$1

if [ -z "$PLATFORM" ]; then
  echo "Usage: $0 <platform>"
  echo "Platforms: linux, mac, win, deb, rpm, snap"
  exit 1
fi

echo "Building BrunoN release for platform: $PLATFORM"

# Get version from git tag if available and export as environment variable
if git describe --tags --exact-match >/dev/null 2>&1; then
  export BRUNON_VERSION=$(git describe --tags --exact-match)
  echo "Using git tag version: $BRUNON_VERSION"
else
  echo "Using default version from .env or package.json"
fi

# Step 1: Build required packages
echo "Building required packages..."
npm run build:openapi-docs

# Step 2: Build web application
echo "Building web application..."
npm run build:web

# Step 3: Prepare Electron web assets
echo "Preparing Electron web assets..."

# Remove old build directories
rm -rf packages/bruno-electron/out
rm -rf packages/bruno-electron/web

# Copy web build
cp -r packages/bruno-app/dist packages/bruno-electron/web

# Remove sourcemaps (optional, reduces size)
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
