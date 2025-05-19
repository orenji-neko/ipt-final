#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install dependencies
npm ci

# Build the Angular app
npm run build

# Rename the dist directory to the expected name
# Adjust this if your build output directory is different
if [ -d "dist" ]; then
  echo "Using existing dist directory"
else
  mkdir -p dist
fi 