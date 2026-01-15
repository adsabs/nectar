#!/bin/bash

set -e

echo "🔧 Preparing local build..."

# Get short SHA (fallback to 'local' if something fails)
GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo local)

echo "📦 Building with SHA: $GIT_SHA"

# Export env vars for the build
export NEXT_TELEMETRY_DISABLED=1
export DIST_DIR=./dist/
export NEXT_PUBLIC_APP_VERSION=$GIT_SHA

# Generate bibstem index & run Next.js build
# Using --webpack for compatibility with current packages
pnpm build-bibstem-index
next build --webpack
