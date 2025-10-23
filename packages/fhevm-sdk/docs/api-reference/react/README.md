---
description: React hooks for FHEVM operations.
---

# React API

React adapter provides a single powerful hook `useFhevm()` for instance management, plus direct access to actions for encryption/decryption.

## Import Path

```typescript
import { useFhevm } from '@fhevm-sdk/react'
import { encrypt, decrypt } from '@fhevm-sdk/actions'
```

## Hook

- [`useFhevm()`](useFhevm.md) - Manage FHEVM instance lifecycle

## Pattern

The React adapter follows the **hooks + actions** pattern:

1. **`useFhevm()`** - Manages FHEVM instance (reactive state, auto-refresh, abort control)
2. **Actions** - Use `encrypt()` and `decrypt()` from `@fhevm-sdk/actions` directly

This keeps React concerns (state, lifecycle) separate from business logic (encryption, decryption).

## Quick Example

```typescript
import { useFhevm } from '@fhevm-sdk/react'
import { encrypt, decrypt } from '@fhevm-sdk/actions'
import { createFhevmConfig } from '@fhevm-sdk/core'

// 1. Create config (outside component)
const config = createFhevmConfig({
  chains: [31337],
  mockChains: {
    31337: 'http://localhost:8545'
  }
})

// 2. Use in component
function Counter() {
  const { instance, status, error, refresh } = useFhevm({
    provider: window.ethereum,
    chainId: 31337,
    enabled: true
  })

  const handleEncrypt = async () => {
    if (!instance) return

    const encrypted = await encrypt(config, {
      instance,
      contractAddress: '0xContract...',
      userAddress: await signer.getAddress(),
      values: [{ type: 'euint8', value: 1 }]
    })

    // Use encrypted.handles and encrypted.inputProof
  }

  const handleDecrypt = async (handle: string) => {
    if (!instance) return

    const decrypted = await decrypt(config, {
      instance,
      requests: [{ handle, contractAddress: '0xContract...' }],
      signer: await provider.getSigner(),
      storage: config.storage
    })

    console.log(decrypted[handle])
  }

  if (status === 'loading') return <div>Loading FHEVM...</div>
  if (error) return <div>Error: {error.message}</div>
  if (status === 'idle') return <div>Connect wallet first</div>

  return (
    <div>
      <button onClick={handleEncrypt} disabled={status !== 'ready'}>
        Encrypt Value
      </button>
      <button onClick={() => handleDecrypt('0x...')} disabled={status !== 'ready'}>
        Decrypt Value
      </button>
      <button onClick={refresh}>Refresh Instance</button>
    </div>
  )
}
```

## Hook State

`useFhevm()` returns:

```typescript
{
  instance: FhevmInstance | undefined  // FHEVM instance when ready
  status: 'idle' | 'loading' | 'ready' | 'error'  // Instance state
  error: Error | undefined  // Error if creation failed
  refresh: () => void  // Manually refresh instance
}
```

## Status Lifecycle

```
idle → User not connected or enabled=false
  ↓
loading → Creating FHEVM instance
  ↓
ready → Instance created successfully
  ↓
error → Instance creation failed
```

## Why This Pattern?

**Wagmi-inspired separation:**
- **React hook** manages lifecycle and state (what React is good at)
- **Actions** provide framework-agnostic business logic (reusable in Vue, vanilla JS)

**Benefits:**
- Easier testing (actions are pure functions)
- Better code reuse (same encrypt/decrypt in React and Vue)
- Smaller bundle (one instance manager instead of separate hooks)
- Simpler API (one hook to learn, then use actions)

## See Also

- [`useFhevm()`](useFhevm.md) - Full hook documentation
- [`encrypt()`](../actions/encrypt.md) - Encryption action
- [`decrypt()`](../actions/decrypt.md) - Decryption action
- [Getting Started - React](../../getting-started/quick-start-react.md)
- [Actions API](../actions/README.md)
