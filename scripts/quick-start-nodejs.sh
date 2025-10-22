#!/bin/bash
# Quick Start: Node.js CLI Example

set -e
cd "$(dirname "$0")/.."

echo "🚀 FHEVM Node.js CLI Quick Start"
echo ""

# Check Node.js version
echo "Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
REQUIRED_VERSION=20

if [ "$NODE_VERSION" -lt "$REQUIRED_VERSION" ]; then
    echo "✗ Node.js version $REQUIRED_VERSION or higher required"
    echo "  Current version: $(node -v)"
    echo ""
    echo "Please upgrade Node.js:"
    echo "  • Using nvm: nvm install 20 && nvm use 20"
    echo "  • Or download from: https://nodejs.org/"
    echo ""
    exit 1
fi
echo "✓ Node.js version $(node -v) is compatible"
echo ""

# Check if Hardhat is running
echo "Checking Hardhat node..."
if ! nc -z localhost 8545 2>/dev/null; then
    echo "⚠  Hardhat node is not running"
    echo ""
    echo "Please start Hardhat in a separate terminal first:"
    echo "  pnpm chain"
    echo ""
    exit 1
fi
echo "✓ Hardhat node is running"
echo ""

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
