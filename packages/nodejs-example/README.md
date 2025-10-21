# FHEVM SDK Node.js Example

A complete Node.js CLI application demonstrating framework-agnostic usage of the FHEVM SDK with the FHECounter smart contract.

## Overview

This example showcases how the FHEVM SDK works in a pure Node.js environment without any framework dependencies (no React, no Vue). It demonstrates the core concepts of Fully Homomorphic Encryption (FHE) in blockchain applications:

- **Client-side Encryption**: Encrypt sensitive data before sending to blockchain
- **Encrypted Operations**: Perform calculations on encrypted data (increment/decrement)
- **Secure Decryption**: Decrypt results using EIP-712 signatures
- **Mock Chain Support**: Works with Hardhat local node (no browser required)

### What You'll Learn

1. How to create framework-agnostic FHEVM config
2. How to initialize FHEVM instance for mock chains (Hardhat)
3. How to encrypt values using core SDK actions
4. How to interact with encrypted smart contracts
5. How to decrypt encrypted state with user signatures
6. How FHEVM SDK works without React hooks or Vue composables

## Prerequisites

Before running this example, ensure you have:

### 1. Node.js Environment
- Node.js >= 20.0.0
- pnpm (recommended) or npm

### 2. Hardhat Node Running
The FHECounter contract must be deployed to a running Hardhat node with FHEVM support.

```bash
# In the project root
cd packages/hardhat

# Start Hardhat node (in separate terminal)
pnpm hardhat node

# Deploy FHECounter contract (in another terminal)
pnpm hardhat run scripts/deploy.ts --network localhost
```

The deployment script will output the contract address. You'll need this for the `.env` file.

### 3. Environment Configuration
You need:
- **RPC URL**: Hardhat node URL (default: `http://localhost:8545`)
- **Private Key**: A private key with ETH on Hardhat network (use one of Hardhat's default accounts)
- **Contract Address**: Deployed FHECounter contract address

See [Configuration](#configuration) section for details.

## Installation

From the `packages/nodejs-example` directory:

```bash
# Install dependencies
pnpm install

# Or using npm
npm install
```

## Configuration

Create a `.env` file in the `packages/nodejs-example` directory:

```bash
# Copy example file
cp .env.example .env

# Edit with your values
nano .env
```

### Environment Variables

```env
# Hardhat Node RPC URL
RPC_URL=http://localhost:8545

# Private key (use one of Hardhat's default test accounts)
# Example: Account #0 from Hardhat node startup
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# FHECounter contract address (from deployment)
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### Getting Hardhat Test Accounts

When you start Hardhat node (`pnpm hardhat node`), it displays 20 pre-funded accounts:

```
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

...
```

Use any of these private keys for testing.

## ⚡ Quick Start (1 Command)

**Get running in under 1 minute:**

```bash
# From repository root
pnpm quick-start:nodejs
```

That's it! The script will:
- ✓ Start Hardhat node
- ✓ Deploy contracts
- ✓ Create .env file with defaults
- ✓ Launch interactive CLI

No browser needed - pure Node.js! 🚀

<details>
<summary>📖 Manual Setup</summary>

## Running the Example

### Option 1: From Repository Root (Recommended)

```bash
# Start the CLI
pnpm start:nodejs

# Or build first
pnpm nodejs:build
node packages/nodejs-example/dist/index.js
```

### Option 2: From Package Directory

```bash
# Navigate to the package
cd packages/nodejs-example

# Using tsx (development)
pnpm start

# Or using built version
pnpm build
node dist/index.js
```

### Available Commands

| Command | Location | Description |
|---------|----------|-------------|
| `pnpm start:nodejs` | Root | Run Node.js example from repository root |
| `pnpm nodejs:build` | Root | Build Node.js example from repository root |
| `pnpm nodejs:dev` | Root | Run in watch mode from repository root |
| `pnpm start` | Package | Run from `packages/nodejs-example` |
| `pnpm build` | Package | Build from `packages/nodejs-example` |
| `pnpm dev` | Package | Watch mode from `packages/nodejs-example` |

</details>

### CLI Menu

Once running, you'll see:

```
=== FHEVM SDK Node.js Example ===

1. Creating FHEVM Configuration...
   Chain ID: 31337 (Hardhat Local)
   RPC URL: http://localhost:8545
   Config created successfully

2. Creating FHEVM Instance...
   Instance created successfully

3. Connecting to Blockchain...
   Connected as: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

4. Loading FHECounter Contract...
   Contract loaded successfully

=== FHECounter Menu ===
1. View counter value
2. Increment counter
3. Decrement counter
4. Exit

Choose an option (1-4):
```

### Example Session

```bash
Choose an option (1-4): 1
Fetching counter value...
Encrypted handle: 0x0000000000000000000000000000000000000000000000000000000000000000
Counter is uninitialized (zero handle)
Current counter value: 0

Choose an option (1-4): 2
Enter value to increment by: 42
Incrementing counter by 42...
Encrypting value...
Encryption complete. Handles: 1, Proof length: 438 bytes
Sending transaction...
Transaction hash: 0x1234...
Transaction confirmed in block 2
Counter incremented by 42!

Choose an option (1-4): 1
Fetching counter value...
Encrypted handle: 0xabcd1234...
Decrypting handle...
Decrypted value: 42
Current counter value: 42

Choose an option (1-4): 3
Enter value to decrement by: 10
Decrementing counter by 10...
Encrypting value...
Transaction confirmed in block 3
Counter decremented by 10!

Choose an option (1-4): 1
Current counter value: 32

Choose an option (1-4): 4
Exiting...
Goodbye!
```

## Code Walkthrough

### Architecture Overview

```
src/index.ts
├── Configuration (Lines 1-82)
│   ├── Environment variables
│   ├── Chain configuration
│   └── Contract ABI
│
├── Initialization (Lines 120-189)
│   ├── createFhevmConfig() - Framework-agnostic config
│   ├── createInstance() - FHEVM instance for mock chain
│   ├── Ethers.js setup - Provider, wallet, contract
│   └── Validation - Check contract is deployed
│
├── FHEVM Operations (Lines 194-345)
│   ├── getCounterValue() - Read & decrypt counter
│   │   ├── contract.getCount() → handle
│   │   └── decrypt(config, { requests }) → plaintext
│   │
│   ├── incrementCounter() - Encrypt & increment
│   │   ├── encrypt(config, { values }) → encrypted
│   │   ├── buildParamsFromAbi() → contract params
│   │   └── contract.increment(...params) → tx
│   │
│   └── decrementCounter() - Encrypt & decrement
│       └── (Same pattern as increment)
│
└── CLI Interface (Lines 350-450)
    └── Interactive menu loop
```

### Key FHEVM Concepts

#### 1. Framework-Agnostic Config

```typescript
import { createFhevmConfig, noopStorage } from '@fhevm-sdk/core'

const config = createFhevmConfig({
  chains: [31337] as const,          // Hardhat local
  mockChains: { 31337: RPC_URL },    // Mock chain RPC
  storage: noopStorage,               // No persistence needed
  ssr: false,
  autoConnect: false,
})
```

**Why this matters**: This config has ZERO framework dependencies. It works in:
- Node.js (this example)
- React (via hooks wrapper)
- Vue (via composables wrapper)
- Vanilla JavaScript in browser

#### 2. Mock Chain Instance

```typescript
import { createInstance } from '@fhevm-sdk/core'

const instance = await createInstance(config, {
  provider: RPC_URL,
  chainId: CHAIN_ID,
})
```

**What happens**:
1. SDK detects chainId 31337 is in `mockChains`
2. Connects to Hardhat node via RPC
3. Fetches FHEVM metadata (`fhevm_relayer_metadata` RPC call)
4. Creates mock instance (works in Node.js, no browser required)

**Production chains** (Sepolia testnet, mainnet):
- Require browser environment (`window.relayerSDK`)
- Fetch public keys from blockchain
- Use full relayer SDK (heavier bundle)

#### 3. Encrypting Values

```typescript
import { encrypt } from '@fhevm-sdk/core'

const encrypted = await encrypt(config, {
  instance,
  contractAddress: '0xYourContract...',
  userAddress: '0xYourAddress...',
  values: [
    { type: 'euint32', value: 42 }
  ]
})

// Result: { handles: Uint8Array[], inputProof: Uint8Array }
```

**FHEVM Type System**:
- `ebool`: Encrypted boolean
- `euint8`, `euint16`, `euint32`, `euint64`: Encrypted unsigned integers
- `euint128`, `euint256`: Large encrypted integers
- `eaddress`: Encrypted Ethereum address

**Result Structure**:
- `handles[]`: Encrypted values (ciphertext)
- `inputProof`: Zero-knowledge proof for contract verification

#### 4. Contract Calls

```typescript
import { buildParamsFromAbi } from '@fhevm-sdk/core'

// Build parameters from encryption result
const params = buildParamsFromAbi(
  encrypted,
  contractAbi,
  'increment'
)

// Call contract with encrypted parameters
await contract.increment(...params)
```

**What buildParamsFromAbi does**:
1. Finds function in ABI (`increment`)
2. Maps encryption result to ABI parameter types:
   - Parameter 0: `encrypted.handles[0]` (encrypted value)
   - Parameter 1: `encrypted.inputProof` (ZK proof)
3. Converts types (Uint8Array → hex string, BigInt, etc.)

#### 5. Decrypting Results

```typescript
import { decrypt } from '@fhevm-sdk/core'

const results = await decrypt(config, {
  instance,
  requests: [
    { handle: '0xabcd1234...', contractAddress: '0xContract...' }
  ],
  signer: wallet,
  storage: config.storage,
  chainId: CHAIN_ID,
})

// Result: { '0xabcd1234...': 42n }
```

**Security Model**:
- User signs EIP-712 message authorizing decryption
- Signature is scoped to specific contract addresses
- Signature cached for 7 days (in browser with localStorage)
- In this CLI, we use `noopStorage` (no caching)

**Handle Format**:
- 0x-prefixed hex string
- 66 characters (0x + 64 hex chars)
- Obtained from contract method return values

### Handle Type Handling

The Node.js example includes robust handle type conversion to support different return types from contracts:

```typescript
// Contracts may return handles as either bigint or string
let handleHex: `0x${string}`
if (typeof handle === 'bigint') {
  handleHex = `0x${handle.toString(16).padStart(64, '0')}`
} else if (typeof handle === 'string') {
  handleHex = handle.startsWith('0x') ? handle : `0x${handle}`
}
```

**Why this matters:**
- Hardhat local node may return handles as bigint
- Some RPC providers return handles as hex strings
- The SDK expects handles as `0x`-prefixed hex strings

This flexibility ensures compatibility across different providers and contract configurations

### FHEVM SDK Pattern: Wagmi-Inspired

The SDK follows Wagmi's action pattern for consistency:

```typescript
// Pattern: (config, parameters) => Promise<Result>

// Create instance
const instance = await createInstance(config, {
  provider: RPC_URL,
  chainId: CHAIN_ID,
})

// Encrypt values
const encrypted = await encrypt(config, {
  instance,
  contractAddress,
  userAddress,
  values: [{ type: 'euint32', value: 42 }],
})

// Decrypt handles
const decrypted = await decrypt(config, {
  instance,
  requests: [{ handle, contractAddress }],
  signer,
  storage: config.storage,
})
```

**Benefits**:
- Consistent API across all actions
- Framework-agnostic (works anywhere)
- Tree-shakeable (import only what you use)
- Type-safe (full TypeScript inference)

## Known Issues & Workarounds

### SDK Import Path

**Current Implementation:**

This example currently uses a relative path import as a workaround:

```typescript
import { createFhevmConfig, createInstance, encrypt, decrypt, ... } from '../../fhevm-sdk/dist/exports/index.js'
```

**Why:** Due to workspace resolution issues with Node.js and the FHEVM SDK build output.

**In Your Own Project:** Once published, you'll use standard imports:

```typescript
import { createFhevmConfig, createInstance, encrypt, decrypt } from '@fhevm-sdk/core'
```

**If you encounter import errors:**
1. Ensure SDK is built: `pnpm sdk:build` from repository root
2. Verify `packages/fhevm-sdk/dist/exports/index.js` exists
3. Use the relative path workaround shown in this example

## Troubleshooting

### Error: "PRIVATE_KEY not found in environment"

**Solution**: Create a `.env` file with your private key.

```bash
cp .env.example .env
# Edit .env with your private key
```

### Error: "CONTRACT_ADDRESS not found in environment"

**Solution**: Deploy FHECounter contract first.

```bash
cd packages/hardhat
pnpm hardhat run scripts/deploy.ts --network localhost
# Copy contract address to .env
```

### Error: "No contract deployed at 0x..."

**Causes**:
1. Contract not deployed
2. Wrong contract address in `.env`
3. Hardhat node restarted (state lost)

**Solution**: Redeploy contract and update `.env`.

### Error: "Chain 31337 is not configured"

**Cause**: FHEVM SDK not configured for Hardhat chain.

**Solution**: Ensure `mockChains` is set in config:

```typescript
const config = createFhevmConfig({
  chains: [31337],
  mockChains: { 31337: RPC_URL },
})
```

### Error: "The URL http://localhost:8545 is not reachable"

**Cause**: Hardhat node not running.

**Solution**: Start Hardhat node:

```bash
cd packages/hardhat
pnpm hardhat node
```

### Error: "SIGNATURE_ERROR: Failed to create decryption signature"

**Cause**: Wallet signing failed.

**Possible Reasons**:
1. Wrong private key
2. Account has no ETH
3. Network mismatch

**Solution**: Verify private key and ensure Hardhat node is running.

## Extending This Example

### Add More Contract Methods

1. Add ABI definitions to `FHE_COUNTER_ABI`
2. Create function following existing patterns
3. Add menu option in CLI

Example: Add `reset()` method:

```typescript
// Add to ABI
{
  type: 'function',
  name: 'reset',
  inputs: [],
  outputs: [],
  stateMutability: 'nonpayable',
}

// Add function
async function resetCounter(): Promise<void> {
  const { contract } = appState!
  const tx = await contract.reset()
  await tx.wait()
  console.log('Counter reset!')
}

// Add menu option
case '5': {
  await resetCounter()
  break
}
```

### Support Multiple Contracts

Extend `AppState` to hold multiple contracts:

```typescript
interface AppState {
  config: FhevmConfig
  instance: FhevmInstance
  contracts: {
    counter: Contract
    token: Contract
    // ...
  }
}
```

### Batch Operations

Encrypt multiple values in one transaction:

```typescript
const encrypted = await encrypt(config, {
  instance,
  contractAddress,
  userAddress,
  values: [
    { type: 'euint32', value: 10 },
    { type: 'euint32', value: 20 },
    { type: 'ebool', value: true },
  ],
})

// All values encrypted with single proof
await contract.batchOperation(
  encrypted.handles[0],
  encrypted.handles[1],
  encrypted.handles[2],
  encrypted.inputProof
)
```

### Add Production Chain Support

To support production chains (Sepolia testnet):

```typescript
const config = createFhevmConfig({
  chains: [11155111], // Sepolia
  storage: createStorage({
    storage: /* custom Node.js storage */
  }),
})

// Note: Production chains require browser environment
// For Node.js, continue using mock chains
```

## Comparison: Node.js vs React vs Vue

### This Example (Node.js - Pure Actions)

```typescript
import { createInstance, encrypt, decrypt } from '@fhevm-sdk/core'

const instance = await createInstance(config, { provider })
const encrypted = await encrypt(config, { instance, ... })
const decrypted = await decrypt(config, { instance, ... })
```

### React (Hooks Wrapper)

```typescript
import { useFhevmInstance, useEncrypt, useDecrypt } from '@fhevm-sdk/react'

const { instance } = useFhevmInstance({ provider })
const { encrypt } = useEncrypt({ instance })
const { decrypt } = useDecrypt({ instance })
```

### Vue (Composables Wrapper)

```typescript
import { useFhevmInstance, useEncrypt, useDecrypt } from '@fhevm-sdk/vue'

const { instance } = useFhevmInstance({ provider })
const { encrypt } = useEncrypt({ instance })
const { decrypt } = useDecrypt({ instance })
```

**Key Insight**: React and Vue wrappers call the SAME core actions this example uses. They just add:
- Reactive state management
- Component lifecycle integration
- Framework-specific patterns

The core FHEVM logic is framework-agnostic, as demonstrated in this Node.js example.

## What This Example Teaches

1. **Framework-Agnostic SDK**: Core actions work without React/Vue
2. **Mock Chain Support**: FHEVM works in Node.js with Hardhat
3. **Encryption Flow**: Client-side encryption before blockchain submission
4. **Decryption Security**: EIP-712 signatures for user authorization
5. **Wagmi-Style API**: Consistent (config, params) => Promise pattern
6. **Type Safety**: Full TypeScript support without frameworks

## Next Steps

- Explore React example in `packages/nextjs`
- Read SDK documentation at `packages/fhevm-sdk/README.md`
- Review Wagmi patterns in `Reference-Code/wagmi/`
- Build your own FHEVM application

## Resources

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [FHEVM Hardhat Template](https://github.com/zama-ai/fhevm-hardhat-template)
- [Ethers.js Documentation](https://docs.ethers.org/v6/)
- [Wagmi Architecture](https://wagmi.sh/core/getting-started)

## License

MIT
