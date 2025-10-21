#!/bin/bash
# Shared script to start Hardhat node
# Used by all quick-start scripts

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Hardhat is already running
if nc -z localhost 8545 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Hardhat node already running on port 8545"
    exit 0
fi

echo -e "${YELLOW}➜${NC} Starting Hardhat node..."

# Start Hardhat in background, save output to log for debugging
pnpm hardhat:chain > /tmp/hardhat-quick-start.log 2>&1 &
HARDHAT_PID=$!
echo -e "${GREEN}✓${NC} Hardhat node starting (PID: $HARDHAT_PID)"

# Wait for Hardhat to be ready (up to 60 seconds)
echo -e "${YELLOW}➜${NC} Waiting for Hardhat to be ready..."
READY=0
for i in {1..60}; do
    if nc -z localhost 8545 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Hardhat node is ready! (took ${i}s)"
        READY=1
        break
    fi
    sleep 1
    # Progress indicator every 10 seconds
    if [ $((i % 10)) -eq 0 ]; then
        echo -e "${YELLOW}  ⏳${NC} Still waiting... (${i}s elapsed)"
    fi
done

# Check if Hardhat actually started
if [ $READY -eq 0 ]; then
    echo -e "${RED}✗${NC} Hardhat failed to start within 60 seconds"
    echo -e "${YELLOW}  ${NC} Check logs: /tmp/hardhat-quick-start.log"
    echo ""
    echo "Last 20 lines of log:"
    tail -20 /tmp/hardhat-quick-start.log
    kill $HARDHAT_PID 2>/dev/null || true
    exit 1
fi
