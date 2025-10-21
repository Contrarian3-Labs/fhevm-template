#!/bin/bash

# FHEVM Template Quick Start Script
# Gets you up and running in < 10 lines of code!

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   FHEVM Template Quick Start            ║${NC}"
echo -e "${BLUE}║   Get started in < 3 minutes!           ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════╝${NC}"
echo ""

# Check if Hardhat is already running
HARDHAT_RUNNING=0
if nc -z localhost 8545 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Hardhat node already running on port 8545"
    HARDHAT_RUNNING=1
else
    echo -e "${YELLOW}➜${NC} Starting Hardhat node..."
    pnpm hardhat:chain > /dev/null 2>&1 &
    HARDHAT_PID=$!
    echo -e "${GREEN}✓${NC} Hardhat node started (PID: $HARDHAT_PID)"

    # Wait for Hardhat to be ready
    echo -e "${YELLOW}➜${NC} Waiting for Hardhat to be ready..."
    for i in {1..30}; do
        if nc -z localhost 8545 2>/dev/null; then
            echo -e "${GREEN}✓${NC} Hardhat node is ready!"
            break
        fi
        sleep 1
        if [ $i -eq 30 ]; then
            echo -e "${YELLOW}⚠${NC}  Hardhat is taking longer than expected..."
        fi
    done
fi

# Deploy contracts
echo -e "${YELLOW}➜${NC} Deploying contracts..."
pnpm deploy:localhost > /dev/null 2>&1
echo -e "${GREEN}✓${NC} Contracts deployed successfully"

# Choose framework
echo ""
echo -e "${BLUE}Which example would you like to run?${NC}"
echo "  1) React/Next.js (http://localhost:3000)"
echo "  2) Vue 3         (http://localhost:3001)"
echo "  3) Node.js CLI   (interactive terminal)"
echo ""
read -p "Enter your choice (1-3): " choice

echo ""
case $choice in
    1)
        echo -e "${GREEN}🚀 Starting React/Next.js example...${NC}"
        echo ""
        echo -e "${YELLOW}📝 Setup MetaMask:${NC}"
        echo "   • Network: Hardhat Local"
        echo "   • RPC URL: http://127.0.0.1:8545"
        echo "   • Chain ID: 31337"
        echo "   • Import test account: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
        echo ""
        echo -e "${GREEN}Opening React app at http://localhost:3000${NC}"
        echo ""
        pnpm start
        ;;
    2)
        echo -e "${GREEN}🚀 Starting Vue 3 example...${NC}"
        echo ""
        # Auto-create .env if it doesn't exist
        if [ ! -f packages/vue-example/.env ]; then
            cp packages/vue-example/.env.example packages/vue-example/.env
            echo -e "${GREEN}✓${NC} Created .env file with defaults"
        fi
        echo -e "${YELLOW}📝 Setup MetaMask:${NC}"
        echo "   • Network: Hardhat Local"
        echo "   • RPC URL: http://localhost:8545"
        echo "   • Chain ID: 31337"
        echo "   • Import test account: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
        echo ""
        echo -e "${GREEN}Opening Vue app at http://localhost:3001${NC}"
        echo ""
        pnpm start:vue
        ;;
    3)
        echo -e "${GREEN}🚀 Starting Node.js CLI example...${NC}"
        echo ""
        # Auto-create .env if it doesn't exist
        if [ ! -f packages/nodejs-example/.env ]; then
            cp packages/nodejs-example/.env.example packages/nodejs-example/.env
            echo -e "${GREEN}✓${NC} Created .env file with defaults"
        fi
        echo -e "${YELLOW}ℹ${NC}  This is a CLI application - no browser needed!"
        echo ""
        pnpm start:nodejs
        ;;
    *)
        echo -e "${YELLOW}Invalid choice. Please run again and choose 1, 2, or 3.${NC}"
        exit 1
        ;;
esac

# Cleanup on exit
if [ $HARDHAT_RUNNING -eq 0 ]; then
    trap "kill $HARDHAT_PID 2>/dev/null" EXIT
fi
