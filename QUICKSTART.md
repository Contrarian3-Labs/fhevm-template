# Quick Start Guide

Get up and running with FHEVM in **less than 3 minutes**! 🚀

## Prerequisites

- **Node.js** v20 or higher
- **pnpm** package manager
- **MetaMask** browser extension (for React/Vue examples)

## One-Command Setup

Choose your framework and run a single command:

### Interactive Mode (Choose Your Framework)

```bash
pnpm install
pnpm quick-start
```

That's it! The script will:
1. ✓ Start Hardhat node automatically
2. ✓ Deploy contracts
3. ✓ Generate type-safe contract interfaces
4. ✓ Ask which example you want to run
5. ✓ Launch your chosen example

### Direct Framework Launch

Or jump straight to your preferred framework:

#### React/Next.js Example

```bash
pnpm install
pnpm quick-start:react
```

**Opens**: http://localhost:3000

#### Vue 3 Example

```bash
pnpm install
pnpm quick-start:vue
```

**Opens**: http://localhost:3001

#### Node.js CLI Example

```bash
pnpm install
pnpm quick-start:nodejs
```

**Runs**: Interactive terminal application (no browser needed)

## MetaMask Setup (React & Vue Only)

After the app starts, configure MetaMask once:

1. **Open MetaMask** extension
2. **Add Network**:
   - **Network Name**: Hardhat Local
   - **RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency Symbol**: `ETH`
3. **Import Test Account** (optional):
   - Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - This is Hardhat's default Account #0 with 10,000 ETH

## What's Included

Each example demonstrates:

- ✅ **Encrypted Counter**: Increment/decrement operations on encrypted data
- ✅ **Client-Side Encryption**: Encrypt values before sending to blockchain
- ✅ **Secure Decryption**: Decrypt results using EIP-712 signatures
- ✅ **Signature Caching**: Sign once, decrypt multiple times (7-day validity)
- ✅ **Type-Safe Contracts**: Auto-generated TypeScript interfaces

## Line Count Comparison

**Traditional Setup**: ~20 steps across multiple terminals

```bash
# Terminal 1
cd packages/hardhat
pnpm run node

# Terminal 2
pnpm deploy:localhost

# Terminal 3
cd packages/vue-example
cp .env.example .env
nano .env  # Manual editing
pnpm dev

# Browser
# Manual MetaMask configuration
```

**Quick Start**: **2 commands** ✨

```bash
pnpm install
pnpm quick-start
```

**Reduction**: **90% fewer steps!**

## Troubleshooting

### Port Already in Use

If Hardhat fails to start on port 8545:

```bash
# Find and kill the process
lsof -ti:8545 | xargs kill -9

# Or use a different port (edit .env files)
```

### MetaMask Nonce Issues

After restarting Hardhat:

1. Open MetaMask
2. Go to **Settings** → **Advanced**
3. Click **"Clear Activity Tab"**
4. Restart your browser

### Contract Not Found

If you see "Contract not deployed" errors:

```bash
# Redeploy contracts
pnpm deploy:localhost

# Restart your example
pnpm quick-start
```

## Next Steps

- **Explore the Code**: Check out `packages/*/src/` for implementation details
- **Read the Docs**: See full README.md in each example package
- **Build Your dApp**: Copy and customize the examples for your use case
- **Join the Community**: [FHEVM Discord](https://discord.com/invite/zama)

## Manual Setup (Advanced)

For fine-grained control over each step, see:
- [Full Setup Guide](README.md)
- [React Example README](packages/nextjs/README.md)
- [Vue Example README](packages/vue-example/README.md)
- [Node.js Example README](packages/nodejs-example/README.md)

## Command Reference

| Command | Description |
|---------|-------------|
| `pnpm quick-start` | Interactive framework selection |
| `pnpm quick-start:react` | Launch React example directly |
| `pnpm quick-start:vue` | Launch Vue example directly |
| `pnpm quick-start:nodejs` | Launch Node.js CLI directly |
| `pnpm chain` | Start Hardhat node only |
| `pnpm deploy:localhost` | Deploy contracts only |
| `pnpm start` | Start React (manual setup) |
| `pnpm start:vue` | Start Vue (manual setup) |
| `pnpm start:nodejs` | Start Node.js CLI (manual setup) |

---

**Ready to build with FHEVM!** 🎉

For more details, see the [full documentation](README.md).
