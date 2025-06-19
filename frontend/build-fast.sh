#!/bin/bash

# Fast build script for low-CPU environments
# This script optimizes the build process for servers with limited resources

echo "🚀 Starting optimized build for low-CPU environment..."

# Set Node.js optimization flags
export NODE_OPTIONS="--max-old-space-size=2048 --max-semi-space-size=128"
export NODE_ENV=production

# Limit CPU usage to prevent overwhelming the server
export UV_THREADPOOL_SIZE=2

# Clear any existing dist directory
echo "🧹 Cleaning previous build..."
rm -rf dist

# Run type checking in background (optional, for development)
if [ "$1" = "--with-types" ]; then
    echo "🔍 Running type check in background..."
    npm run type-check &
    TYPE_CHECK_PID=$!
fi

# Run the fast build (without TypeScript checking)
echo "📦 Building application..."
npm run build:fast

# Wait for type checking if it was started
if [ ! -z "$TYPE_CHECK_PID" ]; then
    echo "⏳ Waiting for type check to complete..."
    wait $TYPE_CHECK_PID
    echo "✅ Type check completed"
fi

echo "✨ Build completed successfully!"
echo "📁 Output directory: dist/"
echo "💾 Build size:"
du -sh dist/

# Optional: Show build stats
if [ "$1" = "--stats" ] || [ "$2" = "--stats" ]; then
    echo "📊 Build statistics:"
    find dist -name "*.js" -exec wc -c {} + | sort -n | tail -10
fi 