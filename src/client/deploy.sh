#!/bin/bash
set -e

CLIENT_DIR="$(cd "$(dirname "$0")" && pwd)"
PKG="$CLIENT_DIR/package.json"

# Extract current version
CURRENT=$(node -e "const p=require('$PKG'); console.log(p.version)")
MAJOR=$(echo "$CURRENT" | cut -d. -f1)
MINOR=$(echo "$CURRENT" | cut -d. -f2)
PATCH=$(echo "$CURRENT" | cut -d. -f3)

# Increment patch version
NEW_PATCH=$((PATCH + 1))
NEW_VERSION="$MAJOR.$MINOR.$NEW_PATCH"

# Update package.json
node -e "const p=require('$PKG'); p.version='$NEW_VERSION'; require('fs').writeFileSync('$PKG', JSON.stringify(p, null, 2) + '\n')"

echo "📦 Version: $CURRENT → $NEW_VERSION"

# Build
cd "$CLIENT_DIR"
npm run build

# Deploy to AppServer
echo "🚀 Deploying to AppServer..."
sshpass -p 'hksl@2628' ssh -o StrictHostKeyChecking=no -p 6022 denvy@172.31.254.165 "rm -rf /home/denvy/server/dist/*"
sshpass -p 'hksl@2628' scp -o StrictHostKeyChecking=no -P 6022 -r "$CLIENT_DIR/dist/"* denvy@172.31.254.165:/home/denvy/server/dist/
sshpass -p 'hksl@2628' ssh -o StrictHostKeyChecking=no -p 6022 denvy@172.31.254.165 "echo 'hksl@2628' | sudo -S systemctl restart mytodo 2>&1"

echo "✅ Deployed v$NEW_VERSION!"
