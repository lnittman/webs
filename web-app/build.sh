#!/bin/bash
# Simple build script for web-app

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the application
echo "Building application..."
npm run build

echo "Build completed successfully!" 