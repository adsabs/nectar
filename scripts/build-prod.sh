#!/bin/bash

set -e

echo "🔧 Preparing build..."

# Get git tag (or fallback to dev)
APP_VERSION=$(git describe --tags --abbrev=0 2>/dev/null || echo dev)

echo "📦 Building with version: $APP_VERSION"

# Export env vars for the build
export NEXT_TELEMETRY_DISABLED=1
export STANDALONE=1
export DIST_DIR=./dist/
export NEXT_PUBLIC_APP_VERSION=$APP_VERSION

# Generate bibstem index & run Next.js build
pnpm build-bibstem-index
next build
