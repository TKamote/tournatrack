#!/bin/bash

echo "🚀 Starting cleanup process..."

# Set up directories
PROJECT_DIR="$(pwd)"
BACKUP_DIR="$PROJECT_DIR/backups/$(date +%Y%m%d_%H%M%S)"

# Create backup directory
mkdir -p "$BACKUP_DIR"
echo "📁 Created backup directory: $BACKUP_DIR"

# List of files to be moved to backup
FILES_TO_BACKUP=(
  "src/screens/SingleEliminationScreen.tsx"
  "src/screens/DoubleEliminationScreen.tsx"
  "src/utils/singleEliminationUtils.ts"
  "src/utils/doubleEliminationUtils.ts"
)

# Backup each file
for file in "${FILES_TO_BACKUP[@]}"; do
  if [ -f "$PROJECT_DIR/$file" ]; then
    # Create directory structure in backup
    mkdir -p "$BACKUP_DIR/$(dirname $file)"
    
    # Copy file to backup
    cp "$PROJECT_DIR/$file" "$BACKUP_DIR/$file"
    echo "✅ Backed up: $file"
    
    # Remove original file
    rm "$PROJECT_DIR/$file"
    echo "🗑️  Removed original: $file"
  else
    echo "⚠️  File not found: $file"
  fi
done

echo "✨ Cleanup complete! Your files are safely backed up in: $BACKUP_DIR"