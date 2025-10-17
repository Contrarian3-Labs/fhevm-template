# FHEVM Vue 3 Example

A complete Vue 3 example demonstrating the FHEVM SDK with the FHE Counter smart contract. This example showcases how to build fully homomorphic encryption (FHE) powered dApps using Vue 3's Composition API.

## Features

- **Full FHEVM Integration**: Uses `@fhevm-sdk/vue` composables
- **Encrypted Counter**: Increment/decrement operations on encrypted data
- **Client-Side Encryption**: All encryption happens in the browser
- **Decryption Requests**: Request permission to decrypt values
- **Vue 3 Composition API**: Modern Vue patterns with `<script setup>`
- **TypeScript**: Fully typed for better DX
- **Responsive UI**: Clean, modern interface

## What This Example Demonstrates

### FHEVM Concepts

1. **FHEVM Instance Creation**: Initialize the FHEVM SDK with provider
2. **Input Encryption**: Encrypt values before sending to contract
3. **Encrypted Computation**: Contract operates on encrypted data
4. **Decryption Requests**: Request and cache decryption permissions
5. **Storage Management**: Persist decryption signatures locally

### Vue 3 Patterns

1. **Plugin Setup**: Install FHEVM plugin in `main.ts`
2. **Composables**: Use `useFhevmInstance()`, `useEncrypt()`, `useDecrypt()`
3. **Reactive State**: Leverage Vue's reactivity system
4. **Component Communication**: Props and composables
5. **Lifecycle Hooks**: `onMounted()`, `watch()`

## Quick Start

**Get running in 5 minutes!**

1. **Start Hardhat Node:**
   ```bash
   # Terminal 1 - From repository root
   cd packages/hardhat
   pnpm run node
   ```

2. **Deploy Contracts:**
   ```bash
   # Terminal 2 - From repository root
   pnpm deploy:localhost
   ```

3. **Configure Environment:**
   ```bash
   cd packages/vue-example
   cp .env.example .env
   # Edit .env with contract address from deployment output
   ```

4. **Start Vue App:**
   ```bash
   # From repository root
   pnpm start:vue
   ```

5. **Setup MetaMask:**
   - Add Hardhat network (RPC: `http://localhost:8545`, Chain ID: `31337`)
   - Import a test account from Hardhat node output
   - Connect wallet and start encrypting!

The app will start at **http://localhost:3001**

📖 **Detailed instructions below** →

## Prerequisites

### Required Software

- **Node.js**: v20 or higher
- **pnpm**: Package manager (or npm/yarn)
- **MetaMask**: Browser wallet extension
- **Hardhat**: Local blockchain with FHEVM contracts

### Running the Hardhat Node

Before starting the Vue app, you need a local FHEVM-enabled blockchain:

```bash
# From the repository root
cd packages/hardhat

# Start Hardhat node with FHEVM
pnpm run node

# In another terminal, deploy contracts
pnpm run deploy
```

This will:
- Start a local blockchain at `http://localhost:8545`
- Deploy the `FHECounter` contract
- Output the contract address (save this for `.env`)

## Installation

```bash
# Navigate to Vue example
cd packages/vue-example

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env

# Edit .env with your contract address
# VITE_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

## Configuration

### Environment Variables

Create a `.env` file in `packages/vue-example/`:

```env
# Contract address from Hardhat deployment
VITE_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3

# RPC URL (defaults to Hardhat)
VITE_RPC_URL=http://localhost:8545

# Chain ID (31337 = Hardhat)
VITE_CHAIN_ID=31337
```

### MetaMask Setup

1. **Add Hardhat Network**:
   - Network Name: `Hardhat Local`
   - RPC URL: `http://localhost:8545`
   - Chain ID: `31337`
   - Currency: `ETH`

2. **Import Test Account**:
   - Use one of Hardhat's default accounts
   - Private key from `pnpm run node` output

## Running the Example

### Option 1: From Repository Root (Recommended)

```bash
# Start development server
pnpm start:vue

# Or use the alias
pnpm vue:dev
```

### Option 2: From Package Directory

```bash
# Navigate to the package
cd packages/vue-example

# Start development server
pnpm dev
```

### Available Commands

| Command | Location | Description |
|---------|----------|-------------|
| `pnpm start:vue` | Root | Run Vue example from repository root |
| `pnpm vue:dev` | Root | Alternative command from repository root |
| `pnpm vue:build` | Root | Build Vue example from repository root |
| `pnpm vue:preview` | Root | Preview production build from root |
| `pnpm dev` | Package | Run from `packages/vue-example` |
| `pnpm build` | Package | Build from `packages/vue-example` |
| `pnpm preview` | Package | Preview from `packages/vue-example` |

The app will start at: **http://localhost:3001**

### What Happens Next

The app will:
1. Connect to your MetaMask wallet
2. Initialize the FHEVM instance
3. Load the encrypted counter from the contract
4. Allow you to increment/decrement with encrypted values
5. Decrypt the counter value on request

## Usage

### 1. Connect Wallet

Click "Connect Wallet" and approve MetaMask connection.

### 2. Increment Counter

- Enter a value (e.g., `5`)
- Click "Increment"
- Approve the transaction in MetaMask
- Wait for confirmation

The value is encrypted client-side before being sent to the contract.

### 3. Decrement Counter

- Enter a value
- Click "Decrement"
- Approve transaction

### 4. Decrypt Value

- Click "Decrypt"
- Approve decryption permission in MetaMask
- The plaintext value is revealed

**Note**: Decryption signatures are cached, so subsequent decryptions of the same handle won't require wallet signatures.

## Architecture

### File Structure

```
packages/vue-example/
├── src/
│   ├── main.ts                    # App entry, FHEVM plugin setup
│   ├── App.vue                    # Root component, wallet connection
│   ├── style.css                  # Global styles
│   ├── components/
│   │   └── FHECounter.vue         # Counter UI component
│   ├── composables/
│   │   └── useFHECounter.ts       # Counter logic composable
│   └── contracts/
│       └── FHECounter.json        # Contract ABI
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

### Code Flow

```
main.ts
  ↓ Creates FHEVM config
  ↓ Installs FhevmPlugin
  ↓
App.vue
  ↓ Wallet connection
  ↓ Passes provider to FHECounter
  ↓
FHECounter.vue
  ↓ Uses useFHECounter composable
  ↓ Renders UI
  ↓
useFHECounter.ts
  ↓ useFhevmInstance() - Creates FHEVM instance
  ↓ useEncrypt() - Encrypts inputs
  ↓ useDecrypt() - Decrypts handles
  ↓ Contract interactions via ethers.js
```

## Key Concepts

### 1. FHEVM Plugin Setup

In `main.ts`, we create a config and install the plugin:

```typescript
import { createFhevmConfig, FhevmPlugin } from '@fhevm-sdk/vue'

const fhevmConfig = createFhevmConfig({
  chains: [31337],
  mockChains: { 31337: 'http://localhost:8545' },
  ssr: false
})

app.use(FhevmPlugin, { config: fhevmConfig })
```

This makes FHEVM available to all components via `useConfig()`.

### 2. Instance Creation

The `useFhevmInstance()` composable creates an FHEVM instance:

```typescript
const { instance, isLoading, error } = useFhevmInstance({
  provider: window.ethereum,
  chainId: 31337
})
```

This instance is required for all encryption/decryption operations.

### 3. Encryption

Before sending values to the contract, encrypt them:

```typescript
const { encrypt } = useEncrypt()

const encrypted = await encrypt({
  instance: instance.value,
  contractAddress: '0x...',
  userAddress: '0x...',
  values: [{ type: 'euint32', value: 42 }]
})

// encrypted.handles[0] - The encrypted handle
// encrypted.inputProof - ZK proof of correct encryption
```

### 4. Decryption

To decrypt a ciphertext handle:

```typescript
const { decrypt, data } = useDecrypt()

await decrypt({
  instance: instance.value,
  requests: [{ handle: '0x...', contractAddress: '0x...' }],
  signer: ethersSigner,
  storage: config.storage
})

// data.value['0x...'] contains the decrypted bigint
```

### 5. Contract Interaction

Use ethers.js for contract calls:

```typescript
const contract = new Contract(address, abi, signer)

// Send encrypted value and proof
const tx = await contract.increment(
  encrypted.handles[0],
  encrypted.inputProof
)

await tx.wait()
```

## Comparison with React

| Aspect | Vue 3 | React |
|--------|-------|-------|
| **State** | `ref()`, `computed()` | `useState()`, `useMemo()` |
| **Effects** | `watch()`, `watchEffect()` | `useEffect()` |
| **Instance** | `useFhevmInstance()` | `useFhevmInstance()` |
| **Encryption** | `useEncrypt()` | `useEncrypt()` |
| **Decryption** | `useDecrypt()` | `useDecrypt()` |
| **Config** | Plugin with `provide/inject` | Context Provider |
| **Template** | `<template>` with directives | JSX |
| **Reactivity** | Automatic (Proxy-based) | Manual (immutability) |

### Example: React vs Vue

**React:**
```tsx
const { instance } = useFhevmInstance({ provider })
const { encrypt } = useEncrypt()

const [value, setValue] = useState(1)

const handleEncrypt = async () => {
  const result = await encrypt({ instance, values: [...] })
}

return <button onClick={handleEncrypt}>Encrypt</button>
```

**Vue:**
```vue
<script setup>
const { instance } = useFhevmInstance({ provider })
const { encrypt } = useEncrypt()

const value = ref(1)

const handleEncrypt = async () => {
  const result = await encrypt({ instance: instance.value, values: [...] })
}
</script>

<template>
  <button @click="handleEncrypt">Encrypt</button>
</template>
```

## Extending This Example

### Add New Operations

1. **Create new composable**:
```typescript
// composables/useMyFeature.ts
export function useMyFeature() {
  const { instance } = useFhevmInstance({ provider })
  const { encrypt } = useEncrypt()

  const myAction = async () => {
    // Your logic
  }

  return { myAction }
}
```

2. **Use in component**:
```vue
<script setup>
import { useMyFeature } from '@/composables/useMyFeature'

const { myAction } = useMyFeature()
</script>
```

### Connect to Different Contracts

1. **Add contract ABI to `src/contracts/`**
2. **Create new composable**:
```typescript
export function useMyContract(contractAddress: string) {
  const { instance } = useFhevmInstance({ provider })

  const contract = new Contract(contractAddress, ABI, signer)

  // Add methods
}
```

### Use with Nuxt 3

For Nuxt 3 (Vue SSR), follow these guidelines:

1. **Install FHEVM plugin in client-only plugin**:
```typescript
// plugins/fhevm.client.ts
export default defineNuxtPlugin((nuxtApp) => {
  const fhevmConfig = createFhevmConfig({
    chains: [31337],
    mockChains: { 31337: 'http://localhost:8545' },
    ssr: false
  })

  nuxtApp.vueApp.use(FhevmPlugin, { config: fhevmConfig })
})
```

2. **Use `<ClientOnly>` wrapper**:
```vue
<template>
  <ClientOnly>
    <FHECounter :provider="provider" />
  </ClientOnly>
</template>
```

3. **Initialize in `onMounted()`**:
```vue
<script setup>
import { onMounted } from 'vue'

const provider = ref()

onMounted(() => {
  provider.value = window.ethereum
})
</script>
```

## Troubleshooting

### Issue: "MetaMask not found"

**Solution**: Install MetaMask browser extension and refresh the page.

### Issue: "Cannot connect to network"

**Solution**:
1. Ensure Hardhat node is running (`pnpm run node` in `packages/hardhat`)
2. Check MetaMask is connected to Hardhat network (Chain ID 31337)
3. Verify RPC URL in `.env` is correct

### Issue: "Contract not deployed"

**Solution**:
1. Deploy contracts: `pnpm run deploy` in `packages/hardhat`
2. Copy contract address to `.env` as `VITE_CONTRACT_ADDRESS`
3. Restart Vite dev server

### Issue: "Transaction failed"

**Solution**:
- Ensure you have ETH in your account (Hardhat provides test accounts)
- Check gas settings in MetaMask
- Verify contract address is correct
- Look for errors in browser console

### Issue: "Decryption fails"

**Solution**:
- Ensure you've read the count handle first
- Check that the handle is not zero
- Verify storage is working (check browser IndexedDB)
- Try clearing cache and reconnecting wallet

### Issue: "FHEVM instance not loading"

**Solution**:
1. Check browser console for errors
2. Verify provider is passed correctly
3. Ensure `mockChains` config matches your RPC URL
4. Try refreshing the page

### Issue: "Module not found: @fhevm-sdk/vue"

**Solution**:
```bash
# From repository root
pnpm install

# Rebuild FHEVM SDK
cd packages/fhevm-sdk
pnpm run build

# Return to Vue example
cd ../vue-example
pnpm run dev
```

## Testing

```bash
# Type checking
pnpm run type-check

# Build for production
pnpm run build

# Preview production build
pnpm run preview
```

## Production Considerations

When deploying to a real network:

1. **Remove Mock Chains**:
```typescript
const fhevmConfig = createFhevmConfig({
  chains: [8009], // Real FHEVM chain
  // No mockChains!
})
```

2. **Add Real Gateway**:
The SDK will automatically use the FHEVM gateway for decryption.

3. **Update RPC URL**:
Point to a real FHEVM RPC endpoint.

4. **Environment Variables**:
Use environment-specific `.env` files:
- `.env.development`
- `.env.production`

5. **Error Handling**:
Add comprehensive error handling for production:
```typescript
try {
  await incrementCounter(value)
} catch (error) {
  if (error.code === 4001) {
    // User rejected transaction
  } else if (error.code === -32603) {
    // Internal JSON-RPC error
  } else {
    // Other errors
  }
}
```

## Resources

### Documentation

- [FHEVM SDK Docs](https://docs.zama.ai/fhevm)
- [Vue 3 Docs](https://vuejs.org/)
- [Vite Docs](https://vitejs.dev/)
- [Ethers.js Docs](https://docs.ethers.org/)

### Example Code

- React Example: `packages/nextjs/`
- FHEVM SDK Source: `packages/fhevm-sdk/`
- Contract Source: `packages/hardhat/contracts/`

### Community

- [Zama Discord](https://discord.gg/zama)
- [Vue Discord](https://discord.com/invite/vue)

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or PR.

---

**Built with Vue 3, Vite, and FHEVM SDK**
