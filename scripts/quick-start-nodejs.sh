#!/bin/bash
# Quick Start: Node.js CLI Example

set -e
cd "$(dirname "$0")/.."

echo "🚀 FHEVM Node.js CLI Quick Start"
echo ""

# Start Hardhat node
bash "$(dirname "$0")/start-hardhat.sh" || exit 1

# Deploy contracts
echo "Deploying contracts..."
pnpm deploy:localhost > /dev/null 2>&1

# Create .env if missing
if [ ! -f packages/nodejs-example/.env ]; then
    cp packages/nodejs-example/.env.example packages/nodejs-example/.env
    echo "✓ Created .env file"
fi

# Start Node.js CLI
echo ""
echo "✓ Setup complete! Starting Node.js CLI..."
echo ""
echo "ℹ  This is a CLI application - no browser needed!"
echo ""
pnpm start:nodejs
