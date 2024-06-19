#!/usr/bin/env sh

# Remove dist directory
if [ -d dist/app ]; then
  rm -rf dist/app
fi

# Create dist directory
mkdir -p dist/app

# Copy over files to dist
if [ -d apps/client/.next/standalone/apps/client ]; then
  cp -frp apps/client/.next/standalone/apps/client/. dist/app || echo 'Source directory does not exist: apps/client/
  .next/standalone/apps/client'
fi

# Copy required-server-files.json from .next to dist/app
if [ -f apps/client/.next/required-server-files.json ]; then
  cp -frp apps/client/.next/required-server-files.json dist/app/required-server-files.json || echo 'Source file does not exist: apps/client/.next/required-server-files.json'
fi

# Copy public directory
if [ -d apps/client/public ]; then
  cp -frp apps/client/public/. dist/app/public || echo 'Source directory does not exist: apps/client/public'
fi

# Copy static into public
if [ -d apps/client/.next/static ]; then
  cp -frp apps/client/.next/static dist/app/.next/static || echo 'Source directory does not exist: apps/client/.next/static'
fi

# Copy server.js to dist/app
if [ -f apps/client/server.js ]; then
  cp -frp apps/client/server.js dist/app/server.js || echo 'Source file does not exist: apps/client/server.js'
fi

# Copy files from dist/server to dist/app
if [ -d dist/server ]; then
  cp -frp dist/server/. dist/app
fi
