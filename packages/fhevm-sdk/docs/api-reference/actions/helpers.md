---
description: Helper functions for encryption and contract integration.
---

# Helper Functions

FHEVM SDK provides helper functions to simplify encryption workflows and contract integration.

## getEncryptionMethod()

Maps FHEVM encrypted types to RelayerEncryptedInput builder method names.

### Type Signature

```typescript
function getEncryptionMethod(type: string): 
  | 'addBool'
  | 'add8'
  | 'add16'
  | 'add32'
  | 'add64'
  | 'add128'
  | 'add256'
  | 'addAddress'
```

### Parameters

- `type` - FHEVM encrypted type (e.g., 'euint8', 'ebool', 'externalEuint32')

### Returns

Builder method name as const string.

### Example

```typescript
import { getEncryptionMethod } from '@fhevm-sdk/actions'

const method = getEncryptionMethod('euint8')  // 'add8'
const method2 = getEncryptionMethod('ebool')  // 'addBool'

// Use with builder
const input = instance.createEncryptedInput(contractAddr, userAddr)
input[method](42)  // Calls input.add8(42)
```

### Type Mapping

| FHEVM Type | Builder Method | Value Type |
|------------|----------------|------------|
| `ebool` | `addBool` | boolean |
| `euint8` | `add8` | number |
| `euint16` | `add16` | number |
| `euint32` | `add32` | number |
| `euint64` | `add64` | bigint |
| `euint128` | `add128` | bigint |
| `euint256` | `add256` | bigint |
| `eaddress` | `addAddress` | string |

### External Types

Automatically strips Solidity ABI `external` prefix:

```typescript
getEncryptionMethod('externalEuint32')  // 'add32'
getEncryptionMethod('euint32')          // 'add32'
// Both return same result
```

### Throws

Throws `Error` if type is unknown or unsupported.

```typescript
try {
  getEncryptionMethod('invalid')
} catch (error) {
  console.error(error.message)
  // "Unknown encryption type: "invalid" (normalized: "invalid")"
}
```

## toHex()

Converts Uint8Array or string to 0x-prefixed hex string for contract calls.

### Type Signature

```typescript
function toHex(value: Uint8Array | string): `0x${string}`
```

### Parameters

- `value` - Uint8Array from encryption result OR hex string (with or without 0x prefix)

### Returns

0x-prefixed hex string compatible with ethers.js contract calls.

### Example

```typescript
import { toHex } from '@fhevm-sdk/actions'

// Uint8Array → hex
toHex(new Uint8Array([1, 2, 3]))  // '0x010203'

// String → hex (adds 0x if missing)
toHex('abcd')    // '0xabcd'
toHex('0xabcd')  // '0xabcd' (unchanged)
```

### Use Cases

#### 1. Converting Encrypted Handles

```typescript
const encrypted = await encrypt(config, { ... })

// Convert handle to hex for contract call
const hexHandle = toHex(encrypted.handles[0])
await contract.setValue(hexHandle)
```

#### 2. Converting Proofs

```typescript
const hexProof = toHex(encrypted.inputProof)
await contract.setValue(hexHandle, hexProof)
```

## buildParamsFromAbi()

Converts EncryptResult to contract function parameters based on ABI definition.

### Type Signature

```typescript
function buildParamsFromAbi(
  enc: EncryptResult,
  abi: any[],
  functionName: string
): any[]
```

### Parameters

- `enc` - Encryption result from `encrypt()` or `encryptWith()`
- `abi` - Contract ABI array (standard ethers.js format)
- `functionName` - Target function name in ABI

### Returns

Array of properly typed parameters for contract call.

### Example

#### Basic Usage

```typescript
import { encrypt, buildParamsFromAbi } from '@fhevm-sdk/actions'

// 1. Encrypt value
const encrypted = await encrypt(config, {
  instance,
  contractAddress: contract.address,
  userAddress: await signer.getAddress(),
  values: [{ type: 'euint8', value: 42 }]
})

// 2. Build contract parameters from ABI
const params = buildParamsFromAbi(
  encrypted,
  contractAbi,
  'setValue'  // Function name
)

// 3. Call contract
await contract.setValue(...params)
```

#### With Function Signature

```solidity
// Contract function:
function setValue(bytes32 handle, bytes memory proof) external
```

```typescript
const params = buildParamsFromAbi(encrypted, abi, 'setValue')
// Returns: ['0x1234...', '0xabcd...']

await contract.setValue(params[0], params[1])
// Or spread:
await contract.setValue(...params)
```

### Type Conversion

The function automatically converts based on ABI type:

| ABI Type | Conversion |
|----------|------------|
| `bytes`/`bytes32` | Uint8Array → hex string (via toHex) |
| `uint256` | Uint8Array → hex → BigInt |
| `address`/`string` | Pass through as string |
| `bool` | Convert to boolean |

#### bytes/bytes32 Example

```solidity
function setValue(bytes32 handle, bytes proof) external
```

```typescript
const params = buildParamsFromAbi(encrypted, abi, 'setValue')
// ['0x1234...', '0xabcd...']
```

#### uint256 Example

```solidity
function setValue(uint256 handle, bytes proof) external
```

```typescript
const params = buildParamsFromAbi(encrypted, abi, 'setValue')
// [12345678901234567890n, '0xabcd...']
```

### Parameter Mapping

- **Index 0:** First encrypted handle (`enc.handles[0]`)
- **Index 1+:** Input proof (`enc.inputProof`)

```typescript
const params = buildParamsFromAbi(encrypted, abi, 'setValue')
// params[0] = encrypted.handles[0] (converted based on ABI)
// params[1] = encrypted.inputProof (converted based on ABI)
```

### Throws

Throws `Error` if function not found in ABI:

```typescript
try {
  buildParamsFromAbi(encrypted, abi, 'nonexistent')
} catch (error) {
  console.error(error.message)
  // "Function ABI not found for nonexistent"
}
```

### Advanced Usage

#### Multiple Handles

For functions that accept multiple handles:

```solidity
function setValues(
  bytes32 handle1,
  bytes32 handle2,
  bytes proof
) external
```

```typescript
// Encrypt multiple values
const encrypted = await encrypt(config, {
  instance,
  contractAddress,
  userAddress,
  values: [
    { type: 'euint32', value: 100 },
    { type: 'euint32', value: 200 }
  ]
})

// Manual parameter construction
await contract.setValues(
  toHex(encrypted.handles[0]),
  toHex(encrypted.handles[1]),
  toHex(encrypted.inputProof)
)
```

#### Unknown ABI Types

For unknown types, defaults to hex conversion:

```typescript
// Unknown type in ABI
const params = buildParamsFromAbi(encrypted, abi, 'customFunction')
// Converts to hex with warning:
// console.warn(`Unknown ABI param type ${input.type}; passing as hex`)
```

## Common Workflows

### Workflow 1: Simple Contract Call

```typescript
import { encrypt, buildParamsFromAbi } from '@fhevm-sdk/actions'

// Encrypt → Build Params → Call
const encrypted = await encrypt(config, { ... })
const params = buildParamsFromAbi(encrypted, abi, 'setValue')
await contract.setValue(...params)
```

### Workflow 2: Manual Type Conversion

```typescript
import { encrypt, toHex } from '@fhevm-sdk/actions'

const encrypted = await encrypt(config, { ... })

// Manual conversion
const handleHex = toHex(encrypted.handles[0])
const proofHex = toHex(encrypted.inputProof)

// Call with specific types
await contract.setValue(handleHex, proofHex)
```

### Workflow 3: Dynamic Type Mapping

```typescript
import { getEncryptionMethod } from '@fhevm-sdk/actions'

function encryptDynamic(type: EncryptionType, value: any) {
  const method = getEncryptionMethod(type)
  const input = instance.createEncryptedInput(contractAddr, userAddr)
  
  input[method](value)
  
  return input.encrypt()
}

// Use
const encrypted = await encryptDynamic('euint32', 1000)
```

## Error Handling

All helpers throw on invalid input:

```typescript
import { 
  getEncryptionMethod, 
  toHex, 
  buildParamsFromAbi 
} from '@fhevm-sdk/actions'

try {
  getEncryptionMethod('invalid')
} catch (error) {
  // Handle unknown type
}

try {
  buildParamsFromAbi(encrypted, abi, 'nonexistent')
} catch (error) {
  // Handle missing function
}

// toHex never throws (accepts any Uint8Array or string)
const hex = toHex(anyValue)
```

## See Also

- [encrypt()](encrypt.md) - Main encryption action
- [decrypt()](decrypt.md) - Main decryption action
- [Core Concepts: Encryption](../../core-concepts/encryption.md)
- [Example: Encrypted Counter](../../examples/encrypted-counter.md)

## Type Definitions

```typescript
type EncryptionType =
  | 'ebool'
  | 'euint8'
  | 'euint16'
  | 'euint32'
  | 'euint64'
  | 'euint128'
  | 'euint256'
  | 'eaddress'

type EncryptResult = {
  handles: Uint8Array[]
  inputProof: Uint8Array
}

function getEncryptionMethod(type: string): string

function toHex(value: Uint8Array | string): `0x${string}`

function buildParamsFromAbi(
  enc: EncryptResult,
  abi: any[],
  functionName: string
): any[]
```
