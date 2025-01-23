#!/bin/bash
echo "🗑️  Cleaning dist directory..."
rm -rf dist/

echo "🏗️  Rebuilding site..."
npm run build

echo "🚀 Starting server..."
npm run serve 