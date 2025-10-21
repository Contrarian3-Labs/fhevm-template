#!/bin/bash
# Quick Start: Vue 3 Example

set -e
cd "$(dirname "$0")/.."

echo "🚀 FHEVM Vue Quick Start"
echo ""

# Start Hardhat node
bash "$(dirname "$0")/start-hardhat.sh" || exit 1

# Deploy contracts
echo "Deploying contracts..."
pnpm deploy:localhost > /dev/null 2>&1

# Create .env if missing
if [ ! -f packages/vue-example/.env ]; then
    cp packages/vue-example/.env.example packages/vue-example/.env
    echo "✓ Created .env file"
fi

# Start Vue
echo ""
echo "✓ Setup complete! Starting Vue app..."
echo ""
echo "📝 MetaMask Setup:"
echo "   • Network: Hardhat Local"
echo "   • RPC URL: http://localhost:8545"
echo "   • Chain ID: 31337"
echo ""
pnpm start:vue
