#!/bin/bash

# Script to commit and push all changes to next-w-backend branch
cd "$(dirname "$0")"

echo "📦 Staging all changes..."
git add .

echo "📝 Committing changes..."
git commit -m "Update UI and components: spacing, styling, and functionality improvements

- Add PDF generation with expo-print (4-column layout, improved fonts)
- Add reset score functionality for all tournament screens
- Update match card spacing and styling (reduced padding)
- Improve tournament display components
- Update player input screens with bulk add and 2-column layout
- Update navigation and authentication screens
- Package updates (expo-print, expo-sharing, expo-file-system)"

echo "🚀 Pushing to next-w-backend branch..."
git push origin next-w-backend

echo "✅ Done!"

