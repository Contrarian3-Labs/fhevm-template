#!/bin/bash
# Quick Start: React/Next.js Example

set -e
cd "$(dirname "$0")/.."

echo "🚀 FHEVM React Quick Start"
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

# Start React
echo ""
echo "✓ Setup complete! Starting React app..."
echo ""
echo "📝 MetaMask Setup:"
echo "   • Network: Hardhat Local"
echo "   • RPC URL: http://127.0.0.1:8545"
echo "   • Chain ID: 31337"
echo ""
pnpm start
