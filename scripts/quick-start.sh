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
echo -e "${BLUE}║   Deploy contracts & start frontend     ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════╝${NC}"
echo ""

# Check Node.js version
echo -e "${YELLOW}➜${NC} Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
REQUIRED_VERSION=20

if [ "$NODE_VERSION" -lt "$REQUIRED_VERSION" ]; then
    echo -e "${YELLOW}✗${NC} Node.js version $REQUIRED_VERSION or higher required"
    echo -e "${YELLOW}  ${NC} Current version: $(node -v)"
    echo ""
    echo -e "${BLUE}Please upgrade Node.js:${NC}"
    echo "  • Using nvm: ${GREEN}nvm install 20 && nvm use 20${NC}"
    echo "  • Or download from: https://nodejs.org/"
    echo ""
    exit 1
fi
echo -e "${GREEN}✓${NC} Node.js version $(node -v) is compatible"
echo ""

# Check if Hardhat is running (don't start it)
echo -e "${YELLOW}➜${NC} Checking Hardhat node..."
if ! nc -z localhost 8545 2>/dev/null; then
    echo -e "${YELLOW}⚠${NC}  Hardhat node is not running on port 8545"
    echo ""
    echo -e "${BLUE}Please start Hardhat in a separate terminal:${NC}"
    echo -e "${GREEN}  pnpm chain${NC}"
    echo ""
    echo "This allows you to see Hardhat logs (blocks, transactions, gas, etc.)"
    echo ""
    read -p "Press Enter once Hardhat is running..."
    echo ""

    # Wait for Hardhat to be ready (up to 60 seconds)
    echo -e "${YELLOW}➜${NC} Waiting for Hardhat to be ready..."
    READY=0
    for i in {1..60}; do
        if nc -z localhost 8545 2>/dev/null; then
            echo -e "${GREEN}✓${NC} Hardhat node detected!"
            READY=1
            break
        fi
        sleep 1
        if [ $((i % 10)) -eq 0 ]; then
            echo -e "${YELLOW}  ⏳${NC} Still waiting... (${i}s elapsed)"
        fi
    done

    if [ $READY -eq 0 ]; then
        echo -e "${YELLOW}✗${NC} Hardhat still not detected after 60 seconds"
        echo -e "${YELLOW}  ${NC} Please ensure Hardhat is running: pnpm chain"
        exit 1
    fi
else
    echo -e "${GREEN}✓${NC} Hardhat node is running on port 8545"
fi
echo ""

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
