---
description: Vue composables for FHEVM operations.
---

# Vue API

Vue adapter provides the same `useFhevm()` composable as React, following Vue 3 Composition API patterns.

## Import Path

```typescript
import { useFhevm } from '@fhevm-sdk/vue'
import { encrypt, decrypt } from '@fhevm-sdk/actions'
```

## Composable

- `useFhevm()` - Manage FHEVM instance lifecycle (same API as React)

## Pattern

The Vue adapter follows the **composables + actions** pattern:

1. **`useFhevm()`** - Manages FHEVM instance (reactive state, auto-refresh, abort control)
2. **Actions** - Use `encrypt()` and `decrypt()` from `@fhevm-sdk/actions` directly

This keeps Vue concerns (reactivity, lifecycle) separate from business logic (encryption, decryption).

## Quick Example

```vue
<script setup lang="ts">
import { useFhevm } from '@fhevm-sdk/vue'
import { encrypt, decrypt } from '@fhevm-sdk/actions'
import { createFhevmConfig } from '@fhevm-sdk/core'
import { ref } from 'vue'

// 1. Create config (outside component)
const config = createFhevmConfig({
  chains: [31337],
  mockChains: {
    31337: 'http://localhost:8545'
  }
})

// 2. Use in component
const { instance, status, error, refresh } = useFhevm({
  provider: window.ethereum,
  chainId: 31337,
  enabled: true
})

const handleEncrypt = async () => {
  if (!instance.value) return

  const encrypted = await encrypt(config, {
    instance: instance.value,
    contractAddress: '0xContract...',
    userAddress: await signer.getAddress(),
    values: [{ type: 'euint8', value: 1 }]
  })

  // Use encrypted.handles and encrypted.inputProof
}

const handleDecrypt = async (handle: string) => {
  if (!instance.value) return

  const decrypted = await decrypt(config, {
    instance: instance.value,
    requests: [{ handle, contractAddress: '0xContract...' }],
    signer: await provider.getSigner(),
    storage: config.storage
  })

  console.log(decrypted[handle])
}
</script>

<template>
  <div v-if="status === 'loading'">Loading FHEVM...</div>
  <div v-else-if="error">Error: {{ error.message }}</div>
  <div v-else-if="status === 'idle'">Connect wallet first</div>
  <div v-else>
    <button @click="handleEncrypt" :disabled="status !== 'ready'">
      Encrypt Value
    </button>
    <button @click="handleDecrypt('0x...')" :disabled="status !== 'ready'">
      Decrypt Value
    </button>
    <button @click="refresh">Refresh Instance</button>
  </div>
</template>
```

## Composable State

`useFhevm()` returns reactive refs:

```typescript
{
  instance: Ref<FhevmInstance | undefined>  // FHEVM instance when ready
  status: Ref<'idle' | 'loading' | 'ready' | 'error'>  // Instance state
  error: Ref<Error | undefined>  // Error if creation failed
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
- **Vue composable** manages lifecycle and reactivity (what Vue is good at)
- **Actions** provide framework-agnostic business logic (reusable in React, vanilla JS)

**Benefits:**
- Easier testing (actions are pure functions)
- Better code reuse (same encrypt/decrypt in React and Vue)
- Smaller bundle (one instance manager instead of separate composables)
- Simpler API (one composable to learn, then use actions)

## React vs Vue API

The API is **identical** between React and Vue, except:

| Feature | React | Vue |
|---------|-------|-----|
| Return values | Direct values | Reactive refs |
| Instance access | `instance` | `instance.value` |
| Status access | `status` | `status.value` |
| Error access | `error` | `error.value` |

**Example:**

```typescript
// React
const { instance, status } = useFhevm({ ... })
if (instance) { /* use instance */ }

// Vue
const { instance, status } = useFhevm({ ... })
if (instance.value) { /* use instance.value */ }
```

## See Also

- [`encrypt()`](../actions/encrypt.md) - Encryption action
- [`decrypt()`](../actions/decrypt.md) - Decryption action
- [Getting Started - Vue](../../getting-started/quick-start-vue.md)
- [React API](../react/README.md) - Same pattern, React version
- [Actions API](../actions/README.md)
