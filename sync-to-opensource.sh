#!/bin/bash

# Configuration
INTERNAL_REPO="."
OPENSOURCE_REPO="/tmp/intervo-opensource-$$"
OPENSOURCE_REMOTE_URL="https://github.com/Intervo/Intervo.git"  # Add your open source repo URL here

# Files/folders to exclude from sync
EXCLUDE_PATTERNS=(
    "packages/intervo-backend/.env*"
    "packages/intervo-backend/src/billing/"
    "packages/intervo-backend/routes/*admin*.js"
    "packages/intervo-backend/routes/*Admin*.js"
    "packages/intervo-backend/routes/billing.js"
    "packages/intervo-backend/production_vector_store/"
    "packages/intervo-backend/vector_stores/"
    "packages/intervo-frontend/src/components/enterprise/"
    "packages/intervo-frontend/src/components/billing/"
    "packages/intervo-frontend/src/pages/admin/"
    "packages/intervo-frontend/src/app/(admin)/admin/"
    "packages/intervo-frontend/src/app/(workspace)/[workspaceid]/settings/"
    "packages/intervo-frontend/src/app/(workspace)/[workspaceid]/agent/(agent)/[slug]/playground/canvas/"
    "**/node_modules"
    "**/.env*"
    "**/dist"
    "**/build"
    "**/.DS_Store"
)

echo "🔄 Syncing to open source repo..."

# Check if remote URL is set
if [ -z "$OPENSOURCE_REMOTE_URL" ]; then
    echo "❌ Please set OPENSOURCE_REMOTE_URL in the script"
    exit 1
fi

# Create temp directory
mkdir -p "$OPENSOURCE_REPO"

# Create rsync exclude file
EXCLUDE_FILE="/tmp/rsync_exclude_$$"
for pattern in "${EXCLUDE_PATTERNS[@]}"; do
    echo "$pattern" >> "$EXCLUDE_FILE"
done

# Sync files
rsync -av --delete --exclude-from="$EXCLUDE_FILE" --exclude='.git/' "$INTERNAL_REPO/" "$OPENSOURCE_REPO/"

# Replace docker-compose with simplified version
cp opensource-docker-compose.yml "$OPENSOURCE_REPO/docker-compose.yml"

# Note: If you get compilation errors, manually fix the broken imports

# Clean up exclude file
rm "$EXCLUDE_FILE"

# Push to open source repo
echo "📤 Pushing to open source repo..."
cd "$OPENSOURCE_REPO"
git init
git add .
git commit -m "Sync from internal repo - $(date)"
git branch -M main
git remote add origin "$OPENSOURCE_REMOTE_URL"
git push origin main --force

# Clean up temp directory
cd "$INTERNAL_REPO"
rm -rf "$OPENSOURCE_REPO"

echo "✅ Sync completed and pushed!" 