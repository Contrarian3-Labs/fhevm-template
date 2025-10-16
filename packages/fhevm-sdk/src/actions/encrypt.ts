/**
 * encrypt Action
 *
 * Pure function for encrypting values for FHEVM contracts
 * Extracted from react/useFHEEncryption.ts (lines 72-101)
 * Following Wagmi action pattern: (config, parameters) => Promise<Result>
 */

import type { FhevmConfig } from '../createConfig.js'
import type { FhevmInstance } from '../fhevmTypes.js'
import type { RelayerEncryptedInput } from '@zama-fhe/relayer-sdk/web'

/////////////////////////////////////////////////////////////////////////////////////////////////
// Types
/////////////////////////////////////////////////////////////////////////////////////////////////

export type EncryptParameters = {
  instance: FhevmInstance
  contractAddress: `0x${string}`
  userAddress: `0x${string}`
  values: Array<{ type: EncryptionType; value: any }>
}

export type EncryptionType =
  | 'ebool'
  | 'euint8'
  | 'euint16'
  | 'euint32'
  | 'euint64'
  | 'euint128'
  | 'euint256'
  | 'eaddress'

export type EncryptResult = {
  handles: Uint8Array[]
  inputProof: Uint8Array
}

export type EncryptReturnType = EncryptResult

/////////////////////////////////////////////////////////////////////////////////////////////////
// Helper Functions
/////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Map FHEVM type to RelayerEncryptedInput builder method
 */
export const getEncryptionMethod = (type: EncryptionType) => {
  switch (type) {
    case 'ebool':
      return 'addBool' as const
    case 'euint8':
      return 'add8' as const
    case 'euint16':
      return 'add16' as const
    case 'euint32':
      return 'add32' as const
    case 'euint64':
      return 'add64' as const
    case 'euint128':
      return 'add128' as const
    case 'euint256':
      return 'add256' as const
    case 'eaddress':
      return 'addAddress' as const
    default:
      console.warn(`Unknown encryption type: ${type}, defaulting to add64`)
      return 'add64' as const
  }
}

/**
 * Convert Uint8Array or hex-like string to 0x-prefixed hex string
 */
export const toHex = (value: Uint8Array | string): `0x${string}` => {
  if (typeof value === 'string') {
    return (value.startsWith('0x') ? value : `0x${value}`) as `0x${string}`
  }
  // value is Uint8Array
  return ('0x' + Buffer.from(value).toString('hex')) as `0x${string}`
}

/**
 * Build contract params from EncryptResult and ABI for a given function
 */
export const buildParamsFromAbi = (
  enc: EncryptResult,
  abi: any[],
  functionName: string
): any[] => {
  const fn = abi.find((item: any) => item.type === 'function' && item.name === functionName)
  if (!fn) throw new Error(`Function ABI not found for ${functionName}`)

  return fn.inputs.map((input: any, index: number) => {
    const raw = index === 0 ? enc.handles[0] : enc.inputProof
    switch (input.type) {
      case 'bytes32':
      case 'bytes':
        return toHex(raw)
      case 'uint256':
        return BigInt(raw as unknown as string)
      case 'address':
      case 'string':
        return raw as unknown as string
      case 'bool':
        return Boolean(raw)
      default:
        console.warn(`Unknown ABI param type ${input.type}; passing as hex`)
        return toHex(raw)
    }
  })
}

/////////////////////////////////////////////////////////////////////////////////////////////////
// Main Action
/////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Encrypts values for FHEVM contract input
 *
 * @param config - FHEVM configuration object
 * @param parameters - Encryption parameters
 * @returns Promise resolving to encrypted handles and proof
 *
 * @example
 * ```ts
 * const config = createFhevmConfig({ chains: [31337] })
 * const instance = await createInstance(config, { provider })
 *
 * const encrypted = await encrypt(config, {
 *   instance,
 *   contractAddress: '0x...',
 *   userAddress: '0x...',
 *   values: [
 *     { type: 'euint8', value: 42 },
 *     { type: 'ebool', value: true },
 *   ],
 * })
 * ```
 */
export async function encrypt<config extends FhevmConfig>(
  config: config,
  parameters: EncryptParameters,
): Promise<EncryptReturnType> {
  const { instance, contractAddress, userAddress, values } = parameters

  // Create encrypted input
  const input = instance.createEncryptedInput(
    contractAddress,
    userAddress
  ) as RelayerEncryptedInput

  // Add all values to the input
  for (const { type, value } of values) {
    const method = getEncryptionMethod(type)

    // Validate method exists on input builder
    if (typeof (input as any)[method] !== 'function') {
      throw new Error(
        `Invalid encryption method: ${method} for type: ${type}. ` +
        `This may indicate a version mismatch with the FHEVM SDK.`
      )
    }

    // Call the appropriate method on the input builder with error handling
    try {
      ;(input as any)[method](value)
    } catch (error) {
      throw new Error(
        `Failed to encrypt value of type ${type}: ${(error as Error).message}`,
        { cause: error }
      )
    }
  }

  // Encrypt and return
  const encrypted = await input.encrypt()
  return encrypted
}

/**
 * Advanced encrypt function with custom builder
 *
 * @param config - FHEVM configuration object
 * @param parameters - Encryption parameters with custom builder function
 * @returns Promise resolving to encrypted result
 *
 * @example
 * ```ts
 * const encrypted = await encryptWith(config, {
 *   instance,
 *   contractAddress: '0x...',
 *   userAddress: '0x...',
 *   buildFn: (builder) => {
 *     builder.add8(42)
 *     builder.addBool(true)
 *     builder.add64(1000000n)
 *   },
 * })
 * ```
 */
export async function encryptWith<config extends FhevmConfig>(
  config: config,
  parameters: {
    instance: FhevmInstance
    contractAddress: `0x${string}`
    userAddress: `0x${string}`
    buildFn: (builder: RelayerEncryptedInput) => void
  },
): Promise<EncryptReturnType> {
  const { instance, contractAddress, userAddress, buildFn } = parameters

  const input = instance.createEncryptedInput(
    contractAddress,
    userAddress
  ) as RelayerEncryptedInput

  buildFn(input)

  const encrypted = await input.encrypt()
  return encrypted
}
