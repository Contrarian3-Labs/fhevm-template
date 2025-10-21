#!/bin/bash
# Quick Start: React/Next.js Example

set -e
cd "$(dirname "$0")/.."

echo "🚀 FHEVM React Quick Start"
echo ""

# Start Hardhat node
bash "$(dirname "$0")/start-hardhat.sh" || exit 1

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
